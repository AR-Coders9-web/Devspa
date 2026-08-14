import { Routes, Route, Navigate } from "react-router-dom";

import BootScreen from "./components/windows/BootScreen";
import Devspa from "./components/layout/DevSpa";
import Login from "./pages/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Boot Screen */}
      <Route
        path="/"
        element={<BootScreen />}
      />

      {/* Login */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* DEVSPA OS */}
      <Route
        path="/home"
        element={<Devspa />}
      />

      <Route
  path="/home"
  element={
    <ProtectedRoute>
      <Devspa />
    </ProtectedRoute>
  }
/>


      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />


    </Routes>
  );
}

export default App;