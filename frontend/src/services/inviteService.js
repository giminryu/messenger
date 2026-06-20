import api from './api';

export async function validateInvite(token) {
  const response = await api.get(`/invite/validate/${token}`);
  return response.data;
}

export async function createInvite({ label, maxUses, expiresInDays }) {
  const response = await api.post('/invite/create', {
    label,
    maxUses,
    expiresInDays,
  });
  return response.data;
}

export async function listInvites() {
  const response = await api.get('/invite/list');
  return response.data;
}
