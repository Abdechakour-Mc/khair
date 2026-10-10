"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, sessionMaxAgeSeconds, signIn } from "@/core/admin";

export async function signInAction(formData: FormData): Promise<void> {
  const result = signIn(String(formData.get("password") ?? ""));

  if (!result.ok) {
    redirect(`/admin?problem=${result.reason}`);
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, result.session, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
  });

  redirect("/admin/tasks");
}

export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin");
}
