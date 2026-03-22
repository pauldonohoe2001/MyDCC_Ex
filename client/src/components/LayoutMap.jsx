import { useState, useRef, useCallback } from 'react';

const NODE_TYPES = ['station', 'junction', 'siding', 'turnout', 'signal'];
const NODE_RADIUS = 22;
const NODE_RADIUS_JUNCTION = 11;

const ASPECT_COLOURS = { 0: '#e53935', 1: '#fb8c00', 2: '#43a047' };
const TURNOUT_COLOURS = { true: '#00bcd4', false: '#607d8b' };

export default function LayoutMap({ layoutMap, turnouts, signals, send }) {
  const { nodes, edges } = layoutMap;
  const svgRef = useRef(null);
  const [tool, setTool] = useState('select'); // select | add | connect | delete
  const [addType, setAddType] = useState('station');
  const [linking, setLinking] = useState(null); // first node id when connecting
  const [dragging, setDragging] = useState(null); // { id, ox, oy }
  const [labelInput, setLabelInput] = useState(null); // { id, value }

  // --- helpers ---

  function save(newNodes, newEdges) {
    send('layout_map', { nodes: newNodes ?? nodes, edges: newEdges ?? edges });
  }

  function getSVGPoint(e) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  // --- canvas click ---

  function handleSVGClick(e) {
    if (e.target !== svgRef.current && e.target.tagName === 'circle') return;
    if (tool !== 'add') return;
    const pt = getSVGPoint(e);
    const newNode = {
      id: `n${Date.now()}`,
      type: addType,
      x: Math.round(pt.x),
      y: Math.round(pt.y),
      label: addType.charAt(0).toUpperCase() + addType.slice(1),
      turnoutId: null,
      signalAddress: null
    };
    save([...nodes, newNode], edges);
  }

  // --- node click ---

  function handleNodeClick(e, node) {
    e.stopPropagation();

    if (tool === 'delete') {
      save(
        nodes.filter((n) => n.id !== node.id),
        edges.filter((ed) => ed.from !== node.id && ed.to !== node.id)
      );
      return;
    }

    if (tool === 'connect') {
      if (!linking) {
        setLinking(node.id);
      } else {
        if (linking !== node.id) {
          const exists = edges.find(
            (ed) => (ed.from === linking && ed.to === node.id) || (ed.from === node.id && ed.to === linking)
          );
          if (!exists) {
            save(nodes, [...edges, { id: `e${Date.now()}`, from: linking, to: node.id }]);
          }
        }
        setLinking(null);
      }
      return;
    }
  }

  // --- node double-click: edit label / link ---

  function handleNodeDblClick(e, node) {
    e.stopPropagation();
    if (tool !== 'select') return;
    setLabelInput({ id: node.id, value: node.label, turnoutId: node.turnoutId ?? '', signalAddress: node.signalAddress ?? '' });
  }

  function saveLabelInput() {
    if (!labelInput) return;
    save(
      nodes.map((n) =>
        n.id === labelInput.id
          ? {
              ...n,
              label: labelInput.value,
              turnoutId: labelInput.turnoutId !== '' ? Number(labelInput.turnoutId) : null,
              signalAddress: labelInput.signalAddress !== '' ? Number(labelInput.signalAddress) : null
            }
          : n
      ),
      edges
    );
    setLabelInput(null);
  }

  // --- dragging ---

  const handleMouseDown = useCallback(
    (e, node) => {
      if (tool !== 'select') return;
      e.stopPropagation();
      const pt = getSVGPoint(e);
      setDragging({ id: node.id, ox: pt.x - node.x, oy: pt.y - node.y });
    },
    [tool, nodes]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging) return;
      const pt = getSVGPoint(e);
      save(
        nodes.map((n) =>
          n.id === dragging.id ? { ...n, x: Math.round(pt.x - dragging.ox), y: Math.round(pt.y - dragging.oy) } : n
        ),
        edges
      );
    },
    [dragging, nodes, edges]
  );

  const handleMouseUp = useCallback(() => setDragging(null), []);

  // --- node colour by live state ---

  function nodeColour(node) {
    if (node.type === 'turnout' && node.turnoutId != null && turnouts[node.turnoutId]) {
      return TURNOUT_COLOURS[turnouts[node.turnoutId].thrown];
    }
    if (node.type === 'signal' && node.signalAddress != null && signals[node.signalAddress]) {
      return ASPECT_COLOURS[signals[node.signalAddress].aspect];
    }
    const defaults = { station: '#1565c0', junction: '#6a1b9a', siding: '#37474f', turnout: '#607d8b', signal: '#e53935' };
    return defaults[node.type] || '#37474f';
  }

  return (
    <section className="panel layout-panel">
      <div className="panel__header">
        <h2>Layout Map</h2>
        <div className="layout-tools">
          {['select', 'add', 'connect', 'delete'].map((t) => (
            <button
              key={t}
              className={`tool-btn ${tool === t ? 'tool-btn--active' : ''}`}
              onClick={() => { setTool(t); setLinking(null); }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          {tool === 'add' && (
            <select
              className="add-form__input"
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
            >
              {NODE_TYPES.map((nt) => (
                <option key={nt} value={nt}>{nt}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {linking && <div className="layout-hint">Click a second node to connect, or click canvas to cancel.</div>}

      <svg
        ref={svgRef}
        className="layout-svg"
        onClick={handleSVGClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#455a64" />
          </marker>
        </defs>

        {edges.map((ed) => {
          const from = nodes.find((n) => n.id === ed.from);
          const to = nodes.find((n) => n.id === ed.to);
          if (!from || !to) return null;
          return (
            <line
              key={ed.id}
              className={`layout-edge ${tool === 'delete' ? 'layout-edge--deletable' : ''}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              onClick={tool === 'delete' ? (e) => { e.stopPropagation(); save(nodes, edges.filter((e2) => e2.id !== ed.id)); } : undefined}
            />
          );
        })}

        {nodes.map((node) => (
          <g
            key={node.id}
            transform={`translate(${node.x},${node.y})`}
            className={`layout-node ${tool === 'select' ? 'layout-node--draggable' : ''} ${linking === node.id ? 'layout-node--linking' : ''}`}
            onClick={(e) => handleNodeClick(e, node)}
            onDoubleClick={(e) => handleNodeDblClick(e, node)}
            onMouseDown={(e) => handleMouseDown(e, node)}
          >
            <circle r={node.type === 'junction' ? NODE_RADIUS_JUNCTION : NODE_RADIUS} fill={nodeColour(node)} stroke={linking === node.id ? '#00e5ff' : '#263238'} strokeWidth={2} />
            <text className="layout-node__label" textAnchor="middle" dy="0.35em" fontSize={node.type === 'junction' ? 7 : 10}>
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {labelInput && (
        <div className="modal-overlay" onClick={() => setLabelInput(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Node</h3>
            <input
              className="add-form__input"
              value={labelInput.value}
              onChange={(e) => setLabelInput((l) => ({ ...l, value: e.target.value }))}
              placeholder="Label"
              autoFocus
            />
            <input
              className="add-form__input"
              type="number"
              value={labelInput.turnoutId}
              onChange={(e) => setLabelInput((l) => ({ ...l, turnoutId: e.target.value }))}
              placeholder="Linked Turnout ID (optional)"
            />
            <input
              className="add-form__input"
              type="number"
              value={labelInput.signalAddress}
              onChange={(e) => setLabelInput((l) => ({ ...l, signalAddress: e.target.value }))}
              placeholder="Linked Signal Address (optional)"
            />
            <div className="modal__btns">
              <button className="btn-add" onClick={saveLabelInput}>Save</button>
              <button className="btn-cancel" onClick={() => setLabelInput(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
