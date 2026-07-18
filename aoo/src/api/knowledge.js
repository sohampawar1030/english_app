import api from './client';

export const createNote = async (data) => {
  try {
    const res = await api.post('/knowledge/notes', data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNotes = async (params) => {
  try {
    const res = await api.get('/knowledge/notes', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNote = async (id) => {
  try {
    const res = await api.get(`/knowledge/notes/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateNote = async (id, data) => {
  try {
    const res = await api.patch(`/knowledge/notes/${id}`, data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteNote = async (id) => {
  try {
    const res = await api.delete(`/knowledge/notes/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCategories = async () => {
  try {
    const res = await api.get('/knowledge/categories');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
