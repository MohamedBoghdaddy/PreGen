import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Tools
import ProfileCardPage from "./components/Dashboard/pages/ProfileCardPage";

// Frontend Components
import Home from "./components/Home/home";
import NavBar from "./components/Home/Navbar";
import Footer from "./components/Home/Footer";

import Login from "./components/LOGIN&REGISTRATION/Login/Login";
import Signup from "./components/LOGIN&REGISTRATION/Signup/Signup";
import Dashboard from "./components/Dashboard/pages/MainDashboard";

import Sidebar from "./components/Dashboard/components/Sidebar.jsx";
import Settings from "./components/Dashboard/pages/Settings.jsx";
import Profile from "./components/Dashboard/pages/Profile.jsx";
import AnalyticsReport from "./components/Dashboard/analytics";
import AdminDashboard from "./components/Dashboard/admin/AdminDashboard.js";
import UserDetails from "./components/Dashboard/admin/UserDetails";

import AIChat from "./components/chatbot/AIChat";
import Contact from "./components/Contact/contact";

import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AdminRoute from "./components/Auth/AdminRoute";

// 🧠 AI Learning Pages
import AITutor from "./components/Dashboard/pages/AITutor";
import QuizGenerator from "./components/Dashboard/pages/QuizGenerator";
import Assignments from "./components/Dashboard/pages/Assignments";
import PracticeLab from "./components/Dashboard/pages/PracticeLab";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 🌐 Public Routes */}
          <Route
            path="/"
            element={
              <>
                <NavBar />
                <Home />
                <Footer />
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🔒 Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <>
                  <Dashboard />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <Settings />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <Profile />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <AnalyticsReport />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/contact"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <Contact />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/aichat"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <AIChat />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* 🧠 AI Learning System Routes */}
          <Route
            path="/ai-tutor"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <AITutor />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <QuizGenerator />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <Assignments />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          <Route
            path="/practice-lab"
            element={
              <ProtectedRoute>
                <>
                  <Sidebar />
                  <PracticeLab />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* 🧩 Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <AdminRoute>
                <UserDetails />
              </AdminRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
