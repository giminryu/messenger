import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout as logoutService } from '../services/authService';
import { createInvite, listInvites } from '../services/inviteService';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';

function InviteModal({ onClose, onCreated }) {
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setError('');
    setLoading(true);
    try {
      const data = await createInvite({
        label: label.trim() || undefined,
        maxUses: Number(maxUses),
        expiresInDays: Number(expiresInDays),
      });
      onCreated(data);
    } catch (e) {
      setError(e.response?.data?.message || '생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          padding: '0 0 env(safe-area-inset-bottom)',
          animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>

        <div
          style={{
            width: 36,
            height: 4,
            backgroundColor: '#e2e8f0',
            borderRadius: 2,
            margin: '12px auto 4px',
          }}
        />

        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
            초대 링크 생성
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

        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              라벨 (선택)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 친구용, 직장동료"
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px',
                fontSize: 16,
                border: '1.5px solid #e2e8f0',
                borderRadius: 10,
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                최대 사용 수
              </label>
              <input
                type="number"
                value={maxUses}
                min={1}
                max={100}
                onChange={(e) => setMaxUses(e.target.value)}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  fontSize: 16,
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#f8fafc',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                만료 (일)
              </label>
              <input
                type="number"
                value={expiresInDays}
                min={1}
                max={365}
                onChange={(e) => setExpiresInDays(e.target.value)}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px',
                  fontSize: 16,
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#f8fafc',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                color: '#dc2626',
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              width: '100%',
              height: 48,
              backgroundColor: loading ? '#94d5cc' : '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
            }}
          >
            {loading ? '생성 중...' : '링크 생성'}
          </button>
        </div>
      </div>
    </>
  );
}

function CreatedLinkModal({ token, onClose }) {
  const link = `${window.location.origin}/register?invite=${token}`;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // fallback
        const el = document.createElement('textarea');
        el.value = link;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }

  return (
    <>
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
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderRadius: '20px 20px 0 0',
          zIndex: 201,
          padding: '0 0 env(safe-area-inset-bottom)',
          animation: 'slideUp 0.25s ease',
        }}
      >
        <style>{`@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>

        <div
          style={{
            width: 36,
            height: 4,
            backgroundColor: '#e2e8f0',
            borderRadius: 2,
            margin: '12px auto 4px',
          }}
        />

        <div style={{ padding: '20px 20px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔗</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
              초대 링크가 생성됐어요!
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>
              아래 링크를 공유해주세요
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#f0fdfa',
              border: '1.5px solid #99f6e4',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              wordBreak: 'break-all',
              fontSize: 13,
              color: '#0f766e',
              lineHeight: 1.5,
            }}
          >
            {link}
          </div>

          <button
            onClick={handleCopy}
            style={{
              width: '100%',
              height: 48,
              backgroundColor: copied ? '#065f46' : '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              marginBottom: 10,
              transition: 'background-color 0.2s',
            }}
          >
            {copied ? '✓ 복사됨!' : '링크 복사'}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              height: 44,
              backgroundColor: 'transparent',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}

function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingInvites(true);
    listInvites()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.invites || [];
        setInvites(list);
      })
      .catch(() => setInvites([]))
      .finally(() => setLoadingInvites(false));
  }, [isAdmin]);

  function handleInviteCreated(data) {
    setShowCreateModal(false);
    const token = data.token || data.inviteToken || data.code;
    setCreatedToken(token);
    // Refresh invite list
    listInvites()
      .then((d) => {
        const list = Array.isArray(d) ? d : d.invites || [];
        setInvites(list);
      })
      .catch(() => {});
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logoutService();
    logout();
    navigate('/login', { replace: true });
  }

  function formatExpiry(dateStr) {
    if (!dateStr) return '기한 없음';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d - now;
    if (diffMs < 0) return '만료됨';
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${diffDays}일 남음`;
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
            ⚙️ 설정
          </h1>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          paddingTop: 'calc(56px + env(safe-area-inset-top))',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Profile section */}
        <div
          style={{
            backgroundColor: '#fff',
            margin: '16px 16px 0',
            borderRadius: 16,
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <Avatar name={user?.nickname} size={60} />
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#1e293b',
                marginBottom: 4,
              }}
            >
              {user?.nickname}
            </div>
            {isAdmin && (
              <span
                style={{
                  fontSize: 12,
                  color: '#0f766e',
                  fontWeight: 700,
                  backgroundColor: '#ccfbf1',
                  padding: '3px 8px',
                  borderRadius: 10,
                }}
              >
                관리자
              </span>
            )}
          </div>
        </div>

        {/* Admin: invite section */}
        {isAdmin && (
          <div style={{ margin: '16px 16px 0' }}>
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {/* Section header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  🔗 초대 링크
                </span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0f766e',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    minHeight: 36,
                  }}
                >
                  + 생성
                </button>
              </div>

              {/* Invite list */}
              {loadingInvites ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: 14,
                  }}
                >
                  불러오는 중...
                </div>
              ) : invites.length === 0 ? (
                <div
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    color: '#94a3b8',
                    fontSize: 14,
                  }}
                >
                  생성된 초대 링크가 없어요
                </div>
              ) : (
                invites.map((inv) => (
                  <div
                    key={inv.id || inv.token}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #f8fafc',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                        {inv.label || '라벨 없음'}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: inv.expiresAt && new Date(inv.expiresAt) < new Date() ? '#ef4444' : '#64748b',
                          fontWeight: 500,
                        }}
                      >
                        {formatExpiry(inv.expiresAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      사용: {inv.useCount || inv.use_count || 0} / {inv.maxUses || inv.max_uses || '∞'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Logout button */}
        <div style={{ margin: '16px 16px 0' }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loggingOut ? '#fca5a5' : '#fff',
              color: loggingOut ? '#7f1d1d' : '#ef4444',
              border: '1.5px solid #fecaca',
              borderRadius: 16,
              fontSize: 16,
              fontWeight: 700,
              cursor: loggingOut ? 'not-allowed' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
            onPointerDown={(e) => {
              if (!loggingOut) e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onPointerUp={(e) => {
              if (!loggingOut) e.currentTarget.style.backgroundColor = '#fff';
            }}
            onPointerLeave={(e) => {
              if (!loggingOut) e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            {loggingOut ? '로그아웃 중...' : '🚪 로그아웃'}
          </button>
        </div>
      </main>

      <BottomNav />

      {/* Create invite modal */}
      {showCreateModal && (
        <InviteModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleInviteCreated}
        />
      )}

      {/* Show created link modal */}
      {createdToken && (
        <CreatedLinkModal
          token={createdToken}
          onClose={() => setCreatedToken(null)}
        />
      )}
    </div>
  );
}

export default Settings;
