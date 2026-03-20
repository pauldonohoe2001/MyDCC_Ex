# DCC Centre — Solution Architecture

## Overview

DCC Centre is a Progressive Web App (PWA) control panel for model railway layouts using the DCC++ EX open-source command station. It provides real-time, multi-client control of locomotives, points (turnouts), signals, and a drag-and-drop layout map via a browser on any device on the local network.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Local Network                        │
│                                                         │
│  ┌──────────────┐   WebSocket      ┌─────────────────┐  │
│  │   Browser    │◄────────────────►│   Node.js       │  │
│  │   (PWA)      │   ws://host:3001 │   Server        │  │
│  │              │                  │   :3001         │  │
│  │  React App   │   REST (init)    │                 │  │
│  │  Vite :5173  │────────────────► │  Express        │  │
│  └──────────────┘   GET /api/state │  WebSocketServer│  │
│                                    │  SerialPort     │  │
│  (multiple clients supported)      └────────┬────────┘  │
│                                             │ Serial     │
│                                             │ USB/COM    │
│                                    ┌────────▼────────┐  │
│                                    │  DCC++ EX       │  │
│                                    │  Command Station│  │
│                                    │  (Arduino)      │  │
│                                    └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Server (`/server`)

A lightweight Node.js process that acts as the bridge between browser clients and the DCC++ EX hardware.

| File | Responsibility |
|------|---------------|
| `index.js` | Entry point. Creates Express app, HTTP server, WebSocket server. Wires serial → broadcast pipeline. |
| `src/dcc/serial.js` | Opens the serial port to DCC++ EX. Auto-falls back to simulation mode if hardware is absent. |
| `src/dcc/commands.js` | Translates logical operations (throttle, e-stop, turnout, signal, power) into raw DCC++ EX command strings. |
| `src/state/store.js` | In-memory state store. Single source of truth for all connected clients. |
| `src/websocket/handler.js` | Processes incoming WebSocket messages, mutates state, and broadcasts updates to all clients. |

**Ports:**
- HTTP/WebSocket: `3001` (configurable via `PORT` env var)
- Serial: `COM3` by default (configurable via `DCC_PORT` env var)

**Serial baud rate:** 115200 (DCC++ EX default)

---

### 2. Client (`/client`)

A React single-page application built with Vite and configured as a PWA. Designed for touchscreen use on tablets and phones.

| File | Responsibility |
|------|---------------|
| `src/main.jsx` | React root mount. |
| `src/App.jsx` | Top-level layout. Owns tab navigation. Passes `state` and `send` down to panels. |
| `src/App.css` | Global dark control-room theme (CSS custom properties). |
| `src/hooks/useWebSocket.js` | Custom hook. Manages WebSocket connection lifecycle, auto-reconnect, and applies server messages to local React state. |
| `src/components/StatusBar.jsx` | Header bar. Shows title, power on/off toggle, connection status. |
| `src/components/EStop.jsx` | Full-width emergency stop button. Sends `estop` to server which stops all locos immediately. |
| `src/components/ThrottlePanel.jsx` | Manages the list of active locos. Add/remove locos by DCC address. |
| `src/components/Throttle.jsx` | Individual loco throttle card. Vertical speed slider (0–126), FWD/REV direction, individual STOP. |
| `src/components/PointsPanel.jsx` | Add/remove/throw/close turnouts by DCC turnout ID. |
| `src/components/SignalPanel.jsx` | Add/remove signals. Visual signal head (lamp stack) + RED/AMBER/GREEN aspect buttons. |
| `src/components/LayoutMap.jsx` | SVG-based drag-and-drop track diagram. Nodes reflect live turnout/signal state by colour. |
| `vite.config.js` | Vite + React plugin + PWA manifest. Proxies `/api` to server in dev. |
| `index.html` | Shell HTML. PWA meta tags for iOS and Android home-screen install. |

---

## Data Flow

### Startup

```
Browser loads → useWebSocket connects to ws://host:3001
             → Server sends { type: 'state', payload: <full state> }
             → React state initialised from snapshot
```

### User Action (e.g. move throttle slider)

```
Throttle.jsx onChange → send('throttle', { cab, speed, direction })
  → useWebSocket sends JSON over WebSocket
  → handler.js receives, calls commands.js → serial.js → DCC++ EX
  → handler.js calls updateLoco() on store
  → handler.js broadcasts { type: 'loco_update', payload } to ALL clients
  → Every connected browser updates its React state
```

### Hardware Response

```
DCC++ EX sends line over serial
  → serial.js readline parser fires
  → index.js broadcasts { type: 'dcc_response', payload: line } to all clients
```

### Late-joining Client

```
New browser connects → Server immediately sends full state snapshot
                    → Client is synchronised without page reload
```

---

## WebSocket Message Protocol

| Direction | Type | Payload | Description |
|-----------|------|---------|-------------|
| S → C | `state` | Full state object | Initial sync or full refresh |
| S → C | `loco_update` | `{ cab, speed, direction }` | Single loco changed |
| S → C | `estop` | All locos object | All locos stopped |
| S → C | `power_update` | `{ on }` | Track power changed |
| S → C | `turnout_update` | `{ id, thrown }` | Single turnout changed |
| S → C | `signal_update` | `{ address, aspect }` | Single signal changed |
| S → C | `layout_map_update` | `{ nodes, edges }` | Map topology changed |
| S → C | `dcc_response` | Raw string | Raw DCC++ EX response line |
| S → C | `error` | String message | Server-side validation error |
| C → S | `throttle` | `{ cab, speed, direction }` | Set loco speed/direction |
| C → S | `estop` | `{}` | Emergency stop all |
| C → S | `power` | `{ on }` | Track power on/off |
| C → S | `add_loco` | `{ cab, name }` | Register a loco |
| C → S | `remove_loco` | `{ cab }` | Deregister a loco |
| C → S | `turnout` | `{ id, thrown }` | Throw/close a turnout |
| C → S | `add_turnout` | `{ id, name }` | Register a turnout |
| C → S | `remove_turnout` | `{ id }` | Deregister a turnout |
| C → S | `signal` | `{ address, aspect }` | Set signal aspect (0=red, 1=amber, 2=green) |
| C → S | `add_signal` | `{ address, name }` | Register a signal |
| C → S | `remove_signal` | `{ address }` | Deregister a signal |
| C → S | `layout_map` | `{ nodes, edges }` | Save layout map |

---

## State Model

The server holds a single shared state object:

```js
{
  power: Boolean,
  locos: {
    [cab]: { cab, name, speed, direction, register }
    // cab: DCC address (1–9999)
    // speed: 0–126
    // direction: 1=forward, 0=reverse
    // register: DCC++ EX throttle register slot (1–10)
  },
  turnouts: {
    [id]: { id, name, thrown }
    // thrown: true=thrown, false=closed
  },
  signals: {
    [address]: { address, name, aspect }
    // aspect: 0=red, 1=amber, 2=green
  },
  layoutMap: {
    nodes: [ { id, type, x, y, label, turnoutId, signalAddress } ],
    edges: [ { id, from, to } ]
  }
}
```

**Limits:** Maximum 10 simultaneous locos (DCC++ EX register constraint).

**Persistence:** State is in-memory only — it resets on server restart. Layout map and roster are not currently persisted to disk.

---

## DCC++ EX Command Mapping

| Operation | DCC++ EX Command |
|-----------|-----------------|
| Set throttle | `<t REGISTER CAB SPEED DIR>` |
| Emergency stop | `<!>` |
| Power on | `<1>` |
| Power off | `<0>` |
| Throw/close turnout | `<T ID THROW>` |
| Set signal aspect | `<a ADDRESS SUBADDRESS 1>` |

---

## PWA Configuration

The client is configured as a standalone PWA via `vite-plugin-pwa`:

- **Display mode:** `standalone` (full-screen, no browser chrome)
- **Orientation:** `any` (portrait and landscape)
- **Theme colour:** `#0a1628` (dark navy)
- **Auto-update:** `registerType: 'autoUpdate'` — service worker updates silently
- **Icons:** 192×192 and 512×512 (files expected at `/public/icon-192.png`, `/public/icon-512.png`)

Install the app from the browser's "Add to Home Screen" prompt for a native-like experience on iOS/Android tablets.

---

## Development Setup

```bash
# Terminal 1 — server
cd server
node index.js
# Runs on http://localhost:3001
# Set DCC_PORT=COM4 (or your port) if not COM3

# Terminal 2 — client
cd client
npm run dev
# Runs on http://localhost:5173
# /api requests proxied to :3001 automatically
```

## Production Build

```bash
cd client
npm run build
# Output in client/dist — serve statically or via Express
```

To serve the built client from the same Express server, add:
```js
app.use(express.static(path.join(__dirname, '../client/dist')));
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| WebSocket over HTTP polling | Real-time, bidirectional, low-latency — essential for throttle control |
| Single server-side state store | All clients always see the same truth; no client-side divergence |
| Simulation mode | Allows UI development and testing without DCC++ EX hardware connected |
| REST endpoint for initial state | Provides a synchronous snapshot for late-joining clients before WS is established |
| In-memory state only | Keeps the server dependency-free (no database); acceptable for a local-network appliance |
| Vite PWA plugin | Zero-config service worker and manifest; enables tablet home-screen install |

---

*Generated: 2026-03-20*
