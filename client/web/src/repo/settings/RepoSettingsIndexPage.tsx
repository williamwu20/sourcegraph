import classNames from 'classnames'
import CheckCircleIcon from 'mdi-react/CheckCircleIcon'
import prettyBytes from 'pretty-bytes'
import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Link } from 'react-router-dom'
import { Observable, Subject, Subscription } from 'rxjs'
import { map, switchMap, tap } from 'rxjs/operators'

import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { LinkOrSpan } from '@sourcegraph/shared/src/components/LinkOrSpan'
import { gql } from '@sourcegraph/shared/src/graphql/graphql'
import * as GQL from '@sourcegraph/shared/src/graphql/schema'
import { createAggregateError } from '@sourcegraph/shared/src/util/errors'
import { pluralize } from '@sourcegraph/shared/src/util/strings'
import { Container, PageHeader } from '@sourcegraph/wildcard'

import { queryGraphQL } from '../../backend/graphql'
import { ErrorAlert } from '../../components/alerts'
import { PageTitle } from '../../components/PageTitle'
import { Timestamp } from '../../components/time/Timestamp'
import { Scalars, SettingsAreaRepositoryFields } from '../../graphql-operations'
import { eventLogger } from '../../tracking/eventLogger'

/**
 * Fetches a repository's text search index information.
 */
function fetchRepositoryTextSearchIndex(id: Scalars['ID']): Observable<GQL.IRepositoryTextSearchIndex | null> {
    return queryGraphQL(
        gql`
            query RepositoryTextSearchIndex($id: ID!) {
                node(id: $id) {
                    ... on Repository {
                        textSearchIndex {
                            status {
                                updatedAt
                                contentByteSize
                                contentFilesCount
                                indexByteSize
                                indexShardsCount
                                newLinesCount
                                defaultBranchNewLinesCount
                                otherBranchesNewLinesCount
                            }
                            refs {
                                ref {
                                    displayName
                                    url
                                }
                                indexed
                                current
                                indexedCommit {
                                    oid
                                    abbreviatedOID
                                    commit {
                                        url
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `,
        { id }
    ).pipe(
        map(({ data, errors }) => {
            if (!data || !data.node || errors) {
                throw createAggregateError(errors)
            }
            return (data.node as GQL.IRepository).textSearchIndex
        })
    )
}

const TextSearchIndexedReference: React.FunctionComponent<{
    repo: SettingsAreaRepositoryFields
    indexedRef: GQL.IRepositoryTextSearchIndexedRef
}> = ({ repo, indexedRef }) => {
    const isCurrent = indexedRef.indexed && indexedRef.current
    const Icon = isCurrent ? CheckCircleIcon : LoadingSpinner

    return (
        <li className="repo-settings-index-page__ref">
            <Icon
                className={classNames(
                    'icon-inline repo-settings-index-page__ref-icon',
                    isCurrent
                        ? 'repo-settings-index-page__ref-icon--current'
                        : 'repo-settings-index-page__ref-icon--stale'
                )}
            />
            <LinkOrSpan to={indexedRef.ref.url}>
                <strong>
                    <code>{indexedRef.ref.displayName}</code>
                </strong>
            </LinkOrSpan>{' '}
            {indexedRef.indexed ? (
                <span>
                    &nbsp;&mdash; indexed at{' '}
                    <code>
                        <LinkOrSpan
                            to={indexedRef.indexedCommit?.commit ? indexedRef.indexedCommit.commit.url : repo.url}
                        >
                            {indexedRef.indexedCommit!.abbreviatedOID}
                        </LinkOrSpan>
                    </code>{' '}
                    {indexedRef.current ? '(up to date)' : '(index update in progress)'}
                </span>
            ) : (
                <span>&nbsp;&mdash; initial indexing in progress</span>
            )}
        </li>
    )
}

interface Props extends RouteComponentProps<{}> {
    repo: SettingsAreaRepositoryFields
}

interface State {
    textSearchIndex?: GQL.IRepositoryTextSearchIndex | null
    loading: boolean
    error?: Error
}

/**
 * The repository settings index page.
 */
export class RepoSettingsIndexPage extends React.PureComponent<Props, State> {
    public state: State = { loading: true }

    private updates = new Subject<void>()
    private subscriptions = new Subscription()

    public componentDidMount(): void {
        eventLogger.logViewEvent('RepoSettingsIndex')

        this.subscriptions.add(
            this.updates
                .pipe(
                    tap(() => this.setState({ loading: true })),
                    switchMap(() => fetchRepositoryTextSearchIndex(this.props.repo.id))
                )
                .subscribe(
                    textSearchIndex => this.setState({ textSearchIndex, loading: false }),
                    error => this.setState({ error, loading: false })
                )
        )
        this.updates.next()
    }

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        return (
            <>
                <PageTitle title="Index settings" />
                <PageHeader
                    path={[{ text: 'Indexing' }]}
                    headingElement="h2"
                    className="mb-3"
                    description={
                        !this.state.error && !this.state.loading && this.state.textSearchIndex ? (
                            <>Index branches to enhance search performance at scale.</>
                        ) : undefined
                    }
                />
                <Container className="repo-settings-index-page">
                    {this.state.loading && <LoadingSpinner className="icon-inline" />}
                    {this.state.error && (
                        <ErrorAlert prefix="Error getting repository index status" error={this.state.error} />
                    )}
                    {!this.state.error &&
                        !this.state.loading &&
                        (this.state.textSearchIndex ? (
                            <>
                                {this.state.textSearchIndex.refs && (
                                    <ul className="repo-settings-index-page__refs">
                                        {this.state.textSearchIndex.refs.map((reference, index) => (
                                            <TextSearchIndexedReference
                                                key={index}
                                                repo={this.props.repo}
                                                indexedRef={reference}
                                            />
                                        ))}
                                    </ul>
                                )}
                                {this.state.textSearchIndex.status && (
                                    <>
                                        <h3>Statistics</h3>
                                        <table className="table repo-settings-index-page__stats mb-0">
                                            <tbody>
                                                <tr>
                                                    <th>Last updated</th>
                                                    <td>
                                                        <Timestamp date={this.state.textSearchIndex.status.updatedAt} />
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>Content size</th>
                                                    <td>
                                                        {prettyBytes(this.state.textSearchIndex.status.contentByteSize)}{' '}
                                                        ({this.state.textSearchIndex.status.contentFilesCount}{' '}
                                                        {pluralize(
                                                            'file',
                                                            this.state.textSearchIndex.status.contentFilesCount
                                                        )}
                                                        )
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>Index size</th>
                                                    <td>
                                                        {prettyBytes(this.state.textSearchIndex.status.indexByteSize)} (
                                                        {this.state.textSearchIndex.status.indexShardsCount}{' '}
                                                        {pluralize(
                                                            'shard',
                                                            this.state.textSearchIndex.status.indexShardsCount
                                                        )}
                                                        )
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>New lines count</th>
                                                    <td>
                                                        {this.state.textSearchIndex.status.newLinesCount.toLocaleString()}{' '}
                                                        (default branch:{' '}
                                                        {this.state.textSearchIndex.status.defaultBranchNewLinesCount.toLocaleString()}
                                                        ) (other branches:{' '}
                                                        {this.state.textSearchIndex.status.otherBranchesNewLinesCount.toLocaleString()}
                                                        )
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="alert alert-info mb-0">
                                This Sourcegraph site has not enabled indexed search. See{' '}
                                <Link to="/help/admin/search">search documentation</Link> for information on how to
                                enable it.
                            </div>
                        ))}
                </Container>
            </>
        )
    }
}
