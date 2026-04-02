import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TooltipProvider } from '@/components/ui/tooltip'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import AiDevtools from '../lib/ai-devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { TRPCRouter } from '@/integrations/trpc/router'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'

interface MyRouterContext {
  queryClient: QueryClient
  trpc: TRPCOptionsProxy<TRPCRouter>
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
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
        title: 'CyberGov — Work Simplification for Teams',
      },
      {
        name: 'description',
        content:
          "Map your team's work. Chart every process. Eliminate waste. CyberGov digitizes the proven Bureau of Budget method for improving workplace procedures.",
      },
      // Open Graph
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: 'CyberGov — Work Simplification for Teams',
      },
      {
        property: 'og:description',
        content:
          "Map your team's work. Chart every process. Eliminate waste. Digitizes the proven Bureau of Budget method.",
      },
      {
        property: 'og:image',
        content: '/og-image.png',
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'CyberGov — Work Simplification for Teams',
      },
      {
        name: 'twitter:description',
        content:
          "Map your team's work. Chart every process. Eliminate waste. Digitizes the proven Bureau of Budget method.",
      },
      {
        name: 'twitter:image',
        content: '/og-image.png',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      } as any,
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
      },
    ],
  }),

  component: RootComponent,
  shellComponent: RootDocument,

  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg">
      <div className="text-center max-w-md px-6">
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-accent mb-4">
          File Not Found
        </div>
        <h1 className="text-7xl font-serif font-bold text-nd-ink mb-4">404</h1>
        <div className="w-12 h-1 bg-nd-accent mx-auto mb-6" />
        <p className="text-nd-ink-muted text-sm font-serif mb-8">
          The requested document could not be located in this registry.
        </p>
        <a
          href="/"
          className="inline-block px-8 py-3 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif tracking-wide border-2 border-nd-ink transition-colors"
        >
          Return to Index
        </a>
      </div>
    </div>
  ),

  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-nd-bg">
      <div className="text-center max-w-md px-6">
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-nd-flag-red mb-4">
          System Error
        </div>
        <h1 className="text-4xl font-serif font-bold text-nd-ink mb-4">
          Something went wrong
        </h1>
        <div className="w-12 h-1 bg-nd-flag-red mx-auto mb-6" />
        <p className="text-nd-ink-muted text-sm font-serif mb-8">
          {error instanceof Error
            ? error.message
            : 'An unexpected error occurred in this operation.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block px-8 py-3 bg-nd-ink hover:bg-nd-accent text-nd-bg font-serif tracking-wide border-2 border-nd-ink transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  ),
})

import { Toaster } from '@/components/ui/sonner'
import { Provider as RootProvider } from '../integrations/tanstack-query/root-provider'
import { useRouter } from '@tanstack/react-router'

function RootComponent() {
  const router = useRouter()
  const queryClient = router.options.context.queryClient

  return (
    <RootProvider queryClient={queryClient}>
      <TooltipProvider>
        <Outlet />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </RootProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
              AiDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
