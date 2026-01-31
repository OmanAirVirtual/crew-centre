const express = require('express');
const { Exam, ExamAttempt } = require('../models/Exam');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all exams
router.get('/', auth, async (req, res) => {
  try {
    const exams = await Exam.find({ active: true }).select('-questions');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get exam details (without answers for students)
router.get('/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Remove correct answers for non-admin users
    if (!['CEO', 'CAO', 'CMO', 'CFI'].includes(req.user.role)) {
      const examData = exam.toObject();
      examData.questions = examData.questions.map(q => ({
        question: q.question,
        options: q.options
      }));
      return res.json(examData);
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit exam attempt
router.post('/:id/attempt', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const { answers } = req.body;
    let score = 0;
    let totalPoints = 0;

    const gradedAnswers = exam.questions.map((question, index) => {
      totalPoints += question.points;
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.points;
      }

      return {
        questionIndex: index,
        selectedAnswer: userAnswer,
        isCorrect
      };
    });

    const percentage = (score / totalPoints) * 100;
    const passed = percentage >= exam.passingScore;

    const attempt = new ExamAttempt({
      examId: exam._id,
      userId: req.user._id,
      status: 'pending',
      answers: gradedAnswers,
      score: percentage,
      passed,
      startedAt: new Date(req.body.startedAt),
      completedAt: new Date()
    });

    await attempt.save();

    // Exam completion is now approved by staff (CFI/CEO/CAO/Recruiter)

    res.json({
      attempt,
      passed,
      score: percentage,
      passingScore: exam.passingScore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's exam attempts
router.get('/attempts/my', auth, async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ userId: req.user._id })
      .populate('examId', 'title')
      .sort({ completedAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create exam (Admin only)
router.post('/', auth, adminAuth('CEO', 'CAO', 'CFI'), async (req, res) => {
  try {
    const exam = new Exam({
      ...req.body,
      createdBy: req.user._id
    });
    await exam.save();
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all exam attempts (Admin only)
router.get('/attempts/all', auth, adminAuth('CEO', 'CAO', 'CFI', 'Recruiter'), async (req, res) => {
  try {
    const attempts = await ExamAttempt.find()
      .populate('examId', 'title')
      .populate('userId', 'username firstName lastName email')
      .populate('reviewedBy', 'username firstName lastName email')
      .sort({ completedAt: -1 });
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Review exam attempt (Admin only)
router.patch('/attempts/:attemptId/review', auth, adminAuth('CEO', 'CAO', 'CFI', 'Recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    const attempt = await ExamAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    attempt.status = status;
    attempt.reviewedBy = req.user._id;
    attempt.reviewedAt = new Date();
    await attempt.save();

    // Only approve completion if the attempt passed and staff approved it
    if (status === 'approved') {
      await User.findByIdAndUpdate(attempt.userId, {
        examCompleted: !!attempt.passed,
        examScore: attempt.score
      });
    }

    const populated = await ExamAttempt.findById(attempt._id)
      .populate('examId', 'title')
      .populate('userId', 'username firstName lastName email')
      .populate('reviewedBy', 'username firstName lastName email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
