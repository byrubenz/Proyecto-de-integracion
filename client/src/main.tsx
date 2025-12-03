// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import "./styles/theme.css";

// Paginas principales
import UnitsPage from "./pages/UnitsPage";
import TopicsPage from "./pages/TopicsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AttemptDetailPage from "./pages/AttemptDetailPage";
import HistoryPage from "./pages/HistoryPage";
import DashboardPage from "./pages/DashboardPage";
import HomePortal from "./pages/HomePortal";
import ExamSetupPage from "./pages/ExamSetupPage";
import ExamRunPage from "./pages/ExamRunPage";
import ExamResultPage from "./pages/ExamResultPage";
import ExamReviewPage from "./pages/ExamReviewPage";
import ExamHistoryPage from "./pages/ExamHistoryPage";
import FriendsPage from "./pages/FriendsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import PaywallPage from "./pages/PaywallPage";
import NemRankingPage from "./pages/NemRankingPage";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Publicas */}
        <Route path="/" element={<HomePortal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/pago" element={<PaywallPage />} />

        {/* Protegidas */}
        <Route
          path="/inicio"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/unidades"
          element={
            <ProtectedRoute>
              <UnitsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/temas/:id"
          element={
            <ProtectedRoute>
              <TopicsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progreso"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progreso/:attemptId"
          element={
            <ProtectedRoute>
              <AttemptDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ensayos"
          element={
            <ProtectedRoute>
              <ExamHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ensayo/nuevo"
          element={
            <ProtectedRoute>
              <ExamSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ensayo/:attemptId"
          element={
            <ProtectedRoute>
              <ExamRunPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ensayo/:attemptId/resultado"
          element={
            <ProtectedRoute>
              <ExamResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ensayo/:attemptId/revision"
          element={
            <ProtectedRoute>
              <ExamReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/amigos"
          element={
            <ProtectedRoute>
              <FriendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nem-ranking"
          element={
            <ProtectedRoute>
              <NemRankingPage />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
        }}
      />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
