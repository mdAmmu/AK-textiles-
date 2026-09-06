import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SplashScreen from "./components/common/SplashScreen";
import Login from "./pages/Login";
import RoleRedirect from "./pages/RoleRedirect";
import UserChat from "./pages/UserChat";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminChatsHome from "./pages/AdminChatsHome";
import AdminBroadcastHome from "./pages/AdminBroadcastHome";
import BroadcastComposer from "./pages/BroadcastComposer";
import BroadcastThread from "./pages/BroadcastThread";
import BroadcastDetail from "./pages/BroadcastDetail";
import BroadcastAudienceInfo from "./pages/BroadcastAudienceInfo";
import BroadcastMessageInfo from "./pages/BroadcastMessageInfo";
import AdminChat from "./pages/AdminChat";
import CustomerChatInfo from "./pages/CustomerChatInfo";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import GroupChat from "./pages/GroupChat";
import GroupChatInfo from "./pages/GroupChatInfo";
import GroupMessageInfo from "./pages/GroupMessageInfo";
import Products from "./pages/Products";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import ProductDetail from "./pages/ProductDetail";
import BroadcastConfirm from "./pages/BroadcastConfirm";
import WhatsAppSend from "./pages/WhatsAppSend";
import ComingSoon from "./pages/ComingSoon";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

const InstallAppBanner = lazy(() => import("./components/common/InstallAppBanner"));

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      {showSplash && <SplashScreen />}
      <BrowserRouter>
        <Suspense fallback={null}>
          <InstallAppBanner />
        </Suspense>
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login/*" element={<Login />} />
        <Route path="/redirect" element={<RoleRedirect />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute role={["USER", "STAFF"]}>
              <UserChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/profile"
          element={
            <ProtectedRoute role={["USER", "STAFF"]}>
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
          path="/admin/chats"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminChatsHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminBroadcastHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast/new"
          element={
            <ProtectedRoute role="ADMIN">
              <BroadcastComposer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast/:audienceId"
          element={
            <ProtectedRoute role="ADMIN">
              <BroadcastThread />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast/:audienceId/message/:broadcastId"
          element={
            <ProtectedRoute role="ADMIN">
              <BroadcastDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast/:audienceId/message/:broadcastId/info"
          element={
            <ProtectedRoute role="ADMIN">
              <BroadcastMessageInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast/:audienceId/info"
          element={
            <ProtectedRoute role="ADMIN">
              <BroadcastAudienceInfo />
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
          path="/admin/chats/:conversationId/info"
          element={
            <ProtectedRoute role="ADMIN">
              <CustomerChatInfo />
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
          path="/admin/groups/:groupId/chat/message/:messageId/info"
          element={
            <ProtectedRoute role="ADMIN">
              <GroupMessageInfo />
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
        <Route
          path="/admin/whatsapp-send"
          element={
            <ProtectedRoute role="ADMIN">
              <WhatsAppSend />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/campaign"
          element={
            <ProtectedRoute role="ADMIN">
              <ComingSoon title="Campaign" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <ProtectedRoute role="ADMIN">
              <ComingSoon title="Template" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/balance"
          element={
            <ProtectedRoute role="ADMIN">
              <ComingSoon title="Balance" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute role="ADMIN">
              <ComingSoon title="Order" />
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
