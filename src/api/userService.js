import api from '../api';

// Получить заголовок авторизации (токен из localStorage)
export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Получить всех пользователей (защищённая ручка)
export const getUsers = () => api.get('/users/', {
  headers: getAuthHeaders()
});

// Получить пользователя по id (защищённая ручка)
export const getUser = (id) => api.get(`/users/${id}`, {
  headers: getAuthHeaders()
});

// Создать пользователя (регистрация, токен не нужен)
export const createUser = (data) => api.post('/users/', data);

// Создать доп. инфу для пользователя (тоже не требует токен)
export const createAdditionalInfo = (data) => api.post('/additional-info/', data);

// Получить профиль текущего пользователя по токену
export const getCurrentUser = () => api.get('/users/me', {
  headers: getAuthHeaders()
});

// Если нужно реализовать logout:
export const logout = () => {
  localStorage.removeItem('token');
};
