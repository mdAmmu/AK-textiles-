import { useState } from "react";
import { Radio } from "lucide-react";
import AdminAudienceListPane from "../components/admin/AdminAudienceListPane";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import BroadcastManagementPanel from "../components/admin/BroadcastManagementPanel";
import { useAdminAudiences } from "../hooks/useAdminAudiences";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function AdminBroadcastHome() {
  const { user } = useCurrentUser();
  const { audiences, setAudiences } = useAdminAudiences();
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBroadcastManagement, setShowBroadcastManagement] = useState(false);

  return (
    <div className="relative flex h-dvh bg-[linear-gradient(180deg,#eaf0ff_0%,#f5f8ff_40%,#ffffff_75%)] dark:bg-[#10161f] md:pl-[76px]">
      <div className="flex flex-col w-full md:w-[400px] md:shrink-0 md:border-r md:border-[#eef1ee] md:dark:border-[#232d3a] min-h-0">
        <AdminAudienceListPane
          adminName={user?.name}
          audiences={audiences}
          onMenuClick={() => setShowAccount(true)}
          onProfileClick={() => setShowProfile(true)}
          onManageClick={() => setShowBroadcastManagement(true)}
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-[#9a9e9b] dark:text-[#6b7480] bg-white dark:bg-[#151b25]">
        <Radio size={48} strokeWidth={1.5} />
        <p className="text-sm">Select an audience to see its broadcasts</p>
      </div>

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
