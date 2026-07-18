import api from './client';

export const startInterview = async (params) => {
  try {
    const res = await api.post('/interviews/start', params);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitAnswer = async (sessionId, answer) => {
  try {
    const res = await api.post(`/interviews/${sessionId}/answer`, { answer });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSessions = async (params) => {
  try {
    const res = await api.get('/interviews/sessions', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSession = async (id) => {
  try {
    const res = await api.get(`/interviews/sessions/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
