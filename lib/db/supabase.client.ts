/**
 * Supabase Browser Client
 *
 * Use this client in Client Components (components with 'use client' directive).
 * This client runs in the browser and has access to localStorage for session persistence.
 *
 * @example
 * 'use client'
 * import { createClient } from '@/lib/db/supabase.client'
 *
 * const supabase = createClient()
 * const { data } = await supabase.from('flashcards').select('*')
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        // Read cookie from document.cookie
        const cookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${name}=`));
        return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
      },
      set(name, value, options) {
        // Write cookie to document.cookie
        document.cookie = `${name}=${encodeURIComponent(value)}; path=${options.path || "/"}; max-age=${options.maxAge || 31536000}; SameSite=${options.sameSite || "Lax"}${options.secure ? "; Secure" : ""}`;
      },
      remove(name, options) {
        // Remove cookie by setting max-age=0
        document.cookie = `${name}=; path=${options.path || "/"}; max-age=0`;
      },
    },
  });
}
