import React, { Suspense, memo } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/edition-1" element={<EditionOnePage />} />
            <Route path="/portal" element={<ParticipantPortal />} />
            <Route path="/jury" element={<JuryzaHub />} />
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
              fontSize: "14px",
              padding: "10px 14px",
              borderRadius: "16px",
              background: "var(--surface)",
              color: "var(--text)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border)",
              fontFamily: "'DM Sans', sans-serif",
            },
            success: {
              iconTheme: {
                primary: "#22c55e",
                secondary: "#ffffff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#ffffff",
              },
            },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default memo(App);
