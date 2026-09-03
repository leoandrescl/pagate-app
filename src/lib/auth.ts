import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { studioHref } from "@/lib/urls";
import { redirect } from "next/navigation";

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect(studioHref("/login"));
  }
  return user;
}

export function displayNameFromUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.given_name === "string" && meta.given_name) ||
    "";
  if (name.trim()) return name.trim();
  const email = user.email ?? "";
  return email.split("@")[0] || "";
}
