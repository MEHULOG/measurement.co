import { Component, ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-lg rounded-lg border border-destructive/30 bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-lg font-semibold text-destructive">
            Something broke while rendering.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open DevTools → Console for the full stack trace.
          </p>
          <pre className="mt-4 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
