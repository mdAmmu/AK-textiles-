import { useCurrentUser } from "../hooks/useCurrentUser";
import LoadingScreen from "../components/common/LoadingScreen";
import CustomerChat from "./CustomerChat";
import StaffGroupChat from "./StaffGroupChat";

// Home screen for both non-admin roles. Staff/managers interact with the
// admin through the shared Group chat; customers get their own private
// broadcast/1-1 conversation — see broadcast-working.md for why those two
// must never be the same screen.
export default function UserChat() {
  const { user, loading } = useCurrentUser();

  if (loading || !user) return <LoadingScreen />;

  return user.role === "STAFF" ? <StaffGroupChat /> : <CustomerChat />;
}
