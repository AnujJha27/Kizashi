import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/env";
import { fetchWithTimeout } from "@/lib/request-timeout.js";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createBrowserClient(config.url, config.anonKey, { global: { fetch: fetchWithTimeout } });
}
