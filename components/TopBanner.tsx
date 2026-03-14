export default function TopBanner() {
  return (
    <div className="w-full bg-black border-b border-zinc-900 text-center py-2 px-4 z-50">
      <p className="text-xs text-zinc-400 font-medium flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
        <span>Atlas Developer Platform is now in beta.</span>
        <a href="/dev-login" className="text-zinc-300 hover:text-white transition-colors ml-1 underline decoration-zinc-700 underline-offset-4">
          Login here
        </a>
      </p>
    </div>
  );
}
