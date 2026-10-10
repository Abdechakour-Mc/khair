import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionIsValid } from "@/core/admin";

export async function hasAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return sessionIsValid(jar.get(ADMIN_COOKIE)?.value);
}

/** Every Admin page calls this first. Nothing is rendered without a session. */
export async function requireAdminSession(): Promise<void> {
  if (!(await hasAdminSession())) redirect("/admin");
}
