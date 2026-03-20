import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import StatusBar from './components/StatusBar';
import EStop from './components/EStop';
import ThrottlePanel from './components/ThrottlePanel';
import PointsPanel from './components/PointsPanel';
import SignalPanel from './components/SignalPanel';
import LayoutMap from './components/LayoutMap';

const TABS = ['Throttles', 'Points', 'Signals', 'Layout'];

export default function App() {
  const { connected, state, send } = useWebSocket();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="app">
      <StatusBar connected={connected} power={state.power} send={send} />
      <EStop send={send} />

      <nav className="tabs">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === i ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {activeTab === 0 && <ThrottlePanel locos={state.locos} send={send} />}
        {activeTab === 1 && <PointsPanel turnouts={state.turnouts} send={send} />}
        {activeTab === 2 && <SignalPanel signals={state.signals} send={send} />}
        {activeTab === 3 && <LayoutMap layoutMap={state.layoutMap} turnouts={state.turnouts} signals={state.signals} send={send} />}
      </main>
    </div>
  );
}
