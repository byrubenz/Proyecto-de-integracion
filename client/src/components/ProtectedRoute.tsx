import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, token } = useAuth();
  const location = useLocation();

  // Si no hay user o token, manda a /login
  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
