import AdminNav from "../components/admin/AdminNav";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-page__header">
        <h1>Admin</h1>
      </header>
      <main className="admin-dashboard-page__content">
        <p>Chats list coming soon</p>
      </main>
      <AdminNav />
    </div>
  );
}
