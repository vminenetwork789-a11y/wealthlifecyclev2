import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { CrossFrameGuard } from '../components/CrossFrameGuard';

export const metadata: Metadata = {
  title: 'WealthLifeCycle DApp',
  description: 'WealthLifeCycle: Decentralized 3-Rank Non-Stop Matrix Protocol with Ghost Reborn mechanics on BNB Smart Chain.',
  openGraph: {
    title: 'WealthLifeCycle DApp',
    description: 'WealthLifeCycle: Decentralized 3-Rank Non-Stop Matrix Protocol with Ghost Reborn mechanics on BNB Smart Chain.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="w-full h-full min-h-full m-0 p-0" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function isCrossOriginError(msg) {
                  if (!msg) return false;
                  var str = typeof msg === 'string' ? msg : (msg.message || msg.toString?.() || '');
                  return (
                    str.indexOf('cross-origin') !== -1 ||
                    str.indexOf('Blocked a frame') !== -1 ||
                    str.indexOf('Failed to read a named property') !== -1 ||
                    str.indexOf("Failed to read the 'origin' property from 'Location'") !== -1 ||
                    str.indexOf("Failed to read a named property 'origin' from 'Location'") !== -1 ||
                    str.indexOf('SecurityError') !== -1 ||
                    str.indexOf('Permission denied') !== -1 ||
                    str.indexOf('ResizeObserver') !== -1
                  );
                }

                var prevOnError = window.onerror;
                window.onerror = function(msg, url, line, col, error) {
                  if (isCrossOriginError(msg) || (error && isCrossOriginError(error.message))) {
                    return true;
                  }
                  if (prevOnError) {
                    try { return prevOnError.apply(this, arguments); } catch(e) {}
                  }
                  return false;
                };

                window.addEventListener('error', function(event) {
                  if (isCrossOriginError(event.message) || (event.error && isCrossOriginError(event.error.message))) {
                    event.preventDefault();
                    if (typeof event.stopImmediatePropagation === 'function') {
                      event.stopImmediatePropagation();
                    }
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event.reason;
                  if (isCrossOriginError(reason) || (reason && isCrossOriginError(reason.message))) {
                    event.preventDefault();
                    if (typeof event.stopImmediatePropagation === 'function') {
                      event.stopImmediatePropagation();
                    }
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="w-full h-full min-h-full m-0 p-0 bg-[#020617] text-slate-300 antialiased" suppressHydrationWarning>
        <CrossFrameGuard />
        {children}
      </body>
    </html>
  );
}
