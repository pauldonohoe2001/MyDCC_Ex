export default function EStop({ send }) {
  return (
    <button
      className="estop"
      onClick={() => send('estop', {})}
      aria-label="Emergency Stop"
    >
      E-STOP
    </button>
  );
}
