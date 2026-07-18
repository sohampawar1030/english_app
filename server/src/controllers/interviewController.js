import pool from '../config/database.js';
import aiService from '../services/aiService.js';
import memoryEngine from '../services/memoryEngine.js';
import { generateId } from '../utils/helpers.js';

export const startInterview = async (req, res, next) => {
  try {
    const { interviewType, role, level } = req.body;
    if (!interviewType) return res.status(400).json({ error: 'Interview type is required' });

    const result = await aiService.generateInterviewQuestions(interviewType, role, level || 'intermediate');

    const id = generateId();
    await pool.execute(
      `INSERT INTO interview_sessions (id, user_id, interview_type, role, questions)
       VALUES (?, ?, ?, ?, ?)`,
      [id, req.userId, interviewType, role || null, JSON.stringify(result.questions)]
    );

    res.json({
      id,
      role: result.role,
      questions: result.questions,
      totalQuestions: result.questions.length
    });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { sessionId, questionIndex, answer } = req.body;
    if (!sessionId || questionIndex === undefined || !answer) {
      return res.status(400).json({ error: 'Session ID, question index, and answer are required' });
    }

    const [sessions] = await pool.execute(
      'SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.userId]
    );
    if (sessions.length === 0) return res.status(404).json({ error: 'Session not found' });

    const session = sessions[0];
    const questions = typeof session.questions === 'string' ? JSON.parse(session.questions) : session.questions;
    const question = questions[questionIndex];

    const feedback = await aiService.analyzeInterviewAnswer(question.question, answer, session.interview_type);

    let answers = session.answers ? (typeof session.answers === 'string' ? JSON.parse(session.answers) : session.answers) : [];
    let allFeedback = session.feedback ? (typeof session.feedback === 'string' ? JSON.parse(session.feedback) : session.feedback) : [];

    answers[questionIndex] = { question: question.question, answer };
    allFeedback[questionIndex] = feedback;

    let overallScore = 0;
    allFeedback.forEach(f => { overallScore += f.score || 0; });
    overallScore = allFeedback.length > 0 ? overallScore / allFeedback.length : 0;

    const isCompleted = answers.length >= questions.length;
    await pool.execute(
      `UPDATE interview_sessions 
       SET answers = ?, feedback = ?, overall_score = ?,
           is_completed = ?, completed_at = ?
       WHERE id = ? AND user_id = ?`,
      [JSON.stringify(answers), JSON.stringify(allFeedback), overallScore,
       isCompleted, isCompleted ? new Date() : null, sessionId, req.userId]
    );

    await memoryEngine.logActivity(req.userId, 'interview_answer', `Answered interview question`, 15, 5);

    res.json({ feedback, overallScore, isCompleted, questionIndex });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.userId]
    );
    res.json({ sessions: rows });
  } catch (error) {
    next(error);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};
