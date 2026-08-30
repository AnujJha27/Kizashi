import { AppShell } from "@/components/shell/app-shell";
import { requireAllowedUser } from "@/lib/auth/guard";

export default async function MainLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireAllowedUser();
  return <AppShell>{children}</AppShell>;
}
