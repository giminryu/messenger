import api from './api';

export async function getRooms() {
  const response = await api.get('/rooms');
  return response.data;
}

export async function getMessages(roomId, limit = 50) {
  const response = await api.get(`/rooms/${roomId}/messages`, {
    params: { limit },
  });
  return response.data;
}

export async function createDirectRoom(targetUserId) {
  const response = await api.post('/rooms/direct', { targetUserId });
  return response.data;
}

export async function markRead(roomId) {
  const response = await api.post(`/rooms/${roomId}/read`);
  return response.data;
}

export async function getUsers() {
  const response = await api.get('/users');
  return response.data;
}
