import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import StudentPortal from './pages/StudentPortal';
import TeacherPortal from './pages/TeacherPortal';
import ParentPortal from './pages/ParentPortal';
import AdminDashboard from './pages/AdminDashboard';

/**
 * Root component that sets up routing and context providers.
 */
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div style={{ padding: '1rem' }}>
          <Routes>
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/teacher" element={<TeacherPortal />} />
            <Route path="/parent" element={<ParentPortal />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;