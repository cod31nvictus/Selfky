import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div style={{ textAlign: 'center', marginTop: 50 }}>
        <h1>Welcome to Selfky</h1>
        <nav>
          <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
        </nav>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Backend health: <HealthCheck /></div>} />
        </Routes>
      </div>
    </Router>
  );
}

function HealthCheck() {
  const [health, setHealth] = React.useState('');
  React.useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(() => setHealth('error'));
  }, []);
  return <b>{health}</b>;
}

export default App;
