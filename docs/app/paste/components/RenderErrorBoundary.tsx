"use client";

import { Button } from "@openuidev/react-ui";
import { Component, type ReactNode } from "react";

interface Props {
  /** Bump to clear the error state (e.g. when the code changes). */
  resetKey: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
  lastResetKey: string;
}

export class RenderErrorBoundary extends Component<Props, State> {
  state: State = { error: null, lastResetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.lastResetKey) {
      return { error: null, lastResetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return (
        <div className="render-crash">
          <strong>Renderer crashed</strong>
          <pre>{this.state.error.message}</pre>
          <Button variant="secondary" size="small" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
