import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply/:courseType" element={<ApplicationForm />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/admit-card" element={<AdmitCard />} />
        <Route path="/" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;
