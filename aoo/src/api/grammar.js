import api from './client';

export const checkGrammar = async (text) => {
  try {
    const res = await api.post('/grammar/check', { text });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getHistory = async (params) => {
  try {
    const res = await api.get('/grammar/history', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
