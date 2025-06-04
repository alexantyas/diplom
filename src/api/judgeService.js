import api from '../api';

// Получить судей по соревнованию
export const getJudges = (competitionId) => 
  api.get(`/judges/?competition_id=${competitionId}`);

// Создать судей
export const createJudges = (judges) => 
  api.post('/judges/', judges);

// Импорт судей из файла
export const importJudges = (competitionId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/judges/import/?competition_id=${competitionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Удалить судью
export const deleteJudge = (judgeId) => 
  api.delete(`/judges/${judgeId}/`);