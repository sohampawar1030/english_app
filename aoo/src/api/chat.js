import api from './client';

export const sendMessage = async (message) => {
  try {
    const res = await api.post('/chat/message', { message });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getChatHistory = async (params) => {
  try {
    const res = await api.get('/chat/history', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const clearChatHistory = async () => {
  try {
    const res = await api.delete('/chat/history');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
