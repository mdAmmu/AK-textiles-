import { useEffect, useState } from "react";
import { fetchCurrentUser } from "../services/auth";
import { getToken } from "../services/api";
import type { User } from "../types/user";

interface State {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentUser(): State {
  const [state, setState] = useState<State>({ user: null, loading: true, error: null });

  useEffect(() => {
    if (!getToken()) {
      setState({ user: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    fetchCurrentUser()
      .then((profile) => {
        if (!cancelled) setState({ user: profile, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ user: null, loading: false, error: (err as Error).message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
