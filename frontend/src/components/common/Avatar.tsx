const PALETTE = ["#c6f0c2", "#c9d9f7", "#ded0f7", "#ffd9b3", "#ffc2c2", "#c2f0e6"];

interface Props {
  name: string;
  online?: boolean;
  size?: number;
  imageUrl?: string | null;
  className?: string;
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

export default function Avatar({ name, online, size = 40, imageUrl, className }: Props) {
  return (
    <div
      className={`relative rounded-full flex items-center justify-center font-semibold text-[#2b2b2b] shrink-0${className ? ` ${className}` : ""}`}
      style={{
        width: size,
        height: size,
        background: imageUrl ? undefined : colorFor(name),
        fontSize: size * 0.4,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initialsFor(name)
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-[28%] h-[28%] min-w-[8px] min-h-[8px] bg-[#22c55e] border-2 border-white dark:border-[#10161f] rounded-full" />
      )}
    </div>
  );
}
