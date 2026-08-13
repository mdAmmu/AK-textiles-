import { Building2, Home, Landmark, Mountain, Users } from "lucide-react";
import "./GroupIcon.css";

const STYLE_BY_GROUP: Record<string, { Icon: typeof Users; bg: string; color: string }> = {
  dubai: { Icon: Building2, bg: "#d9f2e3", color: "#0f9d58" },
  india: { Icon: Landmark, bg: "#dbe9fb", color: "#2563eb" },
  local: { Icon: Home, bg: "#e6def9", color: "#7c3aed" },
  "south africa": { Icon: Mountain, bg: "#fbe4cf", color: "#e07b1f" },
};

const DEFAULT_STYLE = { Icon: Users, bg: "#e9edef", color: "#667781" };

interface Props {
  name: string;
  size?: number;
  variant?: "default" | "hero";
}

export default function GroupIcon({ name, size = 48, variant = "default" }: Props) {
  const { Icon, bg, color } = STYLE_BY_GROUP[name.toLowerCase()] ?? DEFAULT_STYLE;
  const isHero = variant === "hero";
  return (
    <div
      className={`group-icon${isHero ? " group-icon--hero" : ""}`}
      style={{ width: size, height: size, background: isHero ? undefined : bg }}
    >
      <Icon size={size * 0.5} color={isHero ? "#fff" : color} strokeWidth={2} />
    </div>
  );
}
