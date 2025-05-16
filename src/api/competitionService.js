import api from '../api';

export const getCompetitions = () => api.get('/competitions');
export const createCompetition = (data) => api.post('/competitions', data);

export const getVenues = () => api.get('/competitions/venues/');
export const createVenue = (data) => api.post('/competitions/venues/', data);
