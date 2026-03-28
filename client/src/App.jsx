import React, { Suspense, memo } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./Components/ProtectedRoute";

const LandingPage = React.lazy(() => import("./pages/LandingPage.jsx"));
const SubmitIdeaPage = React.lazy(() => import("./pages/SubmitIdeaPage.jsx"));
const NewsPage = React.lazy(() => import("./pages/NewsPage.jsx"));
const CertificatesPage = React.lazy(
  () => import("./pages/CertificatesPage.jsx"),
);
const LoginPage = React.lazy(() => import("./pages/LoginPage.jsx"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard.jsx"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage.jsx"));

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
            padding: "10px 12px",
            borderRadius: 20,
            background: "rgba(255, 255, 255, 0.9)",
            color: "#111827",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(16px)",
            border: "1px solid #e5e7eb",
            fontFamily: "'DM Sans', sans-serif",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff",
            },
            style: {
              borderLeft: "4px solid #22c55e",
              borderRight: "4px solid #22c55e",
              backgroundColor: "#d1fae5",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
            style: {
              borderLeft: "4px solid #ef4444",
              borderRight: "4px solid #ef4444",
              backgroundColor: "#fee2e2",
            },
          },
        }}
      />
    </BrowserRouter>
  );
};

export default memo(App);
