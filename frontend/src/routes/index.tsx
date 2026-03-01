import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { UserRole } from '../types';

import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import StudentLoginPage from '../pages/StudentLoginPage';
import StaffLoginPage from '../pages/StaffLoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/TermsOfServicePage';
import ContactSupportPage from '../pages/ContactSupportPage';
import DashboardPage from '../pages/DashboardPage';
import ComplaintsListPage from '../pages/ComplaintsListPage';
import CreateComplaintPage from '../pages/CreateComplaintPage';
import ComplaintDetailsPage from '../pages/ComplaintDetailsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import UserManagementPage from '../pages/UserManagementPage';
import StaffRegistrationPage from '../pages/StaffRegistrationPage';
import NotificationsPage from '../pages/NotificationsPage';
import ChatbotPage from '../pages/ChatbotPage';
import ResolutionVerificationPage from '../pages/ResolutionVerificationPage';
import ProfilePage from '../pages/ProfilePage';
import MapPage from '../pages/MapPage';
import AuditLogPage from '../pages/AuditLogPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/login" element={<StudentLoginPage />} />
        <Route path="/staff-login" element={<StaffLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/contact-support" element={<ContactSupportPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout><DashboardPage /></MainLayout>} path="/dashboard" />
        <Route element={<MainLayout><ProfilePage /></MainLayout>} path="/profile" />

        <Route element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]} />}>
          <Route element={<MainLayout><ComplaintsListPage /></MainLayout>} path="/complaints" />
          <Route element={<MainLayout><CreateComplaintPage /></MainLayout>} path="/complaints/new" />
          <Route element={<MainLayout><ResolutionVerificationPage /></MainLayout>} path="/complaints/verification" />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[UserRole.STAFF]} />}>
          <Route element={<MainLayout><ComplaintsListPage /></MainLayout>} path="/staff/complaints" />
          <Route element={<MainLayout><StaffRegistrationPage /></MainLayout>} path="/staff/registrations" />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
          <Route element={<MainLayout><ComplaintsListPage /></MainLayout>} path="/admin/complaints" />
          <Route element={<MainLayout><AnalyticsPage /></MainLayout>} path="/admin/analytics" />
          <Route element={<MainLayout><UserManagementPage /></MainLayout>} path="/admin/users" />
          <Route element={<MainLayout><AuditLogPage /></MainLayout>} path="/admin/audit-logs" />
        </Route>

        <Route element={<MainLayout><ComplaintDetailsPage /></MainLayout>} path="/complaints/:id" />
        <Route element={<MainLayout><NotificationsPage /></MainLayout>} path="/notifications" />
        <Route element={<MainLayout><ChatbotPage /></MainLayout>} path="/chatbot" />
        <Route element={<MainLayout><MapPage /></MainLayout>} path="/map" />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
