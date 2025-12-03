// AdminRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, token } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/inicio" replace />;
  }

  return <>{children}</>;
}
