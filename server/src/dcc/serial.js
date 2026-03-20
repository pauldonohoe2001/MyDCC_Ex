const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let port = null;
let simulationMode = false;

function initSerial(portPath, onData) {
  try {
    port = new SerialPort({ path: portPath, baudRate: 115200 });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.on('open', () => console.log(`[Serial] Connected to DCC++ EX on ${portPath}`));
    port.on('error', (err) => {
      console.warn(`[Serial] Error: ${err.message} — switching to simulation mode`);
      simulationMode = true;
    });

    parser.on('data', (line) => {
      console.log(`[DCC<<] ${line}`);
      if (onData) onData(line);
    });
  } catch (err) {
    console.warn(`[Serial] Not available (${err.message}) — running in simulation mode`);
    simulationMode = true;
  }
}

function sendCommand(cmd) {
  if (simulationMode || !port || !port.isOpen) {
    console.log(`[SIM] ${cmd}`);
    return;
  }
  console.log(`[DCC>>] ${cmd}`);
  port.write(cmd + '\n', (err) => {
    if (err) console.error('[Serial] Write error:', err.message);
  });
}

module.exports = { initSerial, sendCommand };
