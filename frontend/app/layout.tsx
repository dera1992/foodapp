import type { Metadata } from 'next';
import { DM_Sans, Fraunces } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'sonner';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

export const metadata: Metadata = {
  title: 'Bunchfood',
  description: 'Fresh near-expiry food deals from local shops'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body suppressHydrationWarning className="bg-brand-background text-brand-text antialiased">
        <Script id="strip-fdprocessedid" strategy="beforeInteractive">
          {`
            (function () {
              var attr = 'fdprocessedid';
              function strip(root) {
                if (!root || !root.querySelectorAll) return;
                var nodes = root.querySelectorAll('[' + attr + ']');
                for (var i = 0; i < nodes.length; i += 1) {
                  nodes[i].removeAttribute(attr);
                }
              }
              strip(document);
              var observer = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i += 1) {
                  var m = mutations[i];
                  if (m.type === 'attributes' && m.attributeName === attr && m.target && m.target.removeAttribute) {
                    m.target.removeAttribute(attr);
                  }
                  if (m.addedNodes && m.addedNodes.length) {
                    for (var j = 0; j < m.addedNodes.length; j += 1) {
                      var node = m.addedNodes[j];
                      if (node && node.nodeType === 1) {
                        if (node.hasAttribute && node.hasAttribute(attr)) node.removeAttribute(attr);
                        strip(node);
                      }
                    }
                  }
                }
              });
              observer.observe(document.documentElement, {
                subtree: true,
                childList: true,
                attributes: true,
                attributeFilter: [attr]
              });
            })();
          `}
        </Script>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand
          duration={5000}
          toastOptions={{
            style: {
              fontFamily: 'var(--font-dm-sans), sans-serif',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
