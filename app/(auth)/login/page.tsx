import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return <main className="grid min-h-screen place-items-center bg-[#0b0b0d] px-5 py-10"><div className="w-full max-w-md"><div className="mb-10 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#e34a3f] font-bold text-[#0b0b0d]">道</div><div><p className="text-sm font-semibold tracking-[.2em]">KIZASHI</p><p className="text-[10px] uppercase tracking-[.18em] text-[#676c75]">your path</p></div></div><section className="surface-panel p-7 sm:p-9"><p className="eyebrow mb-4">Welcome back</p><h1 className="jp-serif text-4xl">旅はここから。</h1><p className="mt-4 text-sm leading-7 text-[#9297a1]">A private Japanese-learning path, built for one steady learner.</p><div className="mt-8"><LoginForm /></div></section><p className="mt-5 text-center text-xs text-[#676c75]">No public signup · private single-user access</p></div></main>;
}
