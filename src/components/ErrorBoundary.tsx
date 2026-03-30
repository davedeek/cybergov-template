import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center min-h-[200px] p-8">
          <div className="border-2 border-nd-flag-red bg-nd-flag-red/5 p-6 max-w-md w-full">
            <p className="text-xs font-mono uppercase tracking-widest text-nd-flag-red mb-2">
              System Error
            </p>
            <p className="font-serif text-nd-ink text-sm">
              Something went wrong. Please refresh the page or try again.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <pre className="mt-4 text-[10px] font-mono text-nd-ink-muted overflow-auto max-h-32 whitespace-pre-wrap">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
