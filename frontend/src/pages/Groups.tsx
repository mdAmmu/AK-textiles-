import { useEffect, useState } from "react";
import { fetchGroups } from "../services/groups";
import type { Group } from "../types/group";
import GroupList from "../components/admin/GroupList";
import LoadingScreen from "../components/common/LoadingScreen";
import AdminNav from "../components/admin/AdminNav";
import "./Groups.css";

export default function Groups() {
  const [groups, setGroups] = useState<Group[] | null>(null);

  useEffect(() => {
    fetchGroups().then(setGroups);
  }, []);

  return (
    <div className="groups-page">
      <header className="groups-page__header">
        <h1>Groups</h1>
      </header>
      <main className="groups-page__content">
        {groups === null ? <LoadingScreen /> : <GroupList groups={groups} />}
      </main>
      <AdminNav />
    </div>
  );
}
