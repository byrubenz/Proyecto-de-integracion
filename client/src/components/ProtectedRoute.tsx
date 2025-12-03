// src/components/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, token } = useAuth();
  const location = useLocation();
  console.log("ProtectedRoute user:", user);

  // no logueado → a login
  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // si algún día usas esto con admin, lo dejamos pasar
  if (user.role === "admin") {
    return <>{children}</>;
  }

  // student: miramos is_paid
  const rawPaid = (user as any).is_paid;
  const isPaid = rawPaid === true || rawPaid === 1 || rawPaid === "1";

  // sin pago → paywall
  if (user.role === "student" && !isPaid) {
    return <Navigate to="/pago" replace />;
  }

  // student con pago → entra normal
  return <>{children}</>;
}
