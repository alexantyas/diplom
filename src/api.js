import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
});

// 🔒 Добавляем токен ко всем запросам, кроме /auth/token
api.interceptors.request.use(config => {
  if (!config.url.endsWith('/auth/token')) {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 🔑 Авторизация
export async function loginUser(username, password) {
  return api.post(
    '/auth/token',
    new URLSearchParams({ username, password }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
}

// 👤 Получить профиль текущего пользователя
export async function getProfile() {
  return api.get('/users/me');
}

// 📥 Получить заявки (одобренные)
export function getApprovedApplications(competitionId) {
  return api.get('/applications/', {
    params: { competition_id: competitionId }
  });
}

// 📥 Получить матчи по соревнованию
export function getMatchesByCompetition(compId) {
  return api.get('/matches/', {
    params: { competition_id: compId }
  });
}

// PATCH одного матча

export function putMatch(id, data) {
  console.log('[DEBUG][API] patchMatch called →', id, data);
  return api.patch(`/matches/${id}`, data)
    .then(resp => {
      console.log('[DEBUG][API] patchMatch response →', resp.status, resp.data);
      return resp;
    })
    .catch(err => {
      console.error('[DEBUG][API] patchMatch error →', err);
      throw err;
    });
}

// 📦 Пакетное создание матчей
export function createMatchesBatch(matches) {
  return api.post('/matches/batch', matches);
}

// GET брэкет турнира
export function getBracket(compId) {
  return api.get(`/competitions/${compId}/bracket`);
}

// POST результатов брэкета
export function postBracketResults(compId, payload) {
  return api.post(`/competitions/${compId}/bracket`, payload);
}

// 📤 Обновить соревнование (PUT)
export function updateCompetition(id, data) {
  return api.put(`/competitions/${id}`, data);
}

// ❌ Удалить соревнование (DELETE)
export function deleteCompetition(id) {
  return api.delete(`/competitions/${id}`);
}

// 📥 Получить все соревнования
export function getCompetitions() {
  return api.get('/competitions/');
}

// 📥 Получить все заявки
export function getAllApplications() {
  return api.get('/applications/');
}
export const getUserById = async (userId) => {
  const response = await axiosInstance.get(`/users/${userId}`)
  return response.data
}

export const getTeamById = async (teamId) => {
  const response = await axiosInstance.get(`/teams/${teamId}`)
  return response.data
}
export default api;
