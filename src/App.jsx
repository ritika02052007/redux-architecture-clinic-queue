import { Component } from 'react';
import { Header, PatientForm, QueueList, StatsBar, Toast, useOnline } from './components/Components';

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <div className="card" role="alert"><h2>Something went wrong</h2><button className="btn primary" onClick={() => window.location.reload()}>Reload the page</button></div>
      : this.props.children;
  }
}

export default function App() {
  const online = useOnline();
  return (
    <ErrorBoundary>
      <a className="skip" href="#main">Skip to content</a>
      {!online && <div className="offline" role="status">You are offline. Changes will fail until you reconnect.</div>}
      <Header />
      <main id="main" className="layout">
        <aside><PatientForm /><StatsBar /></aside>
        <QueueList />
      </main>
      <Toast />
    </ErrorBoundary>
  );
}
