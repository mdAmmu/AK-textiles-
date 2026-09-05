import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Radio } from "lucide-react";
import BottomNav from "../components/admin/BottomNav";
import AdminHomeHeader from "../components/admin/AdminHomeHeader";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import BroadcastManagementPanel from "../components/admin/BroadcastManagementPanel";
import LoadingScreen from "../components/common/LoadingScreen";
import { fetchAudiences } from "../services/broadcastMessages";
import type { BroadcastAudience } from "../types/broadcastMessage";
import { formatGroupTimestamp } from "../utils/formatGroupTimestamp";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function AdminBroadcastHome() {
  const { user } = useCurrentUser();
  const [audiences, setAudiences] = useState<BroadcastAudience[] | null>(null);
  const [search, setSearch] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBroadcastManagement, setShowBroadcastManagement] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAudiences().then((data) => {
      if (!cancelled) setAudiences(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    audiences === null
      ? null
      : audiences.filter((a) => a.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="relative flex flex-col h-dvh bg-[linear-gradient(180deg,#eaf7ee_0%,#f6fbf7_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <AdminHomeHeader
        adminName={user?.name}
        onMenuClick={() => setShowAccount(true)}
        onProfileClick={() => setShowProfile(true)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search broadcasts..."
      />

      <main className="flex-1 overflow-y-auto pt-3.5 px-5 pb-24">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-bold text-[#1a1a1a] dark:text-[#e9edef]">Broadcast</span>
          <button
            className="flex border-none bg-transparent text-[#1a1a1a] dark:text-[#e9edef] cursor-pointer p-1"
            aria-label="Manage broadcasts"
            onClick={() => setShowBroadcastManagement(true)}
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {filtered === null ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center text-[#7c827e] dark:text-[#8b96a5] mt-16">
            <Radio size={40} />
            <p className="max-w-[240px]">
              {audiences && audiences.length > 0
                ? "No broadcasts match your search."
                : "No broadcasts yet. Create one, add recipients, and message all of them privately at once — from one place."}
            </p>
            <button
              className="mt-1 border-none bg-[#0f9d6e] text-white font-semibold text-sm rounded-full py-2.5 px-5 cursor-pointer"
              onClick={() => setShowBroadcastManagement(true)}
            >
              Create Broadcast
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((a) => (
              <Link
                key={a.id}
                to={`/admin/broadcast/${a.id}`}
                className="flex items-center gap-3.5 py-3 px-3.5 bg-white border border-[#eef1ee] rounded-2xl no-underline text-inherit dark:bg-[#1e2530] dark:border-[#232d3a]"
              >
                <span className="w-12 h-12 rounded-xl bg-[#e3f7ec] flex items-center justify-center shrink-0">
                  <Radio size={22} color="#0f9d6e" />
                </span>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="font-semibold text-[#1a1a1a] dark:text-[#e9edef] truncate">
                    {a.name}
                  </span>
                  <span className="text-[#8b8f8c] text-sm mt-0.5 dark:text-[#8b96a5]">
                    {a.member_count} recipient{a.member_count === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="text-[#9a9e9b] text-xs dark:text-[#6b7480] shrink-0">
                  {formatGroupTimestamp(a.updated_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {showProfile && user && <AdminProfileScreen admin={user} onClose={() => setShowProfile(false)} />}

      {showAccount && user && (
        <AdminAccountPanel admin={user} onClose={() => setShowAccount(false)} />
      )}

      {showBroadcastManagement && (
        <BroadcastManagementPanel
          onClose={() => setShowBroadcastManagement(false)}
          onAudienceDeleted={(audienceId) =>
            setAudiences((prev) => prev?.filter((a) => a.id !== audienceId) ?? prev)
          }
        />
      )}
    </div>
  );
}
