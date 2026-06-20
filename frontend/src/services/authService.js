import api from './api';

export async function register({ nickname, password, inviteToken }) {
  const response = await api.post('/auth/register', {
    nickname,
    password,
    inviteToken,
  });
  return response.data;
}

export async function login({ nickname, password }) {
  const response = await api.post('/auth/login', {
    nickname,
    password,
  });
  return response.data;
}

export async function refresh(refreshToken) {
  const response = await api.post('/auth/refresh', { refreshToken });
  return response.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // swallow errors on logout
  }
}
