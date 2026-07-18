import api from './client';

export const createWriting = async (data) => {
  try {
    const res = await api.post('/writing', data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWritingHistory = async (params) => {
  try {
    const res = await api.get('/writing', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWriting = async (id) => {
  try {
    const res = await api.get(`/writing/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
