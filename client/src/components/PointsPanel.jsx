import { useState } from 'react';

export default function PointsPanel({ turnouts, send }) {
  const [showAdd, setShowAdd] = useState(false);
  const [id, setId] = useState('');
  const [name, setName] = useState('');

  const list = Object.values(turnouts);

  function handleAdd(e) {
    e.preventDefault();
    const idNum = parseInt(id, 10);
    if (!idNum || idNum < 0) return;
    send('add_turnout', { id: idNum, name: name.trim() || `Turnout ${idNum}` });
    setId('');
    setName('');
    setShowAdd(false);
  }

  function handleRemove(id) {
    send('remove_turnout', { id });
  }

  function handleThrow(id, thrown) {
    send('turnout', { id, thrown });
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Points / Turnouts</h2>
        <button className="btn-add" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : '+ Add Turnout'}
        </button>
      </div>

      {showAdd && (
        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="add-form__input"
            type="number"
            placeholder="Turnout ID"
            min={0}
            value={id}
            onChange={(e) => setId(e.target.value)}
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
        <p className="panel__empty">No turnouts configured.</p>
      )}

      <div className="points-grid">
        {list.map((t) => (
          <div key={t.id} className="point-card">
            <div className="point-card__header">
              <span className="point-card__name">{t.name}</span>
              <span className="point-card__id">ID {t.id}</span>
              <button className="throttle__remove" onClick={() => handleRemove(t.id)}>&times;</button>
            </div>
            <div className="point-card__state">{t.thrown ? 'THROWN' : 'CLOSED'}</div>
            <div className="point-card__btns">
              <button
                className={`point-btn ${!t.thrown ? 'point-btn--active' : ''}`}
                onClick={() => handleThrow(t.id, false)}
              >
                CLOSE
              </button>
              <button
                className={`point-btn ${t.thrown ? 'point-btn--active' : ''}`}
                onClick={() => handleThrow(t.id, true)}
              >
                THROW
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
