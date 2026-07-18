import api from './client';

export const generateReading = async (params) => {
  try {
    const res = await api.post('/reading/generate', params);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveReading = async (data) => {
  try {
    const res = await api.post('/reading', data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getReadings = async (params) => {
  try {
    const res = await api.get('/reading', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getReading = async (id) => {
  try {
    const res = await api.get(`/reading/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markComplete = async (id) => {
  try {
    const res = await api.patch(`/reading/${id}/complete`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const saveWord = async (id, word) => {
  try {
    const res = await api.post(`/reading/${id}/words`, { word });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
