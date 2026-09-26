import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import ChildLogin from "./pages/ChildLogin";
import ChildSignup from "./pages/ChildSignup";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import ChildDashboard from "./pages/ChildDashboard";
import ProtectedRoute from "./pages/ProtectedRoute";
import InvoicePage from "./pages/Invoicepage";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ================= HOME ================= */}
          <Route path="/" element={<Home />} />


          {/* ================= ADMIN ================= */}

          {/* Admin → Admin Login */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Admin Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />


          {/* ================= USER / CLIENT ================= */}

          {/* User → User Login */}
          <Route path="/child-login" element={<ChildLogin />} />

          {/* User Signup */}
          <Route path="/child-signup" element={<ChildSignup />} />

          <Route path="/signup" element={<Signup />} />

          {/* User Dashboard */}
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <ChildDashboard />
              </ProtectedRoute>
            }
          />


          {/* ================= INVOICE ================= */}

          <Route
            path="/invoice/:orderId"
            element={
              <ProtectedRoute requireAdmin>
                <InvoicePage />
              </ProtectedRoute>
            }
          />


          {/* ================= UNKNOWN URL ================= */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}