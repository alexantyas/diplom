import api from '../api'; 
export const createAdditionalInfo = (data) => api.post('/additional-info/', data);
export const getAdditionalInfo = (id) => api.get(`/additional-info/${id}`);
export const getAllAdditionalInfos = () => api.get('/additional-info/');