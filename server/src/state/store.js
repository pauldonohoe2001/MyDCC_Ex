// Shared in-memory state — broadcast to all clients on change

const state = {
  power: false,
  locos: {},      // { [cab]: { cab, name, speed, direction, register } }
  turnouts: {},   // { [id]: { id, name, thrown } }
  signals: {},    // { [address]: { address, name, aspect } }  0=red 1=amber 2=green
  layoutMap: { nodes: [], edges: [] }
};

function getState() {
  return state;
}

function setPower(on) {
  state.power = !!on;
}

function addLoco(cab, name) {
  const register = Object.keys(state.locos).length + 1;
  state.locos[cab] = { cab, name: name || `Loco ${cab}`, speed: 0, direction: 1, register };
}

function removeLoco(cab) {
  delete state.locos[cab];
  // Reassign registers
  Object.values(state.locos).forEach((loco, i) => { loco.register = i + 1; });
}

function updateLoco(cab, patch) {
  if (state.locos[cab]) {
    state.locos[cab] = { ...state.locos[cab], ...patch };
  }
}

function stopAllLocos() {
  Object.keys(state.locos).forEach((cab) => {
    state.locos[cab].speed = 0;
  });
}

function addTurnout(id, name) {
  state.turnouts[id] = { id, name: name || `Turnout ${id}`, thrown: false };
}

function removeTurnout(id) {
  delete state.turnouts[id];
}

function updateTurnout(id, patch) {
  if (state.turnouts[id]) {
    state.turnouts[id] = { ...state.turnouts[id], ...patch };
  }
}

function addSignal(address, name) {
  state.signals[address] = { address, name: name || `Signal ${address}`, aspect: 0 };
}

function removeSignal(address) {
  delete state.signals[address];
}

function updateSignal(address, patch) {
  if (state.signals[address]) {
    state.signals[address] = { ...state.signals[address], ...patch };
  }
}

function updateLayoutMap(map) {
  state.layoutMap = map;
}

module.exports = {
  getState, setPower,
  addLoco, removeLoco, updateLoco, stopAllLocos,
  addTurnout, removeTurnout, updateTurnout,
  addSignal, removeSignal, updateSignal,
  updateLayoutMap
};
