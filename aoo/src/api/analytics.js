import api from './client';

export const getDashboard = async () => {
  try {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getVocabularyGrowth = async (params) => {
  try {
    const res = await api.get('/analytics/vocabulary-growth', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSkillScores = async () => {
  try {
    const res = await api.get('/analytics/skill-scores');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWeakWords = async () => {
  try {
    const res = await api.get('/analytics/weak-words');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWeeklyReport = async () => {
  try {
    const res = await api.get('/analytics/weekly');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMonthlyReport = async () => {
  try {
    const res = await api.get('/analytics/monthly');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllTimeStats = async () => {
  try {
    const res = await api.get('/analytics/all-time');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
