import { useState } from 'react';

export default function Throttle({ loco, send, onRemove }) {
  const { cab, name, speed, direction } = loco;
  const [localSpeed, setLocalSpeed] = useState(speed);

  function handleSpeed(val) {
    const s = Number(val);
    setLocalSpeed(s);
    send('throttle', { cab, speed: s, direction });
  }

  function handleDirection(dir) {
    if (dir === direction) return;
    // Stop before reversing
    send('throttle', { cab, speed: 0, direction: dir });
    setLocalSpeed(0);
  }

  function handleStop() {
    send('throttle', { cab, speed: 0, direction });
    setLocalSpeed(0);
  }

  // Sync from server estop
  if (speed !== localSpeed && speed === 0 && localSpeed !== 0) {
    setLocalSpeed(0);
  }

  const speedPct = Math.round((localSpeed / 126) * 100);

  return (
    <div className="throttle">
      <div className="throttle__header">
        <span className="throttle__name">{name}</span>
        <span className="throttle__cab">#{cab}</span>
        <button className="throttle__remove" onClick={() => onRemove(cab)} aria-label="Remove loco">
          &times;
        </button>
      </div>

      <div className="throttle__speed-display">{localSpeed} <span className="throttle__speed-pct">({speedPct}%)</span></div>

      <input
        className="throttle__slider"
        type="range"
        min={0}
        max={126}
        value={localSpeed}
        onChange={(e) => handleSpeed(e.target.value)}
        aria-label="Speed"
        orient="vertical"
      />

      <div className="throttle__dir-btns">
        <button
          className={`dir-btn ${direction === 1 ? 'dir-btn--active' : ''}`}
          onClick={() => handleDirection(1)}
        >
          FWD
        </button>
        <button className="stop-btn" onClick={handleStop}>STOP</button>
        <button
          className={`dir-btn ${direction === 0 ? 'dir-btn--active' : ''}`}
          onClick={() => handleDirection(0)}
        >
          REV
        </button>
      </div>
    </div>
  );
}
