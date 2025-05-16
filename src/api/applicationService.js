import api from '../api';

export const getApplications = () => api.get('/applications');
export const createApplication = (data) => api.post('/applications', data);

export const getParticipants = () => api.get('/applications/participants/');
export const addParticipant = (data) => api.post('/applications/participants/', data);

export const getRequestTypes = () => api.get('/applications/request-types/');
export const createRequestType = (data) => api.post('/applications/request-types/', data);
