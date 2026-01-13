import React, { useState } from 'react';
import LandingPage from './LandingPage';
import Login from './Login';
import Register from './Register';
import StaffDashboard from './StaffDashboard';
import DoctorDashboard from './DoctorDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState({ name: '', role: '' });
  // New state to track which login type to show
  const [loginRole, setLoginRole] = useState(null); 

  const handleSelectRole = (role) => {
    setLoginRole(role); // Set to 'Staff' or 'Doctor'
    setCurrentPage('login');
  };

  const handleLoginSuccess = (name, role) => {
    setUser({ name, role });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser({ name: '', role: '' });
    setLoginRole(null);
    setCurrentPage('landing');
  };

  return (
    <div className="min-h-screen">
      {currentPage === 'landing' && (
        <LandingPage 
          onSelectRole={handleSelectRole} 
          onGoToSignup={() => setCurrentPage('register')}
        />
      )}

      {currentPage === 'login' && (
        <Login 
          selectedRole={loginRole} // Pass the role here
          onGoToSignup={() => setCurrentPage('register')} 
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setCurrentPage('landing')}
        />
      )}

      {currentPage === 'register' && (
        <Register onBackToLogin={() => setCurrentPage('login')} />
      )}

      {currentPage === 'dashboard' && (
        user.role === 'Staff' ? 
        <StaffDashboard user={user.name} onLogout={handleLogout} /> : 
        <DoctorDashboard user={user.name} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;