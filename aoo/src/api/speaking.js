import api from './client';

export const analyzeSpeech = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    const res = await api.post('/speaking/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSessions = async (params) => {
  try {
    const res = await api.get('/speaking/sessions', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
