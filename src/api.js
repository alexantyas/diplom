import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// << ДОБАВЬ interceptor (он добавляет токен во все запросы кроме /auth/token)
api.interceptors.request.use(config => {
  // Не добавляем токен только для ручки /auth/token
  if (!config.url.endsWith('/auth/token')) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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

export async function getProfile(token) {
  // Теперь этот метод не нужен – можно просто: await api.get('/users/me')
  return api.get('/users/me');
}
export function getApprovedApplications(competitionId) {
  return api.get(
    `/applications?competition_id=${competitionId}`
  );
}

// Пакетно создать бои
export function createMatchesBatch(matches) {
  return api.post('/matches/batch', matches);
}

export function getMatchesByCompetition(competitionId) {
  return api.get(`/matches`, {
    params: { competition_id: competitionId }
  });
}


export default api;
