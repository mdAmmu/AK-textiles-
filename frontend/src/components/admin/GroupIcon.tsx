import "./GroupIcon.css";

const STYLE_BY_GROUP: Record<string, { icon: string; bg: string }> = {
  dubai: { icon: "🏙️", bg: "#d9f2e3" },
  india: { icon: "🏛️", bg: "#dbe9fb" },
  local: { icon: "🏠", bg: "#e6def9" },
  "south africa": { icon: "🌍", bg: "#fbe4cf" },
};

const DEFAULT_STYLE = { icon: "👥", bg: "#e9edef" };

interface Props {
  name: string;
  size?: number;
}

export default function GroupIcon({ name, size = 48 }: Props) {
  const style = STYLE_BY_GROUP[name.toLowerCase()] ?? DEFAULT_STYLE;
  return (
    <div
      className="group-icon"
      style={{ width: size, height: size, background: style.bg, fontSize: size * 0.5 }}
    >
      {style.icon}
    </div>
  );
}
