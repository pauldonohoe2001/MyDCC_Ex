import { useState } from 'react';

const ASPECTS = [
  { value: 0, label: 'RED',   cls: 'aspect--red' },
  { value: 1, label: 'AMBER', cls: 'aspect--amber' },
  { value: 2, label: 'GREEN', cls: 'aspect--green' }
];

export default function SignalPanel({ signals, send }) {
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState('');
  const [name, setName] = useState('');

  const list = Object.values(signals);

  function handleAdd(e) {
    e.preventDefault();
    const addr = parseInt(address, 10);
    if (!addr || addr < 1) return;
    send('add_signal', { address: addr, name: name.trim() || `Signal ${addr}` });
    setAddress('');
    setName('');
    setShowAdd(false);
  }

  function handleRemove(address) {
    send('remove_signal', { address });
  }

  function handleAspect(address, aspect) {
    send('signal', { address, aspect });
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Signals</h2>
        <button className="btn-add" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : '+ Add Signal'}
        </button>
      </div>

      {showAdd && (
        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="add-form__input"
            type="number"
            placeholder="Accessory Address"
            min={1}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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

      {list.length === 0 && (
        <p className="panel__empty">No signals configured.</p>
      )}

      <div className="signals-grid">
        {list.map((sig) => (
          <div key={sig.address} className="signal-card">
            <div className="signal-card__header">
              <span className="signal-card__name">{sig.name}</span>
              <span className="signal-card__addr">Addr {sig.address}</span>
              <button className="throttle__remove" onClick={() => handleRemove(sig.address)}>&times;</button>
            </div>
            <div className="signal-card__head">
              {ASPECTS.map((a) => (
                <div
                  key={a.value}
                  className={`signal-lamp ${a.cls} ${sig.aspect === a.value ? 'signal-lamp--on' : ''}`}
                />
              ))}
            </div>
            <div className="signal-card__btns">
              {ASPECTS.map((a) => (
                <button
                  key={a.value}
                  className={`aspect-btn ${a.cls} ${sig.aspect === a.value ? 'aspect-btn--active' : ''}`}
                  onClick={() => handleAspect(sig.address, a.value)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
