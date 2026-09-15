export default function LoadingScreen() {
  return (
    <div className="flex flex-1 items-center justify-center h-full min-h-[240px] py-16">
      <span
        className="w-8 h-8 rounded-full border-[3px] border-[#2563eb]/20 border-t-[#2563eb] dark:border-[#60a5fa]/20 dark:border-t-[#60a5fa] animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
