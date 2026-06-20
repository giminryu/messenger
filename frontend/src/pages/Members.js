import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, createDirectRoom } from '../services/roomService';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';

function Members() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    getUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.users || [];
        setUsers(list);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleChat(targetUser) {
    if (targetUser.id === user?.id) return;
    setCreating(targetUser.id);
    try {
      const room = await createDirectRoom(targetUser.id);
      navigate(`/chat/${room.id}`);
    } catch (e) {
      setCreating(null);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '-webkit-fill-available',
        backgroundColor: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'calc(56px + env(safe-area-inset-top))',
          paddingTop: 'env(safe-area-inset-top)',
          backgroundColor: '#fff',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          padding: 'env(safe-area-inset-top) 16px 0',
          zIndex: 50,
          boxSizing: 'border-box',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ height: 56, display: 'flex', alignItems: 'center' }}>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 800,
              color: '#1e293b',
              letterSpacing: '-0.3px',
            }}
          >
            👥 참여자
          </h1>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          paddingTop: 'calc(56px + env(safe-area-inset-top))',
          paddingBottom: 'calc(56px + env(safe-area-inset-bottom))',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {loading ? (
          <div style={{ padding: '20px 0' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  gap: 16,
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <div
                  style={{
                    height: 14,
                    width: 100,
                    backgroundColor: '#e2e8f0',
                    borderRadius: 6,
                    animation: 'pulse 1.5s infinite',
                  }}
                />
              </div>
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 15,
            }}
          >
            멤버가 없어요
          </div>
        ) : (
          <div>
            {users.map((u, idx) => {
              const isMe = u.id === user?.id;
              return (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '13px 20px',
                    gap: 16,
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: '#fff',
                    animation: `fadeIn 0.2s ease ${idx * 0.04}s both`,
                  }}
                >
                  <Avatar name={u.nickname} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: '#1e293b',
                      }}
                    >
                      {u.nickname}
                      {isMe && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            color: '#0f766e',
                            fontWeight: 700,
                            backgroundColor: '#ccfbf1',
                            padding: '2px 7px',
                            borderRadius: 10,
                          }}
                        >
                          나
                        </span>
                      )}
                    </div>
                    {u.role === 'ADMIN' && (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        관리자
                      </div>
                    )}
                  </div>
                  {!isMe && (
                    <button
                      onClick={() => handleChat(u)}
                      disabled={creating === u.id}
                      style={{
                        padding: '9px 18px',
                        backgroundColor: creating === u.id ? '#94d5cc' : '#0f766e',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: creating === u.id ? 'not-allowed' : 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        flexShrink: 0,
                        minHeight: 38,
                      }}
                    >
                      {creating === u.id ? '...' : '대화하기'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </main>

      <BottomNav />
    </div>
  );
}

export default Members;
