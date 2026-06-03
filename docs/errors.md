Navigated to http://localhost:3000/settings
main-app.js?v=1780464976926:2417 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
app-index.js:33 Warning: In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.
    at button
    at div
    at button
    at div
    at CollapsibleGroup (webpack-internal:///(app-pages-browser)/../../packages/ui/src/Sidebar.tsx:456:11)
    at div
    at nav
    at div
    at MenuContent (webpack-internal:///(app-pages-browser)/../../packages/ui/src/Sidebar.tsx:570:11)
    at aside
    at Sidebar (webpack-internal:///(app-pages-browser)/../../packages/ui/src/Sidebar.tsx:892:22)
    at div
    at DashboardContent (webpack-internal:///(app-pages-browser)/./app/(dashboard)/layout.tsx:54:11)
    at QuickCallProvider (webpack-internal:///(app-pages-browser)/./components/quick-call/QuickCallContext.tsx:14:11)
    at OnboardingProvider (webpack-internal:///(app-pages-browser)/./components/onboarding/OnboardingProvider.tsx:16:11)
    at BusinessIdProvider (webpack-internal:///(app-pages-browser)/./lib/hooks/use-business-id.tsx:40:11)
    at DashboardLayout (webpack-internal:///(app-pages-browser)/./app/(dashboard)/layout.tsx:206:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/layout-router.js:370:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/../../node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./components/providers/QueryProvider.tsx:37:11)
    at AuthProvider (webpack-internal:///(app-pages-browser)/../../packages/auth/src/AuthProvider.tsx:24:11)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./components/providers/AuthProvider.tsx:20:11)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/../../node_modules/next/dist/client/app-index.js:117:11)
window.console.error @ app-index.js:33
console.error @ hydration-error-info.js:63
printWarning @ react-dom.development.js:94
error @ react-dom.development.js:68
validateDOMNesting @ react-dom.development.js:4284
createInstance @ react-dom.development.js:35403
completeWork @ react-dom.development.js:19773
completeUnitOfWork @ react-dom.development.js:25963
performUnitOfWork @ react-dom.development.js:25759
workLoopSync @ react-dom.development.js:25464
renderRootSync @ react-dom.development.js:25419
performConcurrentWorkOnRoot @ react-dom.development.js:24504
workLoop @ scheduler.development.js:256
flushWork @ scheduler.development.js:225
performWorkUntilDeadline @ scheduler.development.js:534
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
performWorkUntilDeadline @ scheduler.development.js:539
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
performWorkUntilDeadline @ scheduler.development.js:539
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback @ react-dom.development.js:27035
commitRootImpl @ react-dom.development.js:26171
commitRoot @ react-dom.development.js:26077
performSyncWorkOnRoot @ react-dom.development.js:24925
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:7758
flushSyncWorkOnAllRoots @ react-dom.development.js:7718
processRootScheduleInMicrotask @ react-dom.development.js:7863
eval @ react-dom.development.js:8034
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
performWorkUntilDeadline @ scheduler.development.js:539
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
performWorkUntilDeadline @ scheduler.development.js:539
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
performWorkUntilDeadline @ scheduler.development.js:539
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
performWorkUntilDeadline @ scheduler.development.js:539
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
performWorkUntilDeadline @ scheduler.development.js:539
postMessage
schedulePerformWorkUntilDeadline @ scheduler.development.js:572
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:7990
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:7954
processRootScheduleInMicrotask @ react-dom.development.js:7827
eval @ react-dom.development.js:8034
AuthProvider.tsx:18 [AUTH PROVIDER] State change: {event: 'INITIAL_SESSION', hasSession: true, userId: '063b04a5-0891-4f86-8a71-f54afed38f28'}
