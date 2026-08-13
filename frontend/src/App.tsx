import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import RoleRedirect from "./pages/RoleRedirect";
import UserChat from "./pages/UserChat";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminChat from "./pages/AdminChat";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import GroupChat from "./pages/GroupChat";
import GroupChatInfo from "./pages/GroupChatInfo";
import Products from "./pages/Products";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import ProductDetail from "./pages/ProductDetail";
import BroadcastConfirm from "./pages/BroadcastConfirm";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
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
          path="/chat/profile"
          element={
            <ProtectedRoute role="USER">
              <UserProfile />
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
          path="/admin/chats/:conversationId"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminChat />
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
        <Route
          path="/admin/groups/:groupId/chat"
          element={
            <ProtectedRoute role="ADMIN">
              <GroupChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/groups/:groupId/chat/info"
          element={
            <ProtectedRoute role="ADMIN">
              <GroupChatInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute role="ADMIN">
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <ProtectedRoute role="ADMIN">
              <CreateProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:productId"
          element={
            <ProtectedRoute role="ADMIN">
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:productId/edit"
          element={
            <ProtectedRoute role="ADMIN">
              <EditProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:productId/send"
          element={
            <ProtectedRoute role="ADMIN">
              <BroadcastConfirm />
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
