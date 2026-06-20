import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerService, login as loginService } from '../services/authService';
import { validateInvite } from '../services/inviteService';

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const inviteToken = searchParams.get('invite');

  const [validating, setValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteLabel, setInviteLabel] = useState('');
  const [tokenError, setTokenError] = useState('');

  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!inviteToken) {
      setValidating(false);
      setInviteValid(false);
      setTokenError('초대 링크가 필요합니다.');
      return;
    }

    let cancelled = false;
    validateInvite(inviteToken)
      .then((data) => {
        if (cancelled) return;
        setInviteValid(true);
        setInviteLabel(data.label || '');
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          '유효하지 않거나 만료된 초대 링크입니다.';
        setTokenError(msg);
        setInviteValid(false);
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nickname.trim() || !password || !passwordConfirm) return;

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await registerService({
        nickname: nickname.trim(),
        password,
        inviteToken,
      });

      // Auto-login after register
      const loginData = await loginService({
        nickname: nickname.trim(),
        password,
      });
      const { user, accessToken, refreshToken } = loginData;
      login(user, accessToken, refreshToken);
      navigate('/chat', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        '가입에 실패했습니다. 다시 시도해주세요.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (validating) {
    return (
      <div
        style={{
          minHeight: '100vh',
          minHeight: '-webkit-fill-available',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #0f766e 0%, #134e4a 100%)',
        }}
      >
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ margin: 0, fontSize: 15, opacity: 0.8 }}>초대 링크 확인 중...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!inviteValid) {
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
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: '48px 28px 36px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 20, lineHeight: 1 }}>🔒</div>
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: 22,
              fontWeight: 800,
              color: '#1e293b',
            }}
          >
            초대 링크가 필요합니다
          </h2>
          <p
            style={{
              margin: '0 0 28px',
              fontSize: 14,
              color: '#64748b',
              lineHeight: 1.6,
            }}
          >
            {tokenError || '이 서비스는 초대된 멤버만 가입할 수 있어요.'}
          </p>
          <Link
            to="/login"
            style={{
              display: 'block',
              padding: '14px 20px',
              backgroundColor: '#0f766e',
              color: '#fff',
              borderRadius: 12,
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 700,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Valid token — show registration form
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 12 }}>🎉</div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: '#0f766e',
              letterSpacing: '-0.5px',
            }}
          >
            초대받으셨군요!
          </h1>
          {inviteLabel && (
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
              초대: <strong style={{ color: '#0f766e' }}>{inviteLabel}</strong>
            </p>
          )}
          <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 13 }}>
            닉네임과 비밀번호를 설정해주세요
          </p>
        </div>

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
              placeholder="사용할 닉네임을 입력하세요"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              maxLength={20}
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
              autoComplete="new-password"
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
              비밀번호 확인
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              autoComplete="new-password"
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
            disabled={loading || !nickname.trim() || !password || !passwordConfirm}
            style={{
              width: '100%',
              height: 52,
              backgroundColor:
                loading || !nickname.trim() || !password || !passwordConfirm
                  ? '#94d5cc'
                  : '#0f766e',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 17,
              fontWeight: 700,
              cursor:
                loading || !nickname.trim() || !password || !passwordConfirm
                  ? 'not-allowed'
                  : 'pointer',
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none',
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
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link
            to="/login"
            style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}
          >
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
