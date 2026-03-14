import Link from 'next/link';

export default function Hero() {
  return (
    <div className="w-full flex flex-col justify-center min-h-[70vh] px-6 text-center">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        
        <div className="inline-flex items-center rounded-full border border-zinc-900 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400 font-medium mb-12">
          <span className="flex h-2 w-2 rounded-full bg-zinc-500 mr-2" />
          Atlas 1.0 Runtime
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-white mb-6">
          Developer Operations
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10">
          A minimal, unified workspace to manage clients, real-time communications, and project workflows within the Redlix ecosystem.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
          <Link
            href="/dev-login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Start Building
          </Link>
          <Link
            href="/client-login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-900 transition-colors"
          >
            Client Portal
          </Link>
        </div>
        
      </div>
    </div>
  );
}
