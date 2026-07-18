import api from './client';

export const getProfile = async () => {
  try {
    const res = await api.get('/games/profile');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAchievements = async () => {
  try {
    const res = await api.get('/games/achievements');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMissions = async () => {
  try {
    const res = await api.get('/games/missions');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const claimMission = async (missionId) => {
  try {
    const res = await api.post(`/games/missions/${missionId}/claim`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const spinWheel = async () => {
  try {
    const res = await api.post('/games/wheel/spin');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const openTreasure = async () => {
  try {
    const res = await api.post('/games/treasure/open');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const submitGameScore = async (game, score) => {
  try {
    const res = await api.post('/games/score', { game, score });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMissionProgress = async (missionId, progress) => {
  try {
    const res = await api.patch(`/games/missions/${missionId}/progress`, { progress });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
