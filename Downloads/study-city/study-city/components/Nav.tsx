import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--bp-grid-line-strong)] bg-[var(--bp-navy-950)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href={user ? "/record" : "/"} className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-8 w-8 place-items-center rounded-[6px] border border-[var(--bp-cyan)]/50 text-[13px] font-bold text-[var(--bp-amber)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            #A
          </span>
          <span className="text-[15px] font-bold tracking-wide">STUDY WORKS</span>
        </Link>

        {user ? (
          <nav className="flex items-center gap-1.5">
            <Link
              href="/record"
              className="rounded-lg px-3.5 py-2 text-sm text-[var(--bp-text-muted)] transition hover:bg-white/5 hover:text-[var(--bp-text)]"
            >
              記録
            </Link>
            <Link
              href="/city"
              className="rounded-lg px-3.5 py-2 text-sm text-[var(--bp-text-muted)] transition hover:bg-white/5 hover:text-[var(--bp-text)]"
            >
              街
            </Link>
            <span className="mx-2 hidden text-xs text-[var(--bp-text-faint)] sm:inline">
              {user.email}
            </span>
            <LogoutButton />
          </nav>
        ) : (
          <Link href="/login" className="btn-primary px-4 py-2 text-sm">
            はじめる
          </Link>
        )}
      </div>
    </header>
  );
}
