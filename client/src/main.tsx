// src/main.tsx 
// Importa React y las herramientas base del DOM
import React from "react";
import ReactDOM from "react-dom/client";

import "./styles/theme.css";

// Importa el sistema de rutas de React Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Tus páginas principales
import UnitsPage from "./pages/UnitsPage";
import TopicsPage from "./pages/TopicsPage";

// NUEVO: página de Login
import LoginPage from "./pages/LoginPage";

// Importa el contenedor global de notificaciones tipo "toast"
import { Toaster } from "react-hot-toast";

// Importa la pagina de registro
import RegisterPage from "./pages/RegisterPage"; // <-- NUEVO

// 🔒 NUEVO: AuthProvider y ProtectedRoute
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// 🆕 Importa la vista de detalle de intento (práctica)
import AttemptDetailPage from "./pages/AttemptDetailPage";

// 🆕 Importa la vista de historial (Mi progreso - práctica)
import HistoryPage from "./pages/HistoryPage";

// 🆕 Dashboard (para usuarios logueados)
import DashboardPage from "./pages/DashboardPage";

// 🆕 Nueva página de presentación (pública)
import HomePortal from "./pages/HomePortal";

// 🆕 Ensayos: páginas
import ExamSetupPage from "./pages/ExamSetupPage";        // Configurar nuevo ensayo
import ExamRunPage from "./pages/ExamRunPage";            // Rendir ensayo
import ExamResultPage from "./pages/ExamResultPage";      // Resultado del ensayo
import ExamReviewPage from "./pages/ExamReviewPage";      // Revisión por pregunta
import ExamHistoryPage from "./pages/ExamHistoryPage";    // Historial de ensayos

// 🆕 Perfil del usuario
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      {/* Define las rutas principales de la aplicación */}
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<HomePortal />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* Protegidas */}
        {/* 🏠 Inicio del usuario logueado -> Dashboard */}
        <Route
          path="/inicio"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Práctica */}
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

        {/* Historial (Mi progreso - práctica) */}
        <Route
          path="/progreso"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Detalle de intento (práctica) */}
        <Route
          path="/progreso/:attemptId"
          element={
            <ProtectedRoute>
              <AttemptDetailPage />
            </ProtectedRoute>
          }
        />

        {/* 🧪 Ensayos */}
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

        {/* 🆕 Perfil */}
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* 🔔 Toaster global para mostrar notificaciones */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
        }}
      />
    </BrowserRouter>
  );
}

// Crea el root (punto de entrada) y renderiza toda la app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Proveedor de autenticación para toda la app */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
