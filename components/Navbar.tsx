import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-zinc-900">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <img
              src="https://ik.imagekit.io/dypkhqxip/logo_atlas.png"
              alt="Atlas Logo"
              className="h-8 w-auto object-contain grayscale opacity-90 hover:opacity-100 hover:grayscale-0 transition-all"
            />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/test-db" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Database
            </Link>
            <Link href="https://github.com/Redlix-Servers/Atlas" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              GitHub
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Terminal SignIn
          </Link>
          <Link
            href="/dev-login"
            className="h-8 px-4 inline-flex items-center justify-center rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            Dev Login
          </Link>
        </div>

      </div>
    </nav>
  );
}