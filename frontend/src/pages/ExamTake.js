// This code is a complete rewrite of ExamTake.js to support the "Next Question" flow
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiClock, FiSend, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import Loading from '../components/Loading';

const ExamTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchExam = useCallback(async () => {
    try {
      const response = await axios.get(`/api/exams/${id}`);
      setExam(response.data);
      setAnswers(new Array(response.data.questions.length).fill(null));
      setTimeLeft(response.data.timeLimit);
      setStartedAt(new Date());
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const response = await axios.post(`/api/exams/${id}/attempt`, {
        answers,
        startedAt
      });

      if (response.data.passed) {
        alert(`Congratulations! You passed with a score of ${response.data.score.toFixed(1)}%`);
      } else {
        alert(`You scored ${response.data.score.toFixed(1)}%. You need ${response.data.passingScore}% to pass.`);
      }

      navigate('/exams');
    } catch (error) {
      alert('Error submitting exam: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  }, [answers, id, navigate, startedAt, submitting]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  useEffect(() => {
    if (!exam || !startedAt) return;
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((new Date() - startedAt) / 1000 / 60);
      const remaining = exam.timeLimit - elapsed;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, handleSubmit, startedAt, timeLeft]);

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Loading exam..." />;
  }

  if (!exam) {
    return <div className="container"><div className="card">Exam not found</div></div>;
  }

  const question = exam.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
  const hasAnsweredCurrent = answers[currentQuestionIndex] !== null;

  return (
    <div className="container">
      <div
        className="card"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#333', fontSize: '1.5rem', margin: 0 }}>{exam.title}</h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: timeLeft < 5 ? '#dc3545' : '#667eea',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}>
            <FiClock />
            {Math.floor(timeLeft)}:{(timeLeft % 1 * 60).toFixed(0).padStart(2, '0')}
          </div>
        </div>

        <div className="progress-bar-container" style={{ marginBottom: '2rem', height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%`,
              height: '100%',
              background: '#667eea',
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: '#666' }}>
          <span>Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); }}>
          <div style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: '#f8f9fa',
            borderRadius: '12px',
            userSelect: 'none'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>
              {question.question}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {question.options.map((option, oIdx) => (
                <label
                  key={oIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    background: answers[currentQuestionIndex] === oIdx ? '#667eea' : 'white',
                    color: answers[currentQuestionIndex] === oIdx ? 'white' : '#333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: answers[currentQuestionIndex] === oIdx ? '#667eea' : '#e0e0e0',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestionIndex}`}
                    value={oIdx}
                    checked={answers[currentQuestionIndex] === oIdx}
                    onChange={() => handleAnswerChange(currentQuestionIndex, oIdx)}
                    style={{ marginRight: '1rem', width: '20px', height: '20px' }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <FiArrowLeft /> Previous
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting || answers.some(a => a === null)}
              >
                <FiSend /> {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                // Option: require answer before next? "if completed that question one can move"
                disabled={!hasAnsweredCurrent}
              >
                Next <FiArrowRight />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamTake;
