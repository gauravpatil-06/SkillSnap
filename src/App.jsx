import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { MaterialProvider } from './context/MaterialContext';
import { ActivityProvider } from './context/ActivityContext';
import { AppLayout } from './components/layout/AppLayout';
import { PageLoader } from './components/ui/PageLoader';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { Auth } from './pages/Auth.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { CalendarView } from './pages/CalendarView.jsx';
import { EisenhowerMatrix } from './pages/EisenhowerMatrix.jsx';
import { TodayTasks } from './pages/TodayTasks.jsx';
import { History } from './pages/History.jsx';
import { Settings } from './pages/Settings.jsx';
import { Profile } from './pages/Profile.jsx';
import { StudyMaterials } from './pages/StudyMaterials.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { ActivityLog } from './pages/ActivityLog.jsx';
import { About } from './pages/About.jsx';
import { Feedback } from './pages/Feedback.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { FocusMode } from './pages/FocusMode.jsx';

function AppRoutes() {
  const { isSessionValid, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={isSessionValid ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/register" element={isSessionValid ? <Navigate to="/dashboard" /> : <Auth />} />
      <Route path="/" element={isSessionValid ? <Navigate to="/dashboard" /> : <LandingPage />} />

      {/* Protected Routes wrapped in AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/all-tasks" element={<CalendarView />} />
        <Route path="/matrix" element={<EisenhowerMatrix />} />
        <Route path="/today" element={<TodayTasks />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
        <Route path="/study-materials" element={<StudyMaterials />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/activity-log" element={<ActivityLog />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/focus-mode" element={<FocusMode />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <AuthProvider>
        <TaskProvider>
          <MaterialProvider>
            <ActivityProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </ActivityProvider>
          </MaterialProvider>
        </TaskProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
