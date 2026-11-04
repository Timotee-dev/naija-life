import { Component, type ReactNode } from "react";
import { useGame } from "../game/store";

/** If a panel crashes, show a small message instead of a blank screen, and let the player carry on. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="sheet-wrap">
        <section className="sheet narrow">
          <h2 className="h2">Something went wrong in this screen</h2>
          <p className="muted small">{this.state.error}</p>
          <button
            className="btn primary"
            onClick={() => {
              useGame.getState().closeModal();
              this.setState({ error: null });
            }}
          >
            Close and keep playing
          </button>
        </section>
      </div>
    );
  }
}
