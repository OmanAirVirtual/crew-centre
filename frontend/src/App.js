import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StaffPage from './pages/StaffPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PIREPSubmit from './pages/PIREPSubmit';
import PIREPList from './pages/PIREPList';
import RoutesPage from './pages/RoutesPage';
import LiveTracking from './pages/LiveTracking';
import InfiniteFlightAPI from './pages/InfiniteFlightAPI';
import ExamList from './pages/ExamList';
import ExamTake from './pages/ExamTake';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSettings from './pages/ProfileSettings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/pirep/submit"
              element={
                <PrivateRoute>
                  <PIREPSubmit />
                </PrivateRoute>
              }
            />
            <Route
              path="/pirep/list"
              element={
                <PrivateRoute>
                  <PIREPList />
                </PrivateRoute>
              }
            />
            <Route
              path="/routes"
              element={
                <PrivateRoute>
                  <RoutesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <PrivateRoute>
                  <LiveTracking />
                </PrivateRoute>
              }
            />
            <Route
              path="/if-api"
              element={
                <PrivateRoute>
                  <InfiniteFlightAPI />
                </PrivateRoute>
              }
            />
            <Route
              path="/exams"
              element={
                <PrivateRoute>
                  <ExamList />
                </PrivateRoute>
              }
            />
            <Route
              path="/exams/:id"
              element={
                <PrivateRoute>
                  <ExamTake />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute adminOnly>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfileSettings />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
