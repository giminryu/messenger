import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { icon: '💬', label: '채팅', path: '/chat' },
  { icon: '👥', label: '참여자', path: '/members' },
  { icon: '⚙️', label: '설정', path: '/settings' },
];

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(path) {
    if (path === '/chat') {
      return location.pathname === '/chat' || location.pathname.startsWith('/chat/');
    }
    return location.pathname === path;
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(56px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: '#fff',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: active ? '#0f766e' : '#94a3b8',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              padding: '4px 0',
              transition: 'color 0.15s ease',
              minHeight: 56,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                letterSpacing: '-0.01em',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
