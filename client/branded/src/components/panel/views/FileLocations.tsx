import classNames from 'classnames'
import * as H from 'history'
import { upperFirst } from 'lodash'
import MapSearchIcon from 'mdi-react/MapSearchIcon'
import * as React from 'react'
import { Observable, Subject, Subscription } from 'rxjs'
import { catchError, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators'
import { Badged } from 'sourcegraph'

import { Location } from '@sourcegraph/extension-api-types'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { FetchFileParameters } from '@sourcegraph/shared/src/components/CodeExcerpt'
import { FileMatch } from '@sourcegraph/shared/src/components/FileMatch'
import { VirtualList } from '@sourcegraph/shared/src/components/VirtualList'
import { ContentMatch } from '@sourcegraph/shared/src/search/stream'
import { VersionContextProps } from '@sourcegraph/shared/src/search/util'
import { SettingsCascadeProps } from '@sourcegraph/shared/src/settings/settings'
import { TelemetryProps } from '@sourcegraph/shared/src/telemetry/telemetryService'
import { asError, ErrorLike, isErrorLike } from '@sourcegraph/shared/src/util/errors'
import { isDefined, property } from '@sourcegraph/shared/src/util/types'
import { parseRepoURI } from '@sourcegraph/shared/src/util/url'

export const FileLocationsError: React.FunctionComponent<{ error: ErrorLike }> = ({ error }) => (
    <div className="file-locations__error alert alert-danger m-2">
        Error getting locations: {upperFirst(error.message)}
    </div>
)

export const FileLocationsNotFound: React.FunctionComponent = () => (
    <div className="file-locations__not-found m-2">
        <MapSearchIcon className="icon-inline" /> No locations found
    </div>
)

export const FileLocationsNoGroupSelected: React.FunctionComponent = () => (
    <div className="file-locations__no-group-selected m-2">
        <MapSearchIcon className="icon-inline" /> No locations found in the current repository
    </div>
)

interface Props extends SettingsCascadeProps, VersionContextProps, TelemetryProps {
    location: H.Location
    /**
     * The observable that emits the locations.
     */
    locations: Observable<Location[] | null>

    /** The icon to use for each location. */
    icon: React.ComponentType<{ className?: string }>

    /** Called when a location is selected. */
    onSelect?: () => void

    className?: string

    fetchHighlightedFileLineRanges: (parameters: FetchFileParameters, force?: boolean) => Observable<string[][]>

    /** Whether or not there are other groups in the parent container with results. */
    parentContainerIsEmpty: boolean
}

const LOADING = 'loading' as const

interface State {
    /**
     * Locations (inside files identified by LSP-style git:// URIs) to display, loading, or an error if they failed
     * to load.
     */
    locationsOrError: typeof LOADING | Location[] | null | ErrorLike

    itemsToShow: number
}

interface OrderedURI {
    uri: string
    repo: string
}

/**
 * Displays a flat list of file excerpts. For a tree view, use FileLocationsTree.
 */
export class FileLocations extends React.PureComponent<Props, State> {
    public state: State = {
        locationsOrError: LOADING,
        itemsToShow: 3,
    }

    private componentUpdates = new Subject<Props>()
    private subscriptions = new Subscription()

    public componentDidMount(): void {
        const locationsChanges = this.componentUpdates.pipe(
            map(({ locations }) => locations),
            distinctUntilChanged()
        )

        this.subscriptions.add(
            locationsChanges
                .pipe(
                    switchMap(query => query.pipe(catchError(error => [asError(error) as ErrorLike]))),
                    startWith(LOADING),
                    map(result => ({ locationsOrError: result }))
                )
                .subscribe(
                    stateUpdate => this.setState(stateUpdate),
                    error => console.error(error)
                )
        )

        this.componentUpdates.next(this.props)
    }

    public componentDidUpdate(): void {
        this.componentUpdates.next(this.props)
    }

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        if (isErrorLike(this.state.locationsOrError)) {
            return <FileLocationsError error={this.state.locationsOrError} />
        }
        if (this.state.locationsOrError === LOADING) {
            return <LoadingSpinner className="icon-inline m-1" />
        }
        if (this.state.locationsOrError === null || this.state.locationsOrError.length === 0) {
            return this.props.parentContainerIsEmpty ? <FileLocationsNotFound /> : <FileLocationsNoGroupSelected />
        }

        // Locations by fully qualified URI, like git://github.com/gorilla/mux?revision#mux.go
        const locationsByURI = new Map<string, Location[]>()

        // URIs with >0 locations, in order (to avoid jitter as more results stream in).
        const orderedURIs: { uri: string; repo: string }[] = []

        if (this.state.locationsOrError) {
            for (const location of this.state.locationsOrError) {
                if (!locationsByURI.has(location.uri)) {
                    locationsByURI.set(location.uri, [])

                    const { repoName } = parseRepoURI(location.uri)
                    orderedURIs.push({ uri: location.uri, repo: repoName })
                }
                locationsByURI.get(location.uri)!.push(location)
            }
        }

        return (
            <div className={classNames('file-locations', this.props.className)}>
                <VirtualList<OrderedURI, { locationsByURI: Map<string, Location[]> }>
                    itemsToShow={this.state.itemsToShow}
                    onShowMoreItems={this.onShowMoreItems}
                    items={orderedURIs}
                    renderItem={this.renderFileMatch}
                    itemProps={{ locationsByURI }}
                    itemKey={this.itemKey}
                />
            </div>
        )
    }

    private onShowMoreItems = (): void => {
        this.setState(state => ({ itemsToShow: state.itemsToShow + 3 }))
    }

    private onSelect = (): void => {
        if (this.props.onSelect) {
            this.props.onSelect()
        }
    }

    private itemKey = (item: OrderedURI): string => item.uri

    private renderFileMatch = (
        { uri }: OrderedURI,
        { locationsByURI }: { locationsByURI: Map<string, Location[]> }
    ): JSX.Element => (
        <FileMatch
            location={this.props.location}
            telemetryService={this.props.telemetryService}
            expanded={true}
            result={referencesToContentMatch(uri, locationsByURI.get(uri)!)}
            icon={this.props.icon}
            onSelect={this.onSelect}
            showAllMatches={true}
            fetchHighlightedFileLineRanges={this.props.fetchHighlightedFileLineRanges}
            settingsCascade={this.props.settingsCascade}
        />
    )
}

function referencesToContentMatch(uri: string, references: Badged<Location>[]): ContentMatch {
    const parsedUri = parseRepoURI(uri)
    return {
        type: 'content',
        path: parsedUri.filePath || '',
        commit: (parsedUri.commitID || parsedUri.revision)!,
        repository: parsedUri.repoName,
        lineMatches: references.filter(property('range', isDefined)).map(reference => ({
            line: '',
            lineNumber: reference.range.start.line,
            offsetAndLengths: [
                [reference.range.start.character, reference.range.end.character - reference.range.start.character],
            ],
            aggregableBadges: reference.aggregableBadges,
        })),
    }
}
