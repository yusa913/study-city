"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "info",
          text: "登録しました。確認メールが届いている場合はリンクを開いてから、ログインしてください。",
        });
        setMode("signin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: "error", text: "メールアドレスまたはパスワードが違います。" });
      } else {
        router.push("/record");
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-md flex-col justify-center px-5 py-16">
      <p className="label-eyebrow mb-2">{mode === "signin" ? "SIGN IN" : "SIGN UP"}</p>
      <h1 className="mb-8 text-2xl font-bold">
        {mode === "signin" ? "おかえりなさい" : "アカウントを作成"}
      </h1>

      <form onSubmit={handleSubmit} className="panel flex flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[var(--bp-text-muted)]">メールアドレス</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[var(--bp-grid-line-strong)] bg-[var(--bp-navy-950)] px-3 py-2.5 outline-none focus:border-[var(--bp-cyan)]"
            placeholder="you@example.com"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[var(--bp-text-muted)]">パスワード</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-[var(--bp-grid-line-strong)] bg-[var(--bp-navy-950)] px-3 py-2.5 outline-none focus:border-[var(--bp-cyan)]"
            placeholder="6文字以上"
          />
        </label>

        {message && (
          <p
            className={`text-sm ${
              message.type === "error" ? "text-[var(--bp-danger)]" : "text-[var(--bp-green)]"
            }`}
          >
            {message.text}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary mt-1 py-2.5 text-sm">
          {loading ? "処理中…" : mode === "signin" ? "ログイン" : "登録する"}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMessage(null);
        }}
        className="mt-5 text-center text-sm text-[var(--bp-text-muted)] underline underline-offset-4 hover:text-[var(--bp-text)]"
      >
        {mode === "signin" ? "はじめての方はこちら（新規登録）" : "すでにアカウントをお持ちの方はこちら"}
      </button>
    </div>
  );
}
