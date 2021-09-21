import { NotificationType } from '@sourcegraph/shared/src/api/extension/extensionHostApi'

import { querySelectorOrSelf } from '../../util/dom'
import { BlobInfo, CodeHost, CodeHostContext } from '../shared/codeHost'
import { CodeView, DOMFunctions } from '../shared/codeViews'
import { RepoURLParseError } from '../shared/errors'
import { ViewResolver } from '../shared/views'

const notificationClassNames = {
    [NotificationType.Log]: 'flash',
    [NotificationType.Success]: 'flash flash-success',
    [NotificationType.Info]: 'flash',
    [NotificationType.Warning]: 'flash flash-warn',
    [NotificationType.Error]: 'flash flash-error',
}

function checkIsBitbucketCloud(): boolean {
    return location.hostname === 'bitbucket.org'
}

function getContext(): CodeHostContext {
    const rawRepoName = getRawRepoName()

    console.log({ rawRepoName })
    return {
        rawRepoName,
        revision: '',
        privateRepository: false,
    }
}

function getRawRepoName(): string {
    const { host, pathname } = location
    const [user, repoName] = pathname.slice(1).split('/')
    if (!user || !repoName) {
        throw new RepoURLParseError(`Could not parse repoName from Bitbucket Cloud url: ${location.href}`)
    }

    return `${host}/${user}/${repoName}`
}

const singleFileDOMFunctions: DOMFunctions = {
    getCodeElementFromTarget: target => target.closest('.view-line > span'),
    getLineNumberFromCodeElement: codeElement => {
        // Line elements and line number elements belong to two seperate column
        // elements in Monaco Editor.
        // There's also no data attribute/class/ID on the line element that tells
        // us what line number it's associated with.
        // Consequently, the most reliable way to get line number from line (+ vice versa)
        // is to determine its relative position in the virtualized view and find its
        // counterpart element at that position in the other column.

        const someLineNumber = document.querySelector<HTMLElement>('.line-number')
        if (!someLineNumber) {
            throw new Error('No line number elements found on the currently viewed page')
        }

        const editor = codeElement.closest('.react-monaco-editor-container')
        if (!editor) {
            throw new Error('No editor found')
        }

        const lineElement = codeElement.closest('.view-line')
        // `querySelectorAll` returns nodes in document order:
        // https://www.w3.org/TR/selectors-api/#queryselectorall,
        // so we can align the associated line and line number elements.
        // We have to do this because there's no seemingly stable class or attribute on the
        // line number elements' container (like '.line-numbers').
        const lineElements = editor.querySelectorAll<HTMLElement>('.view-line')

        const lineElementIndex = [...lineElements].findIndex(element => element === lineElement)
        const lineNumberElements = editor.querySelectorAll<HTMLElement>('.line-number')
        const inferredLineNumberElement = lineNumberElements[lineElementIndex]

        if (inferredLineNumberElement) {
            let lineNumber = parseInt(inferredLineNumberElement.dataset.lineNum ?? '', 10)
            if (!isNaN(lineNumber)) {
                return lineNumber
            }

            lineNumber = parseInt(inferredLineNumberElement.textContent?.trim() ?? '', 10)
            if (!isNaN(lineNumber)) {
                return lineNumber
            }
        }

        throw new Error('Could not find line number')
    },
    getLineElementFromLineNumber,
    getCodeElementFromLineNumber: (codeView, line) => {
        const lineElement = getLineElementFromLineNumber(codeView, line)

        if (!lineElement) {
            return null
        }

        const codeElement = lineElement.querySelector<HTMLElement>(':scope > span')
        if (!codeElement) {
            console.error(`Could not find code element inside .view-line container for line #${line}`)
        }

        return codeElement
    },
}

// BIG PROBLEM WITH REACT MONACO + PINNING!!!! DONT ENABLE PINNING FOR THIS CODE HOST?
// OR, INVALIDATE HOVER ON SCROLL?

function getLineElementFromLineNumber(codeView: HTMLElement, line: number): HTMLElement | null {
    // Line elements and line number elements belong to two seperate column
    // elements in Monaco Editor.
    // There's also no data attribute/class/ID on the line element that tells
    // us what line number it's associated with.
    // Consequently, the most reliable way to get line number from line (+ vice versa)
    // is to determine its relative position in the virtualized view and find its
    // counterpart element at that position in the other column.

    let lineNumberElement = codeView.querySelector<HTMLElement>(`[data-line-num="${line}"]`)
    if (!lineNumberElement) {
        for (const element of codeView.querySelectorAll<HTMLElement>('.line-number')) {
            const currentLine = parseInt(element.textContent ?? '', 10)
            console.log({ currentLine })
            if (currentLine === line) {
                lineNumberElement = element
                break
            }
        }
    }

    if (!lineNumberElement) {
        console.error(`Could not find line number element for line #${line}`)
        return null
    }

    // `querySelectorAll` returns nodes in document order:
    // https://www.w3.org/TR/selectors-api/#queryselectorall,
    // so we can align the associated line and line number elements.
    // We have to do this because there's no seemingly stable class or attribute on the
    // line number elements' container (like '.line-numbers').
    const lineNumberElements = codeView.querySelectorAll<HTMLElement>('.line-number')
    const lineNumberElementIndex = [...lineNumberElements].findIndex(element => element === lineNumberElement)

    const lineElements = codeView.querySelectorAll<HTMLElement>('.view-line')
    const inferredLineElement = lineElements[lineNumberElementIndex]

    if (!inferredLineElement) {
        console.error(`Could not find line element for line #${line}`)
    }

    return inferredLineElement
}

function getFileInfoFromSingleFileSourceCodeView(): BlobInfo {
    const rawRepoName = getRawRepoName()

    const revisionRegex = /src\/(.*?)\/(.*)/
    const matches = location.pathname.match(revisionRegex)
    if (!matches) {
        throw new Error('Unable to determine revision or file path')
    }
    const revision = decodeURIComponent(matches[1])
    const filePath = decodeURIComponent(matches[2])

    const commitID = getCommitIDFromPermalink()

    console.log({ revision, rawRepoName, filePath, commitID })

    return {
        blob: {
            rawRepoName,
            revision,
            filePath,
            commitID: commitID ?? revision, // TODO: I think the revision is prioritized anyways
        },
    }
}

function getCommitIDFromPermalink(): string | null {
    const permalinkSelectors = ['a[type="button"]', 'a']

    // Try the narrower selector first, broaden if necessary
    for (const selector of permalinkSelectors) {
        const anchors = document.querySelectorAll<HTMLAnchorElement>(selector)

        for (const anchor of anchors) {
            const matches = anchor.href.match(/full-commit\/([\da-f]{40})\//)
            if (!matches) {
                continue
            }
            return matches[1]
        }
    }

    // throw new Error('Unable to determine commit ID')
    return null
}

function getToolbarMount(codeView: HTMLElement): HTMLElement {
    const existingMount = codeView.querySelector<HTMLElement>('.sg-toolbar-mount')
    if (existingMount) {
        return existingMount
    }

    const fileActions = codeView.querySelector<HTMLElement>('[data-testid="file-actions"')
    if (!fileActions) {
        throw new Error('Unable to find mount location')
    }

    const mount = document.createElement('div')
    mount.classList.add('sg-toolbar-mount')

    fileActions.prepend(mount)

    return mount
}

/**
 * Used for single file code views and pull requests.
 */
const codeViewResolver: ViewResolver<CodeView> = {
    selector: element => {
        // The "code view" element has no class, ID, or data attributes, so
        // look for the lowest common ancestor of file header and file content elements.
        const fileHeader = element.querySelector<HTMLElement>('[data-qa="bk-file__header"]')
        const fileContent = element.querySelector<HTMLElement>('[data-qa="bk-file__content"]')

        if (!fileHeader || !fileContent) {
            return null
        }
        console.log({ element, fileContent, fileHeader })

        let codeView: HTMLElement = fileHeader

        // TODO: UNIT TEST THIS
        while (!codeView.contains(fileContent)) {
            if (!codeView.parentElement) {
                return null
            }
            codeView = codeView.parentElement
        }

        return [codeView]
    },
    resolveView: element => {
        console.log({ element })
        // TODO check if diff or single file

        return {
            element,
            getToolbarMount,
            dom: singleFileDOMFunctions,
            resolveFileInfo: getFileInfoFromSingleFileSourceCodeView,
        }
    },
}

/**
 * Used for commit and compare pages.
 * Compare page is not included in the sidebar.
 */
// const compareCodeViewResolver: ViewResolver<CodeView> = {
//     selector: () => {
//         return null
//     },
//     resolveView: element => {},
// }

function getCommandPaletteMount(container: HTMLElement): HTMLElement | null {
    const globalNavigationContainerSelector = '[data-testid="GlobalNavigation"] > div'
    const className = 'command-palette-button'

    // Very brittle
    const globalNavigationContainer = querySelectorOrSelf<HTMLElement>(container, globalNavigationContainerSelector)
    if (!globalNavigationContainer) {
        return null
    }

    function createCommandList(): HTMLElement | null {
        const topNavigationItemsContainer = globalNavigationContainer?.firstElementChild
        if (!topNavigationItemsContainer) {
            return null
        }

        const mount = document.createElement('div')
        mount.classList.add(className)
        mount.className = className
        topNavigationItemsContainer?.append(mount)
        return mount
    }

    return globalNavigationContainer.querySelector<HTMLElement>('.' + className) ?? createCommandList()
}

function getViewContextOnSourcegraphMount(container: HTMLElement): HTMLElement | null {
    const OPEN_ON_SOURCEGRAPH_ID = 'open-on-sourcegraph'

    const pageHeader = querySelectorOrSelf(container, '[data-qa="page-header-wrapper"] > div > div')
    if (!pageHeader) {
        return null
    }

    let mount = pageHeader.querySelector<HTMLElement>('#' + OPEN_ON_SOURCEGRAPH_ID)
    if (mount) {
        return mount
    }
    mount = document.createElement('span')
    mount.id = OPEN_ON_SOURCEGRAPH_ID

    // At the time of development, the page header element had two children: breadcrumbs container and
    // page title + actions containers' container.
    // Try to add the view on Sourcegraph button as a child of the actions container.

    // This is brittle since it relies on DOM structure and not classes. If it fails in the future,
    // fallback to appending as last child of page header. This is still aesthetically acceptable.

    const actionsContainer = pageHeader.childNodes[1]?.childNodes[1].firstChild
    if (actionsContainer instanceof HTMLElement) {
        actionsContainer.append(mount)
    } else {
        pageHeader.append(mount)
    }

    return mount
}

const suffix = (className: string): string => className + '--bitbucket-cloud'

export const bitbucketCloudCodeHost: CodeHost = {
    type: 'bitbucket-cloud',
    name: 'Bitbucket Cloud',
    codeViewResolvers: [codeViewResolver],
    getContext,
    getViewContextOnSourcegraphMount,
    check: checkIsBitbucketCloud,
    getCommandPaletteMount,
    // TODO class names props
    viewOnSourcegraphButtonClassProps: {
        className: suffix('open-on-sourcegraph'),
        iconClassName: suffix('icon'),
    },
    commandPaletteClassProps: {},
    codeViewToolbarClassProps: {
        className: suffix('code-view-toolbar'),
        listItemClass: suffix('code-view-toolbar__list-item'),
        actionItemClass: suffix('code-view-toolbar__action-item'),
        actionItemPressedClass: suffix('pressed'),
        actionItemIconClass: suffix('icon'),
    },
    hoverOverlayClassProps: {
        className: suffix('hover-overlay'),
        closeButtonClassName: suffix('hover-overlay__close'),
        badgeClassName: suffix('hover-overlay__badge'),
        actionItemClassName: suffix('hover-overlay__action-item'),
        actionItemPressedClassName: suffix('hover-overlay__action-item-pressed'),
        iconClassName: suffix('icon'),
        contentClassName: suffix('hover-overlay__content'),
    },
    notificationClassNames,
    urlToFile: undefined,
    codeViewsRequireTokenization: false,
}
