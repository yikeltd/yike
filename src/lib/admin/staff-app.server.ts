import { cookies } from "next/headers";
import { STAFF_APP_COOKIE } from "@/lib/admin/staff-app";

export async function isStaffAppContext(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(STAFF_APP_COOKIE)?.value === "1";
}

export async function markStaffAppContext(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_APP_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
}

export async function clearStaffAppContext(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_APP_COOKIE);
}
