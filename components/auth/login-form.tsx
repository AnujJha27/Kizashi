"use client";

import { FormEvent, useState } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      window.location.assign("/journey");
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setPending(false);
    setMessage(error ? error.message : "Check your inbox for a magic link.");
  }

  if (!isSupabaseConfigured()) {
    return <div className="rounded-2xl border border-[#3f3427] bg-[#211d18] p-5"><p className="text-sm text-[#e5b85c]">Your path is ready.</p><p className="mt-2 text-sm leading-6 text-[#9297a1]">This preview runs locally. Configure Supabase when you want private sign-in and account sync.</p><a href="/journey" className="mt-5 inline-flex rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d]">Continue to Kizashi</a></div>;
  }

  return <form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-medium text-[#9297a1]">Allowed email</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full rounded-xl border border-[#292b31] bg-[#17181d] px-4 py-3 text-sm text-[#f5f5f2] placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" /></label>{message ? <p className="text-sm text-[#e5b85c]" role="status">{message}</p> : null}<button disabled={pending} className="w-full rounded-xl bg-[#e34a3f] px-4 py-3.5 text-sm font-semibold text-[#0b0b0d] disabled:cursor-wait disabled:opacity-60">{pending ? "Sending…" : "Send magic link"}</button></form>;
}
