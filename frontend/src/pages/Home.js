import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiMapPin, FiUsers, FiFileText, FiGlobe, FiBriefcase, FiLogIn, FiUserPlus, FiRadio } from 'react-icons/fi';
import Loading from '../components/Loading';
import './Home.css';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    routes: 0,
    codeshare: 0,
    pireps: 0,
    pilots: 0,
    staff: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/home/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Home stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">Virtual Airline</div>
          <h1 className="hero-title">Oman Air Virtual</h1>
          <p className="hero-tagline">
            Fly with pride. Connect the world. Your journey starts here.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="btn-hero btn-hero-primary">
                <FiRadio /> Crew Centre
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-hero btn-hero-primary">
                  <FiLogIn /> Sign In
                </Link>
                <Link to="/register" className="btn-hero btn-hero-outline">
                  <FiUserPlus /> Sign Up
                </Link>
              </>
            )}
          </div>
          {!user && (
            <div style={{ marginTop: '1.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem', lineHeight: '1.8' }}>
              <div>
                Want to join Oman Air Virtual as a Pilot? <a href="https://forms.gle/GTtqPNWq29fXTmR47" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'underline' }}>Join Us</a>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                Want to join as Staff? <a href="https://docs.google.com/forms/d/e/1FAIpQLSdnb25i3uLMNjzsTy9bLe8qZvRHVtw7WNsiWNg5c0PP37j0eQ/viewform" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontWeight: 'bold', textDecoration: 'underline' }}>Join Us</a>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-stats">
        <div className="container">
          <h2 className="stats-heading">Our Numbers</h2>
          {loading ? (
            <Loading text="Loading stats..." />
          ) : (
            <div className="stats-grid-home">
              <div className="stat-tile">
                <div className="stat-tile-icon"><FiMapPin /></div>
                <div className="stat-tile-value">{stats.routes}</div>
                <div className="stat-tile-label">Routes</div>
              </div>
              <div className="stat-tile">
                <div className="stat-tile-icon"><FiGlobe /></div>
                <div className="stat-tile-value">{stats.codeshare}</div>
                <div className="stat-tile-label">Codeshare</div>
              </div>
              <div className="stat-tile">
                <div className="stat-tile-icon"><FiFileText /></div>
                <div className="stat-tile-value">{stats.pireps}</div>
                <div className="stat-tile-label">PIREPs</div>
              </div>
              <div className="stat-tile">
                <div className="stat-tile-icon"><FiUsers /></div>
                <div className="stat-tile-value">{stats.pilots}</div>
                <div className="stat-tile-label">Pilots</div>
              </div>
              <div className="stat-tile">
                <div className="stat-tile-icon"><FiBriefcase /></div>
                <div className="stat-tile-value">{stats.staff}</div>
                <div className="stat-tile-label">Staff</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-cta">
        <div className="container">
          <div className="cta-grid">
            <Link to="/staff" className="cta-card">
              <FiBriefcase className="cta-icon" />
              <h3>Our Staff</h3>
              <p>Meet the team behind Oman Air Virtual</p>
            </Link>
            {user ? (
              <Link to="/dashboard" className="cta-card cta-card-primary">
                <FiRadio className="cta-icon" />
                <h3>Crew Centre</h3>
                <p>Dashboard, PIREPs, routes &amp; tracking</p>
              </Link>
            ) : (
              <Link to="/register" className="cta-card cta-card-primary">
                <FiUserPlus className="cta-icon" />
                <h3>Join as Pilot</h3>
                <p>Register and start flying with us</p>
              </Link>
            )}
            <Link to="/routes" className="cta-card">
              <FiMapPin className="cta-icon" />
              <h3>Routes</h3>
              <p>Explore our network (login required)</p>
            </Link>
            <Link to="/career/login" className="cta-card cta-card-career">
              <FiBriefcase className="cta-icon" />
              <h3>Career Mode</h3>
              <p>Professional pilot progression system</p>
            </Link>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="container">
          <p>© Oman Air Virtual. For simulation use only.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
