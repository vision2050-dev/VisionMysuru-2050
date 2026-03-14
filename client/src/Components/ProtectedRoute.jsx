import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/secure/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
