const COLORS = [
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Pink', value: '#fda4af' },
  { name: 'Blue', value: '#93c5fd' },
  { name: 'Green', value: '#86efac' },
  { name: 'Purple', value: '#c4b5fd' },
  { name: 'Orange', value: '#fed7aa' },
];

function Toolbar({ connected, onlineUsers, selectedColor, onColorChange, userName, userColor }) {
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-logo">
          <span className="logo-icon">◆</span>
          <h1 className="logo-text">CollabBoard</h1>
        </div>
      </div>

      <div className="toolbar-center">
        <span className="toolbar-label">New note color:</span>
        <div className="toolbar-colors">
          {COLORS.map((c) => (
            <button
              key={c.value}
              className={`toolbar-color-dot${selectedColor === c.value ? ' active' : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => onColorChange(c.value)}
              title={c.name}
              aria-label={`Select ${c.name}`}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-right">
        {userName && (
          <div className="toolbar-user">
            <div className="user-avatar" style={{ backgroundColor: userColor }}>
              {userName.charAt(0)}
            </div>
            <span className="user-name">{userName}</span>
          </div>
        )}
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot" />
          <span className="status-text">
            {connected ? `${onlineUsers} online` : 'Reconnecting…'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Toolbar;
