import { AppShell } from "@/components/shell/app-shell";
import { requireAllowedUser } from "@/lib/auth/guard";

export default async function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAllowedUser();
  return <AppShell isAdmin={user.isAdmin}>{children}</AppShell>;
}
