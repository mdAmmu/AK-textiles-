import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Radio } from "lucide-react";
import BottomNav from "../components/admin/BottomNav";
import LoadingScreen from "../components/common/LoadingScreen";
import { fetchAudiences } from "../services/broadcastMessages";
import type { BroadcastAudience } from "../types/broadcastMessage";
import { formatGroupTimestamp } from "../utils/formatGroupTimestamp";

export default function AdminBroadcastHome() {
  const [audiences, setAudiences] = useState<BroadcastAudience[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAudiences().then((data) => {
      if (!cancelled) setAudiences(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative flex flex-col h-screen bg-[linear-gradient(180deg,#eaf7ee_0%,#f6fbf7_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <header className="flex items-center justify-between pt-[1.125rem] px-5 shrink-0">
        <h1 className="text-2xl font-bold text-[#1a1a1a] dark:text-[#e9edef]">Broadcast</h1>
        <Link
          to="/admin/broadcast/new"
          className="flex items-center gap-1.5 bg-[#0f9d6e] text-white no-underline font-semibold text-sm rounded-full py-2 px-4"
        >
          <Plus size={16} /> New
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto pt-3.5 px-5 pb-24">
        {audiences === null ? (
          <LoadingScreen />
        ) : audiences.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center text-[#7c827e] dark:text-[#8b96a5] mt-16">
            <Radio size={40} />
            <p className="max-w-[240px]">
              No broadcasts yet. Create one, add recipients, and message all of them privately at
              once — from one place.
            </p>
            <Link
              to="/admin/broadcast/new"
              className="mt-1 bg-[#0f9d6e] text-white no-underline font-semibold text-sm rounded-full py-2.5 px-5"
            >
              Create Broadcast
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {audiences.map((a) => (
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
    </div>
  );
}
