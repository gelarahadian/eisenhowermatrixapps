"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

/*
 * Sign In sesuai DESIGN.md §6.2: kartu terpusat maks 400px, tombol Google
 * Secondary full-width, state loading dan error tersedia.
 */
export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await signIn("google", { callbackUrl: "/dashboard", redirect: false });
      if (res?.error) {
        setError("Login gagal. Silakan coba lagi.");
        setIsLoading(false);
      } else if (res?.url) {
        window.location.href = res.url;
      } else {
        setIsLoading(false);
      }
    } catch {
      setError("Login gagal. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4">
      {/* Dekorasi halus di belakang kartu (DESIGN.md §6.2) */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft blur-3xl" />

      <div className="w-full max-w-[400px] rounded-dialog border border-line bg-white p-8 shadow-card">
        <h1 className="text-center text-3xl font-bold text-primary">
          Selamat datang
        </h1>
        <p className="mt-2 text-center text-sm text-ink-muted">
          Masuk untuk mulai memprioritaskan tugas dengan Eisenhower Matrix.
        </p>

        {error && (
          <div role="alert" className="mt-6 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            <span aria-hidden="true">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-lg border-[1.5px] border-primary bg-white text-sm font-semibold text-primary transition-colors duration-150 hover:bg-accent disabled:bg-disabled-bg disabled:text-disabled-text"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Menghubungkan…
            </>
          ) : (
            <>
              {/* Logo Google monokrom agar tetap dalam palet teal aplikasi */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.27 2 2.03 6.8 2.03 12c0 5.05 4.05 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                  fill="currentColor"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
