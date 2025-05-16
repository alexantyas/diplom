import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Авторизация (логин)
export async function loginUser(username, password) {
  return api.post(
    '/auth/token',
    new URLSearchParams({
      username,
      password,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
}

// Получить профиль пользователя по токену
export async function getProfile(token) {
  return api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default api;