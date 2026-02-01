import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FiBook, FiClock, FiCheckCircle } from 'react-icons/fi';
import Loading from '../components/Loading';

const ExamList = () => {
  const { user } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, attemptsRes] = await Promise.all([
        axios.get('/api/exams'),
        axios.get('/api/exams/attempts/my')
      ]);
      setExams(examsRes.data);
      setAttempts(attemptsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttemptForExam = (examId) => {
    return attempts.find(a => a.examId._id === examId);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: '2rem', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiBook /> Pilot Certification Exams
        </h1>

        {user.examCompleted && (
          <div className="alert alert-success" style={{ marginBottom: '2rem' }}>
            <FiCheckCircle /> You have completed the pilot exam! You can now submit PIREPs.
          </div>
        )}

        {exams.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No exams available at this time
          </p>
        ) : (
          <div className="grid">
            {exams.map((exam) => {
              const attempt = getAttemptForExam(exam._id);
              return (
                <div key={exam._id} className="card" style={{ marginBottom: 0 }}>
                  <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>{exam.title}</h3>
                  <p style={{ color: '#666', marginBottom: '1rem' }}>{exam.description}</p>

                  <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', color: '#666' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiClock />
                      {exam.timeLimit} minutes
                    </div>
                    <div>
                      Passing Score: {exam.passingScore}%
                    </div>
                    <div>
                      Questions: {exam.questions?.length || 0}
                    </div>
                  </div>

                  {attempt ? (
                    <div style={{
                      padding: '1rem',
                      background: attempt.passed ? '#d4edda' : '#f8d7da',
                      borderRadius: '8px',
                      marginTop: '1rem'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        {attempt.passed ? '✓ Passed' : '✗ Failed'}
                      </div>
                      <div>Score: {attempt.score.toFixed(1)}%</div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Completed: {new Date(attempt.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={`/exams/${exam._id}`}
                      className="btn btn-primary"
                      style={{ marginTop: '1rem' }}
                    >
                      {user.examCompleted ? 'Retake Exam' : 'Take Exam'}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;
