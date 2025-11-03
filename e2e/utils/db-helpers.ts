import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
}

/**
 * Admin Supabase client for test cleanup
 * Uses service role key to bypass RLS policies
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Delete test user by email (cleanup after test)
 * @param email - Email of the user to delete
 * @returns Promise<void>
 */
export async function deleteTestUser(email: string): Promise<void> {
  try {
    // List all users (admin only)
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = data?.users?.find(
      (u: { email?: string }) => u.email === email
    );

    if (testUser) {
      // Delete user (cascades to related data)
      await supabaseAdmin.auth.admin.deleteUser(testUser.id);
      console.log(`✓ Deleted test user: ${email}`);
    } else {
      console.log(`ℹ Test user not found: ${email} (may have been deleted)`);
    }
  } catch (error) {
    console.error(`✗ Failed to delete test user: ${email}`, error);
    // Don't throw - cleanup should not fail tests
  }
}

/**
 * Delete multiple test users by email pattern
 * Useful for bulk cleanup in beforeAll/afterAll hooks
 * @param emailPattern - Regex pattern to match emails (e.g., /^test-.*@example\.com$/)
 */
export async function deleteTestUsersByPattern(
  emailPattern: RegExp
): Promise<void> {
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const testUsers = data?.users?.filter((u: { email?: string }) =>
      emailPattern.test(u.email ?? "")
    );

    if (testUsers && testUsers.length > 0) {
      console.log(`Found ${testUsers.length} test users to delete`);
      await Promise.all(
        testUsers.map((user) => supabaseAdmin.auth.admin.deleteUser(user.id))
      );
      console.log(`✓ Deleted ${testUsers.length} test users`);
    } else {
      console.log("ℹ No test users found matching pattern");
    }
  } catch (error) {
    console.error("✗ Failed to delete test users by pattern", error);
  }
}
