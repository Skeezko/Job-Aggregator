"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm transition-colors ${
        pathname.startsWith(href)
          ? "text-white font-medium"
          : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header
      className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm"
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-white"
            aria-label="JobAggregator — Accueil"
          >
            Job<span className="text-blue-500">Aggregator</span>
          </Link>
          <nav
            className="hidden sm:flex items-center gap-5"
            aria-label="Navigation principale"
          >
            {navLink("/offers", "Offres")}
            {user && navLink("/dashboard", "Dashboard")}
            {user && navLink("/bookmarks", "Favoris")}
            {user?.role === "admin" && navLink("/admin", "Admin")}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:block text-xs text-zinc-500">
                {user.name ?? user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded-md hover:border-zinc-500 hover:text-white transition-colors"
                aria-label="Se déconnecter"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
              >
                {"S'inscrire"}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
