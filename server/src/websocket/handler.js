const { throttle, emergencyStop, setTurnout, setSignal, powerOn, powerOff } = require('../dcc/commands');
const {
  getState, setPower,
  addLoco, removeLoco, updateLoco, stopAllLocos,
  addTurnout, removeTurnout, updateTurnout,
  addSignal, removeSignal, updateSignal,
  updateLayoutMap
} = require('../state/store');

function broadcast(wss, message) {
  const json = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(json);
  });
}

function handleMessage(msg, ws, wss) {
  const { type, payload } = msg;

  switch (type) {

    case 'throttle': {
      const { cab, speed, direction } = payload;
      const loco = getState().locos[cab];
      if (!loco) return;
      throttle(loco.register, cab, speed, direction);
      updateLoco(cab, { speed, direction });
      broadcast(wss, { type: 'loco_update', payload: { cab, speed, direction } });
      break;
    }

    case 'estop': {
      emergencyStop();
      stopAllLocos();
      broadcast(wss, { type: 'estop', payload: getState().locos });
      break;
    }

    case 'power': {
      payload.on ? powerOn() : powerOff();
      setPower(payload.on);
      broadcast(wss, { type: 'power_update', payload: { on: payload.on } });
      break;
    }

    case 'add_loco': {
      const { cab, name } = payload;
      if (Object.keys(getState().locos).length >= 10) {
        ws.send(JSON.stringify({ type: 'error', payload: 'Maximum 10 locos reached' }));
        return;
      }
      addLoco(cab, name);
      broadcast(wss, { type: 'state', payload: getState() });
      break;
    }

    case 'remove_loco': {
      removeLoco(payload.cab);
      broadcast(wss, { type: 'state', payload: getState() });
      break;
    }

    case 'turnout': {
      const { id, thrown } = payload;
      setTurnout(id, thrown);
      updateTurnout(id, { thrown });
      broadcast(wss, { type: 'turnout_update', payload: { id, thrown } });
      break;
    }

    case 'add_turnout': {
      addTurnout(payload.id, payload.name);
      broadcast(wss, { type: 'state', payload: getState() });
      break;
    }

    case 'remove_turnout': {
      removeTurnout(payload.id);
      broadcast(wss, { type: 'state', payload: getState() });
      break;
    }

    case 'signal': {
      const { address, aspect } = payload;
      setSignal(address, aspect);
      updateSignal(address, { aspect });
      broadcast(wss, { type: 'signal_update', payload: { address, aspect } });
      break;
    }

    case 'add_signal': {
      addSignal(payload.address, payload.name);
      broadcast(wss, { type: 'state', payload: getState() });
      break;
    }

    case 'remove_signal': {
      removeSignal(payload.address);
      broadcast(wss, { type: 'state', payload: getState() });
      break;
    }

    case 'layout_map': {
      updateLayoutMap(payload);
      broadcast(wss, { type: 'layout_map_update', payload });
      break;
    }

    default:
      console.warn('[WS] Unknown message type:', type);
  }
}

module.exports = { handleMessage };
