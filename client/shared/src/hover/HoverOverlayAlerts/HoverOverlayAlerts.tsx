import classNames from 'classnames'
import React from 'react'
import { HoverAlert } from 'sourcegraph'

import { NotificationType } from '../../api/extension/extensionHostApi'
import { renderMarkdown } from '../../util/markdown'
import { GetAlertClassName } from '../HoverOverlay.types'
import contentStyles from '../HoverOverlayContents/HoverOverlayContent/HoverOverlayContent.module.scss'

import styles from './HoverOverlayAlerts.module.scss'

export interface HoverOverlayAlertsProps {
    hoverAlerts: HoverAlert[]
    iconClassName?: string
    /** Called when an alert is dismissed, with the type of the dismissed alert. */
    onAlertDismissed?: (alertType: string) => void
    getAlertClassName?: GetAlertClassName
    className?: string
}

const iconKindToNotificationType: Record<Required<HoverAlert>['iconKind'], Parameters<GetAlertClassName>[0]> = {
    info: NotificationType.Info,
    warning: NotificationType.Warning,
    error: NotificationType.Error,
}

export const HoverOverlayAlerts: React.FunctionComponent<HoverOverlayAlertsProps> = props => {
    const { hoverAlerts, onAlertDismissed, getAlertClassName = () => undefined } = props

    const createAlertDismissedHandler = (alertType: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault()

        if (onAlertDismissed) {
            onAlertDismissed(alertType)
        }
    }

    return (
        <div className={classNames(styles.hoverOverlayAlerts, props.className)}>
            {hoverAlerts.map(({ summary, iconKind, type }, index) => (
                <div
                    key={index}
                    className={classNames(
                        'hover-overlay__alert',
                        getAlertClassName(iconKind ? iconKindToNotificationType[iconKind] : NotificationType.Info)
                    )}
                >
                    {summary.kind === 'plaintext' ? (
                        <span className={classNames(contentStyles.hoverOverlayContent)}>{summary.value}</span>
                    ) : (
                        <span
                            className={classNames(contentStyles.hoverOverlayContent)}
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(summary.value) }}
                        />
                    )}

                    {/* Show dismiss button when an alert has a dismissal type. */}
                    {/* If no type is provided, the alert is not dismissible. */}
                    {type && (
                        <div className="hover-overlay__alert-dismiss">
                            {/* Ideally this should a <button> but we can't guarantee we have the .btn-link class here. */}
                            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                            <a href="" onClick={createAlertDismissedHandler(type)} role="button">
                                <small>Dismiss</small>
                            </a>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
