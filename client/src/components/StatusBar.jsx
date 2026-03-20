export default function StatusBar({ connected, power, send }) {
  return (
    <header className="status-bar">
      <div className="status-bar__title">DCC Centre</div>
      <div className="status-bar__right">
        <button
          className={`power-btn ${power ? 'power-btn--on' : 'power-btn--off'}`}
          onClick={() => send('power', { on: !power })}
        >
          {power ? 'POWER ON' : 'POWER OFF'}
        </button>
        <span className={`conn-indicator ${connected ? 'conn-indicator--ok' : 'conn-indicator--err'}`}>
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>
    </header>
  );
}
