import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import Payment from './pages/Payment';
import PaymentFailure from './pages/PaymentFailure';
import PaymentCancel from './pages/PaymentCancel';
import AdmitCard from './pages/AdmitCard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Landing />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/apply/:courseType" element={
            <ProtectedRoute>
              <ApplicationForm />
            </ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/payment/:applicationId" element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          } />
          <Route path="/payment/failure" element={
            <ProtectedRoute>
              <PaymentFailure />
            </ProtectedRoute>
          } />
          <Route path="/payment/cancel" element={
            <ProtectedRoute>
              <PaymentCancel />
            </ProtectedRoute>
          } />
          <Route path="/admit-card" element={
            <ProtectedRoute>
              <AdmitCard />
            </ProtectedRoute>
          } />
          <Route path="/admit-card/:applicationId" element={
            <ProtectedRoute>
              <AdmitCard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
