import api from './client';

export const generateSentences = async (word) => {
  try {
    const res = await api.post('/words/generate-sentences', { word });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWords = async (params) => {
  try {
    const res = await api.get('/words', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWord = async (id) => {
  try {
    const res = await api.get(`/words/${id}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNewWords = async () => {
  try {
    const res = await api.get('/words/new');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getLearningWords = async () => {
  try {
    const res = await api.get('/words/learning');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRevisionWords = async () => {
  try {
    const res = await api.get('/words/revision');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addToLearning = async (wordId) => {
  try {
    const res = await api.post(`/words/${wordId}/learn`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const reviewWord = async (wordId, data) => {
  try {
    const res = await api.post(`/words/${wordId}/review`, data);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getWordStats = async () => {
  try {
    const res = await api.get('/words/stats');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getVocabularySummary = async () => {
  try {
    const res = await api.get('/words/vocabulary-summary');
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAutoSuggest = async (query) => {
  try {
    const res = await api.get('/words/suggest', { params: { q: query } });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const lookupWord = async (word) => {
  try {
    const res = await api.get('/words/lookup', { params: { word } });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const lookupWordLocal = async (word) => {
  try {
    const res = await api.get('/words/lookup', { params: { word, noai: 'true' } });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMyVocabulary = async (params) => {
  try {
    const res = await api.get('/words/my-vocabulary', { params });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeFromVocabulary = async (wordId) => {
  try {
    const res = await api.delete(`/words/my-vocabulary/${wordId}`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const analyzeWord = async (word) => {
  try {
    const res = await api.post('/words/analyze', { word });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const bulkAddWords = async (words) => {
  try {
    const res = await api.post('/words/bulk', { words });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
