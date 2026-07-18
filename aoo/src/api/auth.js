import api from './client';

export const login = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const register = async (email, password, name) => {
  try {
    const res = await api.post('/auth/register', { email, password, name });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getProfile = async () => {
  try {
    const res = await api.get('/auth/profile');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateProfile = async (data) => {
  try {
    const res = await api.patch('/auth/profile', data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
