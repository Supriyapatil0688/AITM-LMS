import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { ApplyNowModal } from './components/common/ApplyNowModal';
import { RoleSwitcherToolbar } from './components/common/RoleSwitcherToolbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public pages
import { PublicHome } from './pages/PublicHome';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';

// Admin pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { StudentManagement } from './pages/admin/StudentManagement';
import { CourseManagement } from './pages/admin/CourseManagement';
import { ResourceManagement } from './pages/admin/ResourceManagement';
import { ApplicationManagement } from './pages/admin/ApplicationManagement';
import { MeetingManagement } from './pages/admin/MeetingManagement';
import { AnnouncementManagement } from './pages/admin/AnnouncementManagement';
import { SettingsPage } from './pages/admin/SettingsPage';

// Student pages
import { StudentLayout } from './components/student/StudentLayout';
import { StudentOverview } from './pages/student/StudentOverview';
import { StudentCourses } from './pages/student/StudentCourses';
import { StudentCourseDetail } from './pages/student/StudentCourseDetail';
import { StudentResources } from './pages/student/StudentResources';
import { StudentSchedule } from './pages/student/StudentSchedule';
import { StudentNotifications } from './pages/student/StudentNotifications';
import { StudentProfile } from './pages/student/StudentProfile';

export default function App() {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [preselectedCourseId, setPreselectedCourseId] = useState<string | undefined>(undefined);

  const handleOpenApply = (courseId?: string) => {
    setPreselectedCourseId(courseId);
    setApplyModalOpen(true);
  };

  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website Routes */}
            <Route
              path="/"
              element={
                <div className="flex flex-col min-h-screen">
                  <Navbar onOpenApplyModal={() => handleOpenApply()} />
                  <main className="flex-1">
                    <PublicHome onOpenApplyModal={(courseId) => handleOpenApply(courseId)} />
                  </main>
                  <Footer />
                  <ApplyNowModal
                    isOpen={applyModalOpen}
                    onClose={() => setApplyModalOpen(false)}
                    preselectedCourseId={preselectedCourseId}
                  />
                  <RoleSwitcherToolbar />
                </div>
              }
            />

            {/* Authentication Routes */}
            <Route path="/login" element={<><Login /><RoleSwitcherToolbar /></>} />
            <Route path="/reset-password" element={<><ResetPassword /><RoleSwitcherToolbar /></>} />

            {/* Admin Dashboard Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminLayout />
                  <RoleSwitcherToolbar />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="resources" element={<ResourceManagement />} />
              <Route path="applications" element={<ApplicationManagement />} />
              <Route path="meetings" element={<MeetingManagement />} />
              <Route path="announcements" element={<AnnouncementManagement />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Student Dashboard Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentLayout />
                  <RoleSwitcherToolbar />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentOverview />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="courses/:courseId" element={<StudentCourseDetail />} />
              <Route path="resources" element={<StudentResources />} />
              <Route path="schedule" element={<StudentSchedule />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}
