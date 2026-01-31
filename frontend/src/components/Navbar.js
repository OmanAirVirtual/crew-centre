import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getPilotRank } from '../utils/pilotRanks';
import { FiHome, FiFileText, FiMap, FiRadio, FiBook, FiSettings, FiLogOut, FiUser, FiSearch, FiBriefcase } from 'react-icons/fi';
import './Navbar.css';

const PILOT_ROLES = ['pilot', 'Event Leader'];

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const isPilot = user && PILOT_ROLES.includes(user.role);
  const rank = isPilot && typeof user.totalHours === 'number' ? getPilotRank(user.totalHours) : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-logo">
            <img
              src="/logo.png"
              alt=""
              className="navbar-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const wrap = e.target.closest('.navbar-brand-logo');
                const fallback = wrap?.querySelector('.navbar-logo-fallback');
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <FiRadio className="brand-icon navbar-logo-fallback" style={{ display: 'none' }} aria-hidden />
          </span>

        </Link>

        <div className="navbar-menu">
          <Link to="/" className="nav-link">
            <FiHome /> Home
          </Link>
          <Link to="/staff" className="nav-link">
            <FiBriefcase /> Staff
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">
                <FiRadio /> Crew Centre
              </Link>
              <Link to="/pirep/submit" className="nav-link">
                <FiFileText /> Submit PIREP
              </Link>
              <Link to="/pirep/list" className="nav-link">
                <FiFileText /> My PIREPs
              </Link>
              <Link to="/routes" className="nav-link">
                <FiMap /> Routes
              </Link>
              <Link to="/tracking" className="nav-link">
                <FiRadio /> Live Tracking
              </Link>
              <Link to="/if-api" className="nav-link">
                <FiSearch /> IF API
              </Link>
              {!user.examCompleted && (
                <Link to="/exams" className="nav-link">
                  <FiBook /> Exams
                </Link>
              )}
              {isAdmin() && (
                <Link to="/admin" className="nav-link admin-link">
                  <FiSettings /> Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
              <Link to="/register" className="nav-link nav-link-register">
                Join Us
              </Link>
            </>
          )}
        </div>

        {user && (
          <div className="navbar-user">
            <Link to="/profile" className="user-info" style={{ textDecoration: 'none', color: 'inherit' }}>
              <FiUser /> {user.firstName}
              {rank ? (
                <span className="user-rank" title={rank.unlocks}>
                  {rank.name} ({typeof user.totalHours === 'number' ? user.totalHours.toFixed(1) : '0'}h)
                </span>
              ) : (
                <span className="user-role">({user.role})</span>
              )}
            </Link>
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
