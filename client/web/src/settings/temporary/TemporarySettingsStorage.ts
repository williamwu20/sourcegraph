import { ApolloClient, gql } from '@apollo/client'
import { isEqual } from 'lodash'
import { Observable, of, Subscription, from, ReplaySubject, Subscriber } from 'rxjs'
import { distinctUntilChanged, map } from 'rxjs/operators'

import { fromObservableQuery } from '@sourcegraph/shared/src/graphql/fromObservableQuery'

import { GetTemporarySettingsResult } from '../../graphql-operations'

import { TemporarySettings } from './TemporarySettings'

export class TemporarySettingsStorage {
    private settingsBackend: SettingsBackend = new LocalStorageSettingsBackend()
    private settings: TemporarySettings = {}

    private onChange = new ReplaySubject<TemporarySettings>(1)

    private loadSubscription: Subscription | null = null
    private saveSubscription: Subscription | null = null

    public dispose(): void {
        this.loadSubscription?.unsubscribe()
        this.saveSubscription?.unsubscribe()
    }

    constructor(private apolloClient: ApolloClient<object> | null, isAuthenticatedUser: boolean) {
        if (isAuthenticatedUser) {
            if (!this.apolloClient) {
                throw new Error('Apollo-Client should be initialized for authenticated user')
            }

            this.setSettingsBackend(new ServersideSettingsBackend(this.apolloClient))
        } else {
            this.setSettingsBackend(new LocalStorageSettingsBackend())
        }
    }

    // This is public for testing purposes only so mocks can be provided.
    public setSettingsBackend(backend: SettingsBackend): void {
        this.loadSubscription?.unsubscribe()
        this.saveSubscription?.unsubscribe()

        this.settingsBackend = backend

        this.loadSubscription = this.settingsBackend.load().subscribe(settings => {
            this.settings = settings
            this.onChange.next(settings)
        })
    }

    public set<K extends keyof TemporarySettings>(key: K, value: TemporarySettings[K]): void {
        this.settings[key] = value
        this.onChange.next(this.settings)
        this.saveSubscription = this.settingsBackend.save(this.settings).subscribe()
    }

    public get<K extends keyof TemporarySettings>(
        key: K,
        defaultValue?: TemporarySettings[K]
    ): Observable<TemporarySettings[K]> {
        return this.onChange.pipe(
            map(settings => (key in settings ? settings[key] : defaultValue)),
            distinctUntilChanged((a, b) => isEqual(a, b))
        )
    }
}

export interface SettingsBackend {
    load: () => Observable<TemporarySettings>
    save: (settings: TemporarySettings) => Observable<void>
}

/**
 * Settings backend for unauthenticated users.
 * Settings are stored in `localStorage` and updated when
 * the `storage` event is fired on the window.
 */
class LocalStorageSettingsBackend implements SettingsBackend {
    private readonly TemporarySettingsKey = 'temporarySettings'

    public load(): Observable<TemporarySettings> {
        return new Observable<TemporarySettings>(observer => {
            let settingsLoaded = false

            const loadObserver = (observer: Subscriber<TemporarySettings>): void => {
                try {
                    const settings = localStorage.getItem(this.TemporarySettingsKey)
                    if (settings) {
                        const parsedSettings = JSON.parse(settings) as TemporarySettings
                        observer.next(parsedSettings)
                        settingsLoaded = true
                    }
                } catch (error: unknown) {
                    console.error(error)
                }

                if (!settingsLoaded) {
                    observer.next({})
                }
            }

            loadObserver(observer)

            const loadCallback = (): void => {
                loadObserver(observer)
            }

            window.addEventListener('storage', loadCallback)

            return () => {
                window.removeEventListener('storage', loadCallback)
            }
        })
    }

    public save(settings: TemporarySettings): Observable<void> {
        try {
            const settingsString = JSON.stringify(settings)
            localStorage.setItem(this.TemporarySettingsKey, settingsString)
        } catch (error: unknown) {
            console.error(error)
        }

        return of()
    }
}

/**
 * Settings backend for authenticated users that saves settings to the server.
 * Changes to settings are polled every 5 minutes.
 */
class ServersideSettingsBackend implements SettingsBackend {
    private readonly PollInterval = 1000 * 60 * 5 // 5 minutes

    private readonly GetTemporarySettingsQuery = gql`
        query GetTemporarySettings {
            temporarySettings {
                contents
            }
        }
    `

    private readonly SaveTemporarySettingsMutation = gql`
        mutation SaveTemporarySettings($contents: String!) {
            overwriteTemporarySettings(contents: $contents) {
                alwaysNil
            }
        }
    `

    constructor(private apolloClient: ApolloClient<object>) {}

    public load(): Observable<TemporarySettings> {
        const temporarySettingsQuery = this.apolloClient.watchQuery<GetTemporarySettingsResult>({
            query: this.GetTemporarySettingsQuery,
            pollInterval: this.PollInterval,
        })

        return fromObservableQuery(temporarySettingsQuery).pipe(
            map(({ data }) => {
                let parsedSettings: TemporarySettings = {}

                try {
                    const settings = data.temporarySettings.contents
                    parsedSettings = JSON.parse(settings) as TemporarySettings
                } catch (error: unknown) {
                    console.error(error)
                }

                return parsedSettings || {}
            })
        )
    }

    public save(settings: TemporarySettings): Observable<void> {
        try {
            const settingsString = JSON.stringify(settings)
            return from(
                this.apolloClient.mutate({
                    mutation: this.SaveTemporarySettingsMutation,
                    variables: { contents: settingsString },
                })
            ).pipe(
                map(() => {}) // Ignore return value, always empty
            )
        } catch (error: unknown) {
            console.error(error)
        }

        return of()
    }
}

/**
 * Static in memory setting backend for testing purposes
 */
export class InMemoryMockSettingsBackend implements SettingsBackend {
    constructor(private settings: TemporarySettings) {}
    public load(): Observable<TemporarySettings> {
        return of(this.settings)
    }
    public save(settings: TemporarySettings): Observable<void> {
        this.settings = settings
        return of()
    }
}
