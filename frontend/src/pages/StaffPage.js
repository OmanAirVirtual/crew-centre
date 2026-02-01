import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiBriefcase, FiUser, FiArrowLeft } from 'react-icons/fi';
import Loading from '../components/Loading';
import './StaffPage.css';

const ROLE_LABELS = {
  CEO: 'Chief Executive Officer',
  CAO: 'Chief Administrative Officer',
  CMO: 'Chief Marketing Officer',
  CFI: 'Chief Flight Instructor',
  Recruiter: 'Recruiter',
  'Routes Manager': 'Routes Manager',
  'Crew Centre Manager': 'Crew Centre Manager',
  'Chief Pilot': 'Chief Pilot',
};

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axios.get('/api/home/staff');
        setStaff(res.data);
      } catch (err) {
        console.error('Staff list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const byRole = staff.reduce((acc, s) => {
    const r = s.role || 'Other';
    if (!acc[r]) acc[r] = [];
    acc[r].push(s);
    return acc;
  }, {});

  const roleOrder = ['CEO', 'CAO', 'CMO', 'CFI', 'Recruiter', 'Routes Manager', 'Crew Centre Manager', 'Chief Pilot'];

  return (
    <div className="staff-page">
      <section className="staff-hero">
        <div className="staff-hero-bg" />
        <div className="container staff-hero-content">
          <Link to="/" className="staff-back">
            <FiArrowLeft /> Back to Home
          </Link>
          <h1 className="staff-title">Our Staff</h1>
          <p className="staff-tagline">
            The team behind Oman Air Virtual
          </p>
        </div>
      </section>

      <section className="staff-list">
        <div className="container">
          {loading ? (
            <Loading />
          ) : staff.length === 0 ? (
            <div className="staff-empty">
              <FiBriefcase className="staff-empty-icon" />
              <p>No staff listed yet.</p>
            </div>
          ) : (
            <div className="staff-sections">
              {roleOrder.filter((r) => byRole[r]?.length).map((role) => (
                <div key={role} className="staff-section">
                  <h2 className="staff-section-title">
                    {ROLE_LABELS[role] || role}
                  </h2>
                  <div className="staff-grid">
                    {byRole[role].map((s) => (
                      <div key={s._id} className="staff-card">
                        <div className="staff-card-avatar">
                          <FiUser />
                        </div>
                        <h3 className="staff-card-name">
                          {s.firstName} {s.lastName}
                        </h3>
                        <span className="staff-card-role">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="staff-footer">
        <div className="container">
          <Link to="/" className="staff-footer-link">Oman Air Virtual</Link>
        </div>
      </footer>
    </div>
  );
};

export default StaffPage;
