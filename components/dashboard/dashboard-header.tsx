"use client";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";

/*
 * Header dashboard sesuai DESIGN.md §6.3: sticky, latar teal, teks putih.
 * Mobile: tombol navigasi collapse ke ikon hamburger.
 */
export function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navButton =
    "inline-flex h-10 items-center justify-center rounded-lg border border-white bg-transparent px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white hover:text-primary";
  const logoutButton =
    "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10";

  const navItems = (
    <>
      <Link href="/dashboard/daily-tasks" className={navButton}>
        Daily Tasks
      </Link>
      <Link href="/dashboard/weekly-tasks" className={navButton}>
        Weekly Tasks
      </Link>
      <button onClick={() => signOut({ callbackUrl: "/" })} className={logoutButton}>
        Logout
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-primary">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        <h1 className="text-lg font-bold text-white md:text-xl">Eisenhower Matrix</h1>

        {/* Navigasi desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-3 md:flex">
          {navItems}
        </nav>

        {/* Toggle menu mobile */}
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors duration-150 hover:bg-white/10 md:hidden"
        >
          {isMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {/* Navigasi mobile */}
      {isMenuOpen && (
        <nav id="mobile-nav" aria-label="Navigasi utama" className="flex flex-col gap-2 border-t border-white/20 px-4 pb-4 pt-3 md:hidden">
          {navItems}
        </nav>
      )}
    </header>
  );
}
