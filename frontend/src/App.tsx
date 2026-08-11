import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RoleRedirect from "./pages/RoleRedirect";
import UserChat from "./pages/UserChat";
import AdminDashboard from "./pages/AdminDashboard";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import ProtectedRoute from "./components/common/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login/*" element={<Login />} />
        <Route path="/redirect" element={<RoleRedirect />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute role="USER">
              <UserChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/groups"
          element={
            <ProtectedRoute role="ADMIN">
              <Groups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/groups/:groupId"
          element={
            <ProtectedRoute role="ADMIN">
              <GroupDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
