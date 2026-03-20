import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = `ws://${window.location.hostname}:3001`;

export function useWebSocket() {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState({
    power: false,
    locos: {},
    turnouts: {},
    signals: {},
    layoutMap: { nodes: [], edges: [] }
  });

  useEffect(() => {
    let alive = true;

    function connect() {
      if (!alive) return;
      const socket = new WebSocket(WS_URL);
      ws.current = socket;

      socket.onopen = () => { if (alive) setConnected(true); };

      socket.onclose = () => {
        if (alive) {
          setConnected(false);
          setTimeout(connect, 2000);
        }
      };

      socket.onerror = () => socket.close();

      socket.onmessage = (event) => {
        if (!alive) return;
        try {
          const msg = JSON.parse(event.data);
          applyMessage(msg, setState);
        } catch (e) {
          console.error('Bad WS message', e);
        }
      };
    }

    connect();
    return () => { alive = false; ws.current?.close(); };
  }, []);

  const send = useCallback((type, payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { connected, state, send };
}

function applyMessage(msg, setState) {
  switch (msg.type) {
    case 'state':
      setState(msg.payload);
      break;

    case 'loco_update':
      setState((s) => ({
        ...s,
        locos: {
          ...s.locos,
          [msg.payload.cab]: { ...s.locos[msg.payload.cab], ...msg.payload }
        }
      }));
      break;

    case 'estop':
      setState((s) => ({ ...s, locos: msg.payload }));
      break;

    case 'power_update':
      setState((s) => ({ ...s, power: msg.payload.on }));
      break;

    case 'turnout_update':
      setState((s) => ({
        ...s,
        turnouts: {
          ...s.turnouts,
          [msg.payload.id]: { ...s.turnouts[msg.payload.id], ...msg.payload }
        }
      }));
      break;

    case 'signal_update':
      setState((s) => ({
        ...s,
        signals: {
          ...s.signals,
          [msg.payload.address]: { ...s.signals[msg.payload.address], ...msg.payload }
        }
      }));
      break;

    case 'layout_map_update':
      setState((s) => ({ ...s, layoutMap: msg.payload }));
      break;

    default:
      break;
  }
}
