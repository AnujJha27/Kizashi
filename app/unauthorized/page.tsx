import Link from "next/link";

export const metadata = { title: "Unauthorized" };

export default function UnauthorizedPage() {
  return <main className="grid min-h-screen place-items-center bg-[#0b0b0d] px-6 text-center"><div className="max-w-md"><p className="eyebrow text-[#e34a3f]">Private path</p><h1 className="jp-serif mt-4 text-4xl">This account is not on the list.</h1><p className="mt-4 text-sm leading-7 text-[#9297a1]">Kizashi is configured for one allowed email address. Sign out and try the configured account.</p><Link href="/login" className="mt-7 inline-flex rounded-xl border border-[#5d3936] px-4 py-3 text-sm text-[#f5f5f2] hover:border-[#e34a3f]">Return to sign in</Link></div></main>;
}
