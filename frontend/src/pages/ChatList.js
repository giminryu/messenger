import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRooms, createDirectRoom, getUsers } from '../services/roomService';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function UserListModal({ onClose, onSelect, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  useEffect(() => {
    getUsers()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.users || [];
        setUsers(list.filter((u) => u.id !== currentUserId));
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  async function handleSelect(user) {
    setCreating(user.id);
    try {
      const room = await createDirectRoom(user.id);
      onSelect(room);
    } catch (e) {
      setCreating(null);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom)',
          animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>

        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            backgroundColor: '#e2e8f0',
            borderRadius: 2,
            margin: '12px auto 4px',
          }}
        />

        {/* Title */}
        <div
          style={{
            padding: '12px 20px 12px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
            새 대화 시작
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px 8px',
              lineHeight: 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            ×
          </button>
        </div>

        {/* User list */}
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              불러오는 중...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              대화할 수 있는 멤버가 없어요
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  gap: 14,
                  borderBottom: '1px solid #f8fafc',
                }}
              >
                <Avatar name={user.nickname} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>
                    {user.nickname}
                  </div>
                </div>
                <button
                  onClick={() => handleSelect(user)}
                  disabled={creating === user.id}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: creating === user.id ? '#94d5cc' : '#0f766e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: creating === user.id ? 'not-allowed' : 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    flexShrink: 0,
                    minHeight: 36,
                  }}
                >
                  {creating === user.id ? '...' : '대화하기'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function ChatList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadRooms = useCallback(() => {
    getRooms()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.rooms || [];
        setRooms(list);
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  function handleRoomCreated(room) {
    setShowModal(false);
    navigate(`/chat/${room.id}`);
  }

  function getRoomDisplayName(room) {
    if (room.name) return room.name;
    if (room.type === 'DIRECT' && room.members) {
      const other = room.members.find((m) => m.id !== user?.id);
      return other?.nickname || '알 수 없는 사용자';
    }
    return '채팅방';
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
      {/* Fixed header */}
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
          justifyContent: 'space-between',
          padding: 'env(safe-area-inset-top) 16px 0',
          zIndex: 50,
          boxSizing: 'border-box',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 56 }}>
          <span style={{ fontSize: 22 }}>💬</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0f766e', letterSpacing: '-0.3px' }}>
            메신저
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, height: 56, alignItems: 'center' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: 44,
              height: 44,
              border: 'none',
              background: 'none',
              fontSize: 22,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              WebkitTapHighlightColor: 'transparent',
              color: '#475569',
            }}
            aria-label="새 대화"
          >
            ✏️
          </button>
        </div>
      </header>

      {/* Main scrollable content */}
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
          // Skeleton
          <div style={{ padding: '8px 0' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  gap: 14,
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    flexShrink: 0,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 14,
                      backgroundColor: '#e2e8f0',
                      borderRadius: 6,
                      marginBottom: 8,
                      width: '60%',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      backgroundColor: '#f1f5f9',
                      borderRadius: 6,
                      width: '80%',
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              </div>
            ))}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `}</style>
          </div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 48,
              gap: 16,
              minHeight: 300,
            }}
          >
            <div style={{ fontSize: 56 }}>💬</div>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: '#64748b',
                textAlign: 'center',
              }}
            >
              아직 대화방이 없어요
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
              멤버와 대화를 시작해보세요
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '14px 28px',
                backgroundColor: '#0f766e',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none',
                marginTop: 8,
                boxShadow: '0 4px 14px rgba(15,118,110,0.4)',
              }}
            >
              새 대화 시작
            </button>
          </div>
        ) : (
          <div>
            {rooms.map((room, idx) => {
              const displayName = getRoomDisplayName(room);
              const unread = room.unreadCount || 0;
              const lastMsg = room.lastMessage?.content || '';
              const lastTime = room.lastMessage?.createdAt || room.updatedAt;

              return (
                <div
                  key={room.id}
                  onClick={() => navigate(`/chat/${room.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '13px 16px',
                    gap: 14,
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    minHeight: 72,
                    transition: 'background-color 0.1s',
                    animation: `fadeIn 0.2s ease ${idx * 0.04}s both`,
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onPointerUp={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                  onPointerLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  <Avatar name={displayName} size={50} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: '#1e293b',
                        marginBottom: 3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#94a3b8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {lastMsg || '대화를 시작하세요'}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 5,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {formatTime(lastTime)}
                    </span>
                    {unread > 0 && (
                      <span
                        style={{
                          minWidth: 20,
                          height: 20,
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 5px',
                        }}
                      >
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
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

      {/* Bottom Navigation */}
      <BottomNav />

      {/* New chat modal */}
      {showModal && (
        <UserListModal
          onClose={() => setShowModal(false)}
          onSelect={handleRoomCreated}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}

export default ChatList;
