function Cursor({ cursor }) {
  return (
    <div
      className="remote-cursor"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        '--cursor-color': cursor.color,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 1L17 10L10 11.5L7 18L3 1Z"
          fill={cursor.color}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="1"
        />
      </svg>
      <span className="cursor-name" style={{ backgroundColor: cursor.color }}>
        {cursor.name}
      </span>
    </div>
  );
}

export default Cursor;
