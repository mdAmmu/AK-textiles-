import { useState } from "react";
import { Users } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAdminGroups } from "../hooks/useAdminGroups";
import AdminGroupListPane from "../components/admin/AdminGroupListPane";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import GroupManagementPanel from "../components/admin/GroupManagementPanel";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const { groups, setGroups } = useAdminGroups();
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);

  return (
    <div className="relative flex h-dvh bg-[linear-gradient(180deg,#eaf0ff_0%,#f5f8ff_40%,#ffffff_75%)] dark:bg-[#10161f] md:pl-[76px]">
      <div className="flex flex-col w-full md:w-[400px] md:shrink-0 md:border-r md:border-[#eef1ee] md:dark:border-[#232d3a] min-h-0">
        <AdminGroupListPane
          adminName={user?.name}
          groups={groups}
          onMenuClick={() => setShowAccount(true)}
          onProfileClick={() => setShowProfile(true)}
          onManageClick={() => setShowGroupManagement(true)}
        />
      </div>

      <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-[#9a9e9b] dark:text-[#6b7480] bg-white dark:bg-[#151b25]">
        <Users size={48} strokeWidth={1.5} />
        <p className="text-sm">Select a group to start messaging</p>
      </div>

      {showProfile && user && (
        <AdminProfileScreen admin={user} onClose={() => setShowProfile(false)} />
      )}

      {showAccount && user && (
        <AdminAccountPanel admin={user} onClose={() => setShowAccount(false)} />
      )}

      {showGroupManagement && (
        <GroupManagementPanel
          onClose={() => setShowGroupManagement(false)}
          onGroupCreated={(group) => setGroups((prev) => [group, ...(prev ?? [])])}
          onGroupDeleted={(groupId) =>
            setGroups((prev) => prev?.filter((g) => g.id !== groupId) ?? prev)
          }
        />
      )}
    </div>
  );
}
