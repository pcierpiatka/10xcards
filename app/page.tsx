import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase.server";

/**
 * Home page - redirects based on authentication state
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /login
 */
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
