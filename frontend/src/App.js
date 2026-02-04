import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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

// Career Mode Pages
import CareerLogin from './pages/career/CareerLogin';
import CareerDashboard from './pages/career/CareerDashboard';
import TypeRatings from './pages/career/TypeRatings';
import FlightLegs from './pages/career/FlightLegs';
import PIREPBuilder from './pages/career/PIREPBuilder';
import FlightHistory from './pages/career/FlightHistory';
import CareerAdmin from './pages/career/CareerAdmin';
import Leaderboard from './pages/career/Leaderboard';

import './App.css';

// Helper component to conditionally render Navbar
const NavbarWrapper = () => {
  const location = useLocation();
  // Hide navbar if path starts with /career
  if (location.pathname.startsWith('/career')) {
    return null;
  }
  return <Navbar />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <NavbarWrapper />
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

            {/* Career Mode Routes */}
            <Route path="/career/login" element={<CareerLogin />} />
            <Route path="/career/dashboard" element={<CareerDashboard />} />
            <Route path="/career/type-ratings" element={<TypeRatings />} />
            <Route path="/career/flights" element={<FlightLegs />} />
            <Route path="/career/pirep/new" element={<PIREPBuilder />} />
            <Route path="/career/history" element={<FlightHistory />} />
            <Route path="/career/admin" element={<CareerAdmin />} />
            <Route path="/career/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
