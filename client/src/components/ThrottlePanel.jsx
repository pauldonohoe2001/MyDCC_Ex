import { useState } from 'react';
import Throttle from './Throttle';

export default function ThrottlePanel({ locos, send }) {
  const [showAdd, setShowAdd] = useState(false);
  const [cab, setCab] = useState('');
  const [name, setName] = useState('');

  const locoList = Object.values(locos);

  function handleAdd(e) {
    e.preventDefault();
    const cabNum = parseInt(cab, 10);
    if (!cabNum || cabNum < 1 || cabNum > 9999) return;
    if (locos[cabNum]) return; // already exists
    send('add_loco', { cab: cabNum, name: name.trim() || `Loco ${cabNum}` });
    setCab('');
    setName('');
    setShowAdd(false);
  }

  function handleRemove(cab) {
    send('remove_loco', { cab });
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Throttles ({locoList.length}/10)</h2>
        {locoList.length < 10 && (
          <button className="btn-add" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Cancel' : '+ Add Loco'}
          </button>
        )}
      </div>

      {showAdd && (
        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="add-form__input"
            type="number"
            placeholder="DCC Address (1–9999)"
            min={1}
            max={9999}
            value={cab}
            onChange={(e) => setCab(e.target.value)}
            required
            autoFocus
          />
          <input
            className="add-form__input"
            type="text"
            placeholder="Name (optional)"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn-add" type="submit">Add</button>
        </form>
      )}

      {locoList.length === 0 && (
        <p className="panel__empty">No locos added. Press "+ Add Loco" to begin.</p>
      )}

      <div className="throttle-grid">
        {locoList.map((loco) => (
          <Throttle key={loco.cab} loco={loco} send={send} onRemove={handleRemove} />
        ))}
      </div>
    </section>
  );
}
