/**
 * Supabase Server Client
 *
 * Use this client in Server Components and Server Actions.
 * This client runs on the server and has access to cookies for session persistence.
 *
 * IMPORTANT: This function is async because cookies() in Next.js 15 is async.
 *
 * @example Server Component
 * import { createClient } from '@/lib/db/supabase.server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('flashcards').select('*')
 *   return <div>{data?.length} flashcards</div>
 * }
 *
 * @example Server Action
 * 'use server'
 * import { createClient } from '@/lib/db/supabase.server'
 *
 * export async function deleteFlashcard(id: string) {
 *   const supabase = await createClient()
 *   await supabase.from('flashcards').delete().eq('flashcard_id', id)
 * }
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Server Component can't set cookies directly
          // This is expected - middleware handles cookie setting
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", options);
        } catch {
          // Server Component can't remove cookies directly
        }
      },
    },
  });
}
