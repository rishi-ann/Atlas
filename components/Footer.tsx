import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-900 bg-black py-8 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 grayscale opacity-60">
          <Link href="/">
            <img
              src="https://ik.imagekit.io/dypkhqxip/logo_atlas.png"
              alt="Atlas Logo"
              className="h-6 w-auto object-contain"
            />
          </Link>
        </div>
        
        <p className="text-xs text-zinc-600 font-medium">
          &copy; {new Date().getFullYear()} Redlix Systems. Developer Tooling.
        </p>
        
        <div className="flex gap-6">
          <Link href="https://redlix.com" className="text-zinc-500 hover:text-white transition-colors text-xs font-medium">Redlix.com</Link>
          <Link href="#" className="text-zinc-500 hover:text-white transition-colors text-xs font-medium">Privacy</Link>
          <Link href="/super-admin-login" className="text-zinc-800 hover:text-zinc-600 transition-colors text-xs font-medium">Console</Link>
        </div>
        
      </div>
    </footer>
  );
}
