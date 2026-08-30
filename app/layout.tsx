import type { Metadata, Viewport } from "next";

import "./globals.css";
import { ServiceWorker } from "@/components/shell/service-worker";

export const metadata: Metadata = {
  title: { default: "Kizashi · Japanese, one step at a time", template: "%s · Kizashi" },
  description: "A calm, structured path through Japanese.",
  applicationName: "Kizashi",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
