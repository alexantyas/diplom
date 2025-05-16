import api from '../api';

export const getTeams = () => api.get('/teams');
export const createTeam = (data) => api.post('/teams', data);

export const getTeamMembers = () => api.get('/teams/members/');
export const addTeamMember = (data) => api.post('/teams/members/', data);
