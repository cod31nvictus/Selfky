import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import Payment from './pages/Payment';
import PaymentFailure from './pages/PaymentFailure';
import PaymentCancel from './pages/PaymentCancel';
import AdmitCard from './pages/AdmitCard';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import AdminApplicantDashboard from './pages/AdminApplicantDashboard';
import AdminApplicationForm from './pages/AdminApplicationForm';

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
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

            {/* Admin Routes */}
            <Route path="/cpanel/login" element={<AdminLogin />} />
            <Route path="/cpanel" element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            } />
            
            {/* Admin Applicant Dashboard */}
            <Route path="/admin/applicant/:userId" element={
              <ProtectedAdminRoute>
                <AdminApplicantDashboard />
              </ProtectedAdminRoute>
            } />
            
            {/* Admin Application Form */}
            <Route path="/admin/application-form/:userId/:courseType" element={
              <ProtectedAdminRoute>
                <AdminApplicationForm />
              </ProtectedAdminRoute>
            } />
            <Route path="/admin/application-form/:userId/:applicationId" element={
              <ProtectedAdminRoute>
                <AdminApplicationForm />
              </ProtectedAdminRoute>
            } />
            
            {/* Admin Admit Card View */}
            <Route path="/admin/admit-card/:applicationId" element={
              <ProtectedAdminRoute>
                <AdmitCard />
              </ProtectedAdminRoute>
            } />
          </Routes>
        </Router>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
