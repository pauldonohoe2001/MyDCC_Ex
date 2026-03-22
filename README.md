# DCC Centre

A Progressive Web App (PWA) control panel for model railway layouts using [DCC++ EX](https://dcc-ex.com/) open-source command stations.

Control locomotives, points, signals, and build a live layout map — all from a browser on any device on your local network.

![Dark control-room theme](https://img.shields.io/badge/theme-dark%20control%20room-0a1628)
![PWA](https://img.shields.io/badge/PWA-installable-00bcd4)
![Node.js](https://img.shields.io/badge/server-Node.js-339933)
![React](https://img.shields.io/badge/client-React%2FVite-61dafb)

---

## Features

- **Throttles** — Add up to 10 locos by DCC address. Vertical speed slider (0–126), forward/reverse direction, individual stop.
- **Points** — Add and throw/close turnouts by DCC turnout ID.
- **Signals** — Add signals and set aspects (red / amber / green) with a visual signal head display.
- **Layout Map** — Drag-and-drop SVG track diagram. Nodes reflect live turnout and signal state by colour.
- **E-Stop** — One-tap emergency stop for all locos.
- **Power control** — Track power on/off from the status bar.
- **Multi-client** — Multiple browsers/devices stay in sync in real time via WebSocket.
- **Simulation mode** — Runs without hardware connected for UI development and testing.
- **PWA installable** — Add to home screen on iOS/Android for a native-like full-screen experience.

---

## Requirements

- [Node.js](https://nodejs.org/) v18+
- [DCC++ EX](https://dcc-ex.com/) command station connected via USB serial (optional — falls back to simulation mode)

---

## Getting Started

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Start the server

```bash
cd server
node index.js
```

The server starts on **http://localhost:3001**.

By default it looks for DCC++ EX on `COM3`. Override with an environment variable:

```bash
DCC_PORT=COM4 node index.js
```

If no hardware is found it automatically runs in **simulation mode** — all commands are logged to the console instead of sent to hardware.

### 3. Start the client

```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Project Structure

```
mydcc_ex/
├── client/                  # React/Vite PWA frontend
│   ├── src/
│   │   ├── components/      # UI panels and controls
│   │   ├── hooks/           # useWebSocket hook
│   │   ├── App.jsx
│   │   └── App.css          # Dark control-room theme
│   ├── index.html
│   └── vite.config.js       # Vite + PWA config
│
└── server/                  # Node.js backend
    ├── index.js             # Express + WebSocket server
    └── src/
        ├── dcc/
        │   ├── commands.js  # DCC++ EX command builder
        │   └── serial.js    # Serial port interface
        ├── state/
        │   └── store.js     # Shared in-memory state
        └── websocket/
            └── handler.js   # Message handler + broadcaster
```

For a full technical breakdown see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Production Build

```bash
cd client
npm run build
```

Output is in `client/dist`. To serve it from the same Express server add this to `server/index.js`:

```js
app.use(express.static(path.join(__dirname, '../client/dist')));
```

Then only the server needs to run — navigate to **http://localhost:3001**.

---

## DCC++ EX Command Reference

| Operation | Command |
|-----------|---------|
| Set throttle | `<t REGISTER CAB SPEED DIR>` |
| Emergency stop | `<!>` |
| Power on | `<1>` |
| Power off | `<0>` |
| Throw/close turnout | `<T ID THROW>` |
| Set signal aspect | `<a ADDRESS SUBADDRESS 1>` |

---

## Licence

MIT
