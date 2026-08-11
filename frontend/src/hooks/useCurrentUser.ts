import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { fetchCurrentUser, syncCurrentUser } from "../services/auth";
import type { User } from "../types/user";

interface State {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentUser(): State {
  const { user: clerkUser, isLoaded } = useUser();
  const [state, setState] = useState<State>({ user: null, loading: true, error: null });

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    async function loadOrCreateProfile() {
      try {
        const profile = await fetchCurrentUser().catch(async () => {
          const email = clerkUser!.primaryEmailAddress?.emailAddress;
          const phone = clerkUser!.primaryPhoneNumber?.phoneNumber;
          const name = clerkUser!.fullName ?? email ?? phone ?? "Unknown";
          return syncCurrentUser(name, email, phone);
        });
        if (!cancelled) setState({ user: profile, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ user: null, loading: false, error: (err as Error).message });
        }
      }
    }

    loadOrCreateProfile();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, clerkUser]);

  return state;
}
