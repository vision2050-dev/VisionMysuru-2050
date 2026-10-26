import React, { Suspense, memo } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./Components/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import ScrollToTop from "./Components/ScrollToTop";

const LandingPage = React.lazy(() => import("./pages/LandingPage.jsx"));
const SubmitIdeaPage = React.lazy(() => import("./pages/SubmitIdeaPage.jsx"));
const NewsPage = React.lazy(() => import("./pages/NewsPage.jsx"));
const CertificatesPage = React.lazy(
  () => import("./pages/CertificatesPage.jsx"),
);
const LoginPage = React.lazy(() => import("./pages/LoginPage.jsx"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard.jsx"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage.jsx"));
const EditionOnePage = React.lazy(() => import("./pages/EditionOnePage.jsx"));
const ParticipantPortal = React.lazy(() => import("./pages/ParticipantPortal.jsx"));
const JuryzaHub = React.lazy(() => import("./pages/JuryzaHub.jsx"));
const JuryzaGateway = React.lazy(() => import("./pages/JuryzaGateway.jsx"));
const AdminJuryzaPlatform = React.lazy(() => import("./pages/AdminJuryzaPlatform.jsx"));

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/edition-1" element={<EditionOnePage />} />

            {/* Participant Registration & Portals */}
            <Route path="/register" element={<JuryzaGateway />} />
            <Route path="/signup" element={<Navigate to="/register" replace />} />
            <Route path="/participant" element={<Navigate to="/register" replace />} />
            <Route path="/participate" element={<Navigate to="/register" replace />} />
            <Route path="/juryza" element={<Navigate to="/register" replace />} />
            
            {/* Participant Submission Dashboard */}
            <Route path="/portal" element={<ParticipantPortal />} />
            <Route path="/submission" element={<Navigate to="/portal" replace />} />
            <Route path="/submissions" element={<Navigate to="/portal" replace />} />
            <Route path="/participant-portal" element={<Navigate to="/portal" replace />} />

            {/* Jury / Judge Evaluation Hub */}
            <Route path="/jury" element={<JuryzaHub />} />
            <Route path="/judge" element={<Navigate to="/jury" replace />} />
            <Route path="/judges" element={<Navigate to="/jury" replace />} />
            <Route path="/jury-portal" element={<Navigate to="/jury" replace />} />

            {/* Admin Platform Console */}
            <Route path="/admin" element={<AdminJuryzaPlatform />} />
            <Route path="/admin-portal" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/console" element={<Navigate to="/admin" replace />} />
            <Route path="/shortlist" element={<SubmitIdeaPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/admin/secure/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route
                path="/admin/secure/dashboard"
                element={<AdminDashboard />}
              />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default memo(App);
