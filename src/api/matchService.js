import api from '../api';

export const getMatches = () => api.get('/matches');
export const createMatch = (data) => api.post('/matches', data);
export const updateMatch = (id, data) => api.put(`/matches/${id}`, data);