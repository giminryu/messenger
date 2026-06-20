import React from 'react';

const COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#65a30d'];

function getColor(name) {
  if (!name) return COLORS[0];
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

function Avatar({ name, size = 40, style }) {
  const color = getColor(name);
  const firstChar = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = Math.max(12, Math.floor(size * 0.4));

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: fontSize,
        fontWeight: 700,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {firstChar}
    </div>
  );
}

export default Avatar;
