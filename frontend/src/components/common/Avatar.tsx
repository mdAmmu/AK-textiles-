import "./Avatar.css";

const PALETTE = ["#c6f0c2", "#c9d9f7", "#ded0f7", "#ffd9b3", "#ffc2c2", "#c2f0e6"];

interface Props {
  name: string;
  online?: boolean;
  size?: number;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, online, size = 40 }: Props) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: colorFor(name), fontSize: size * 0.4 }}
    >
      {initialsFor(name)}
      {online && <span className="avatar__online" />}
    </div>
  );
}
