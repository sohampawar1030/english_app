import { v4 as uuidv4 } from 'uuid';

export const generateId = () => uuidv4();

export const calculateLevel = (xp) => {
  return Math.floor(1 + Math.sqrt(xp / 100));
};

export const calculateXpForNextLevel = (level) => {
  return Math.pow(level, 2) * 100;
};

export const calculateStreak = (lastActiveDate, currentStreak) => {
  if (!lastActiveDate) return 1;
  const last = new Date(lastActiveDate);
  const today = new Date();
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return currentStreak + 1;
  if (diffDays === 0) return currentStreak;
  return 1;
};

export const getSpacedRepetitionIntervals = () => {
  return [1, 2, 5, 10, 20, 45, 90, 180, 365];
};

export const calculateNextRevision = (correct, currentInterval, revisionCount) => {
  const intervals = getSpacedRepetitionIntervals();
  if (!correct) {
    const restartIndex = Math.min(revisionCount, 2);
    const nextInterval = intervals[restartIndex];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);
    return { nextRevision: nextDate, nextInterval, restart: true };
  }
  const nextIndex = Math.min(revisionCount, intervals.length - 1);
  const nextInterval = intervals[nextIndex];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextInterval);
  return { nextRevision: nextDate, nextInterval, restart: false };
};

export const calculateMemoryScore = (accuracy, confidence, revisionCount, responseTime) => {
  const accuracyWeight = 0.4;
  const confidenceWeight = 0.3;
  const revisionWeight = 0.2;
  const responseTimeWeight = 0.1;
  const normalizedResponseTime = Math.min(responseTime / 10000, 1);
  const score = (
    accuracy * accuracyWeight +
    confidence * confidenceWeight +
    Math.min(revisionCount / 10, 1) * revisionWeight +
    (1 - normalizedResponseTime) * responseTimeWeight
  );
  return Math.min(Math.max(score, 0), 1);
};

export const getStatusFromMemoryScore = (score) => {
  if (score >= 0.9) return 'long_term';
  if (score >= 0.7) return 'mastered';
  if (score >= 0.4) return 'revision';
  if (score >= 0.2) return 'learning';
  return 'new';
};

export const paginate = (page = 1, limit = 20) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (p - 1) * l;
  return { offset, limit: l, page: p };
};
