import classNames from 'classnames'
import * as H from 'history'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Observable } from 'rxjs'

import { ActivationProps } from '@sourcegraph/shared/src/components/activation/Activation'
import { FetchFileParameters } from '@sourcegraph/shared/src/components/CodeExcerpt'
import { Link } from '@sourcegraph/shared/src/components/Link'
import { ExtensionsControllerProps } from '@sourcegraph/shared/src/extensions/controller'
import { SearchPatternType } from '@sourcegraph/shared/src/graphql-operations'
import { PlatformContextProps } from '@sourcegraph/shared/src/platform/context'
import { collectMetrics } from '@sourcegraph/shared/src/search/query/metrics'
import { updateFilters } from '@sourcegraph/shared/src/search/query/transformer'
import { StreamSearchOptions } from '@sourcegraph/shared/src/search/stream'
import { SettingsCascadeProps } from '@sourcegraph/shared/src/settings/settings'
import { TelemetryProps } from '@sourcegraph/shared/src/telemetry/telemetryService'
import { ThemeProps } from '@sourcegraph/shared/src/theme'
import { asError } from '@sourcegraph/shared/src/util/errors'

import {
    CaseSensitivityProps,
    PatternTypeProps,
    SearchStreamingProps,
    resolveVersionContext,
    ParsedSearchQueryProps,
    MutableVersionContextProps,
    SearchContextProps,
} from '..'
import { AuthenticatedUser } from '../../auth'
import { CodeMonitoringProps } from '../../code-monitoring'
import { PageTitle } from '../../components/PageTitle'
import { FeatureFlagProps } from '../../featureFlags/featureFlags'
import { CodeInsightsProps } from '../../insights/types'
import { isCodeInsightsEnabled } from '../../insights/utils/is-code-insights-enabled'
import { SavedSearchModal } from '../../savedSearches/SavedSearchModal'
import { SearchBetaIcon } from '../CtaIcons'
import { getSubmittedSearchesCount, submitSearch } from '../helpers'

import { StreamingProgress } from './progress/StreamingProgress'
import { SearchAlert } from './SearchAlert'
import { useCachedSearchResults } from './SearchResultsCacheProvider'
import { SearchResultsInfoBar } from './SearchResultsInfoBar'
import { SearchSidebar } from './sidebar/SearchSidebar'
import styles from './StreamingSearchResults.module.scss'
import { StreamingSearchResultsList } from './StreamingSearchResultsList'
import { VersionContextWarning } from './VersionContextWarning'

export interface StreamingSearchResultsProps
    extends SearchStreamingProps,
        Pick<ActivationProps, 'activation'>,
        Pick<ParsedSearchQueryProps, 'parsedSearchQuery'>,
        Pick<PatternTypeProps, 'patternType'>,
        Pick<MutableVersionContextProps, 'versionContext' | 'availableVersionContexts' | 'previousVersionContext'>,
        Pick<CaseSensitivityProps, 'caseSensitive'>,
        Pick<SearchContextProps, 'selectedSearchContextSpec'>,
        SettingsCascadeProps,
        ExtensionsControllerProps<'executeCommand' | 'extHostAPI'>,
        PlatformContextProps<'forceUpdateTooltip' | 'settings'>,
        TelemetryProps,
        ThemeProps,
        CodeMonitoringProps,
        CodeInsightsProps,
        FeatureFlagProps {
    authenticatedUser: AuthenticatedUser | null
    location: H.Location
    history: H.History

    fetchHighlightedFileLineRanges: (parameters: FetchFileParameters, force?: boolean) => Observable<string[][]>
}

/** All values that are valid for the `type:` filter. `null` represents default code search. */
export type SearchType = 'file' | 'repo' | 'path' | 'symbol' | 'diff' | 'commit' | null

// The latest supported version of our search syntax. Users should never be able to determine the search version.
// The version is set based on the release tag of the instance. Anything before 3.9.0 will not pass a version parameter,
// and will therefore default to V1.
export const LATEST_VERSION = 'V2'

export const StreamingSearchResults: React.FunctionComponent<StreamingSearchResultsProps> = props => {
    const {
        parsedSearchQuery: query,
        patternType,
        caseSensitive,
        versionContext,
        streamSearch,
        location,
        history,
        availableVersionContexts,
        previousVersionContext,
        authenticatedUser,
        telemetryService,
        codeInsightsEnabled,
    } = props

    // Log view event on first load
    useEffect(
        () => {
            telemetryService.logViewEvent('SearchResults')
        },
        // Only log view on initial load
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    // Log search query event when URL changes
    useEffect(() => {
        telemetryService.log('SearchResultsQueried', {
            code_search: {
                query_data: {
                    // 🚨 PRIVACY: never provide any private data in the `query` field,
                    // which maps to { code_search: { query_data: { query } } } in the event logs,
                    // and potentially exported in pings data.

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    query: query ? collectMetrics(query) : undefined,
                    combined: query,
                    empty: !query,
                },
            },
        })
    }, [caseSensitive, query, telemetryService])

    const trace = useMemo(() => new URLSearchParams(location.search).get('trace') ?? undefined, [location.search])

    const options: StreamSearchOptions = useMemo(
        () => ({
            query,
            version: LATEST_VERSION,
            patternType: patternType ?? SearchPatternType.literal,
            caseSensitive,
            versionContext: resolveVersionContext(versionContext, availableVersionContexts),
            trace,
        }),
        [availableVersionContexts, caseSensitive, patternType, query, trace, versionContext]
    )

    const results = useCachedSearchResults(streamSearch, options)

    // Log events when search completes or fails
    useEffect(() => {
        if (results?.state === 'complete') {
            telemetryService.log('SearchResultsFetched', {
                code_search: {
                    // 🚨 PRIVACY: never provide any private data in { code_search: { results } }.
                    results: {
                        results_count: results.results.length,
                        any_cloning: results.progress.skipped.some(skipped => skipped.reason === 'repository-cloning'),
                        alert: results.alert ? results.alert.title : null,
                    },
                },
            })
        } else if (results?.state === 'error') {
            telemetryService.log('SearchResultsFetchFailed', {
                code_search: { error_message: asError(results.error).message },
            })
            console.error(results.error)
        }
    }, [results, telemetryService])

    const [allExpanded, setAllExpanded] = useState(false)
    const onExpandAllResultsToggle = useCallback(() => {
        setAllExpanded(oldValue => !oldValue)
        telemetryService.log(allExpanded ? 'allResultsExpanded' : 'allResultsCollapsed')
    }, [allExpanded, telemetryService])

    const [showSavedSearchModal, setShowSavedSearchModal] = useState(false)
    const onSaveQueryClick = useCallback(() => setShowSavedSearchModal(true), [])
    const onSaveQueryModalClose = useCallback(() => {
        setShowSavedSearchModal(false)
        telemetryService.log('SavedQueriesToggleCreating', { queries: { creating: false } })
    }, [telemetryService])

    const [showVersionContextWarning, setShowVersionContextWarning] = useState(false)
    useEffect(
        () => {
            const searchParameters = new URLSearchParams(location.search)
            const versionFromURL = searchParameters.get('c')

            if (searchParameters.has('from-context-toggle')) {
                // The query param `from-context-toggle` indicates that the version context
                // changed from the version context toggle. In this case, we don't warn
                // users that the version context has changed.
                searchParameters.delete('from-context-toggle')
                history.replace({
                    search: searchParameters.toString(),
                    hash: history.location.hash,
                })
                setShowVersionContextWarning(false)
            } else {
                setShowVersionContextWarning(
                    (availableVersionContexts && versionFromURL !== previousVersionContext) || false
                )
            }
        },
        // Only show warning when URL changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [location.search]
    )
    const onDismissVersionContextWarning = useCallback(() => setShowVersionContextWarning(false), [
        setShowVersionContextWarning,
    ])

    // Reset expanded state when new search is started
    useEffect(() => {
        setAllExpanded(false)
    }, [location.search])

    const onSearchAgain = useCallback(
        (additionalFilters: string[]) => {
            telemetryService.log('SearchSkippedResultsAgainClicked')
            submitSearch({
                ...props,
                query: applyAdditionalFilters(query, additionalFilters),
                source: 'excludedResults',
            })
        },
        [query, telemetryService, props]
    )
    const [showSidebar, setShowSidebar] = useState(false)

    const onSignUpClick = (): void => {
        telemetryService.log('SignUpPLGSearchCTA_1_Search')
    }

    const resultsFound = results ? results.results.length > 0 : false
    const submittedSearchesCount = getSubmittedSearchesCount()
    const isValidSignUpCtaCadence = submittedSearchesCount < 5 || submittedSearchesCount % 5 === 0
    const showSignUpCta = !authenticatedUser && resultsFound && isValidSignUpCtaCadence

    // Log view event when signup CTA is shown
    useEffect(() => {
        if (showSignUpCta) {
            telemetryService.log('SearchResultResultsCTAShown')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSignUpCta])

    return (
        <div className={styles.streamingSearchResults}>
            <PageTitle key="page-title" title={query} />

            <SearchSidebar
                activation={props.activation}
                caseSensitive={props.caseSensitive}
                patternType={props.patternType}
                settingsCascade={props.settingsCascade}
                telemetryService={props.telemetryService}
                versionContext={props.versionContext}
                selectedSearchContextSpec={props.selectedSearchContextSpec}
                className={classNames(
                    styles.streamingSearchResultsSidebar,
                    showSidebar && styles.streamingSearchResultsSidebarShow
                )}
                filters={results?.filters}
            />

            <SearchResultsInfoBar
                {...props}
                query={query}
                enableCodeInsights={codeInsightsEnabled && isCodeInsightsEnabled(props.settingsCascade)}
                resultsFound={resultsFound}
                className={classNames('flex-grow-1', styles.streamingSearchResultsInfobar)}
                allExpanded={allExpanded}
                onExpandAllResultsToggle={onExpandAllResultsToggle}
                onSaveQueryClick={onSaveQueryClick}
                onShowFiltersChanged={show => setShowSidebar(show)}
                stats={
                    <StreamingProgress
                        progress={results?.progress || { durationMs: 0, matchCount: 0, skipped: [] }}
                        state={results?.state || 'loading'}
                        onSearchAgain={onSearchAgain}
                        showTrace={!!trace}
                    />
                }
            />

            <div className={styles.streamingSearchResultsContainer}>
                {showVersionContextWarning && (
                    <VersionContextWarning
                        versionContext={versionContext}
                        onDismissWarning={onDismissVersionContextWarning}
                    />
                )}

                {showSavedSearchModal && (
                    <SavedSearchModal
                        {...props}
                        query={query}
                        authenticatedUser={authenticatedUser}
                        onDidCancel={onSaveQueryModalClose}
                    />
                )}

                {results?.alert && (
                    <SearchAlert
                        alert={results.alert}
                        caseSensitive={caseSensitive}
                        patternType={patternType}
                        versionContext={versionContext}
                    />
                )}

                {showSignUpCta && (
                    <div className="card my-2 mr-3 d-flex p-3 flex-row align-items-center">
                        <div className="mr-3">
                            <SearchBetaIcon />
                        </div>
                        <div className="flex-1">
                            <div className={classNames('mb-1', styles.streamingSearchResultsCtaTitle)}>
                                <strong>
                                    Sign up to add your public and private repositories and unlock search flow
                                </strong>
                            </div>
                            <div className={classNames('text-muted', styles.streamingSearchResultsCtaDescription)}>
                                Do all the things editors can’t: search multiple repos & commit history, monitor, save
                                searches and more.
                            </div>
                        </div>
                        <Link
                            className="btn btn-primary"
                            to={`/sign-up?src=SearchCTA&returnTo=${encodeURIComponent('/user/settings/repositories')}`}
                            onClick={onSignUpClick}
                        >
                            Create a free account
                        </Link>
                    </div>
                )}

                <StreamingSearchResultsList {...props} results={results} allExpanded={allExpanded} />
            </div>
        </div>
    )
}

const applyAdditionalFilters = (query: string, additionalFilters: string[]): string => {
    let newQuery = query
    for (const filter of additionalFilters) {
        const fieldValue = filter.split(':', 2)
        newQuery = updateFilters(newQuery, fieldValue[0], fieldValue[1])
    }
    return newQuery
}
