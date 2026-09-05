import { useCurrentUser } from "../hooks/useCurrentUser";
import LoadingScreen from "../components/common/LoadingScreen";
import CustomerChat from "./CustomerChat";
import StaffGroupChat from "./StaffGroupChat";

// Home screen for both non-admin roles. Anyone assigned to a Group is a real
// group-chat participant — every member sees every other member's messages,
// like a normal WhatsApp group (see chat_service._notify_group_members).
// Only members with no group at all get their own private 1-1/broadcast
// conversation instead.
export default function UserChat() {
  const { user, loading } = useCurrentUser();

  if (loading || !user) return <LoadingScreen />;

  return user.group_id ? <StaffGroupChat /> : <CustomerChat />;
}
