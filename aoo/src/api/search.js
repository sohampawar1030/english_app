import api from './client';

export const globalSearch = async (query, params) => {
  try {
    const res = await api.get('/search', { params: { q: query, ...params } });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const searchSuggestions = async (query) => {
  try {
    const res = await api.get('/search/suggestions', { params: { q: query } });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
