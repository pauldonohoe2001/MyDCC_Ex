const { sendCommand } = require('./serial');

// DCC++ EX command reference:
// <t REGISTER CAB SPEED DIRECTION>  — throttle (SPEED 0-126, DIRECTION 1=fwd 0=rev)
// <T ID THROW>                       — turnout (THROW 0=closed 1=thrown)
// <a ADDRESS SUBADDRESS ACTIVATE>    — accessory decoder (signals etc.)
// <!>                                — emergency stop all
// <1>                                — power on
// <0>                                — power off

function throttle(register, cab, speed, direction) {
  sendCommand(`<t ${register} ${cab} ${speed} ${direction ? 1 : 0}>`);
}

function emergencyStop() {
  sendCommand('<!>');
}

function setTurnout(id, thrown) {
  sendCommand(`<T ${id} ${thrown ? 1 : 0}>`);
}

// Signal aspects: 0=red, 1=amber, 2=green
// Mapped to accessory decoder subaddresses
function setSignal(address, aspect) {
  sendCommand(`<a ${address} ${aspect} 1>`);
}

function powerOn() {
  sendCommand('<1>');
}

function powerOff() {
  sendCommand('<0>');
}

module.exports = { throttle, emergencyStop, setTurnout, setSignal, powerOn, powerOff };
