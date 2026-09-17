import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { AdSenseFooter } from '#/components/adsense-footer'
import { getSession } from '#/lib/auth.functions'

import appCss from '../planner.css?url'

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (location.pathname.startsWith('/api/')) {
      return { user: null }
    }

    return { user: await getSession() }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'description',
        content: 'A clean, shareable raid composition and party buff planner.',
      },
      {
        title: 'justraidplanner · Raid Planner',
      },
      {
        name: 'google-adsense-account',
        content: 'ca-pub-5845912732049177',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(window.adsbygoogle=window.adsbygoogle||[]).push({overlays:{bottom:false}});',
          }}
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5845912732049177"
          crossOrigin="anonymous"
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <AdSenseFooter />
        <Scripts />
      </body>
    </html>
  )
}
