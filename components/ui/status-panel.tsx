export function StatusPanel({
  eyebrow,
  title,
  description,
  tone = "quiet",
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  tone?: "quiet" | "error";
}>) {
  return (
    <section className={`surface-panel p-6 sm:p-8 ${tone === "error" ? "border-[#713b37]" : ""}`} role={tone === "error" ? "alert" : undefined}>
      <p className={`eyebrow mb-3 ${tone === "error" ? "text-[#e34a3f]" : ""}`}>{eyebrow}</p>
      <h2 className="text-lg font-medium text-[#f5f5f2]">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[#9297a1]">{description}</p>
    </section>
  );
}
