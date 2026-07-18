import api from './client';

export const generateStory = async (params) => {
  try {
    const res = await api.post('/stories/generate', params);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStories = async (params) => {
  try {
    const res = await api.get('/stories', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStory = async (id) => {
  try {
    const res = await api.get(`/stories/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markAsRead = async (id) => {
  try {
    const res = await api.patch(`/stories/${id}/read`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleFavorite = async (id) => {
  try {
    const res = await api.patch(`/stories/${id}/favorite`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteStory = async (id) => {
  try {
    const res = await api.delete(`/stories/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
