import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginService } from '../services/authService';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nickname.trim() || !password) return;

    setError('');
    setLoading(true);

    try {
      const data = await loginService({ nickname: nickname.trim(), password });
      const { user, accessToken, refreshToken } = data;
      login(user, accessToken, refreshToken);
      navigate('/chat', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '로그인에 실패했습니다. 닉네임과 비밀번호를 확인해주세요.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0f766e 0%, #134e4a 100%)',
        padding: '24px 20px',
        paddingTop: 'calc(24px + env(safe-area-inset-top))',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#fff',
          borderRadius: 24,
          padding: '40px 28px 32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>💬</div>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: '#0f766e',
              letterSpacing: '-0.5px',
            }}
          >
            메신저
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
            초대된 멤버만 사용할 수 있어요
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
                marginBottom: 6,
              }}
            >
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                fontSize: 16,
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                outline: 'none',
                color: '#1e293b',
                backgroundColor: '#f8fafc',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
                marginBottom: 6,
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                fontSize: 16,
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                outline: 'none',
                color: '#1e293b',
                backgroundColor: '#f8fafc',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#0f766e')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            />
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
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !nickname.trim() || !password}
            style={{
              width: '100%',
              height: 52,
              backgroundColor:
                loading || !nickname.trim() || !password ? '#94d5cc' : '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 17,
              fontWeight: 700,
              cursor: loading || !nickname.trim() || !password ? 'not-allowed' : 'pointer',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
              transition: 'background-color 0.15s, transform 0.08s',
              marginTop: 4,
              letterSpacing: '-0.2px',
            }}
            onPointerDown={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* Footer link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link
            to="/register"
            style={{
              fontSize: 14,
              color: '#0f766e',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            초대 링크가 있나요? 가입하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
