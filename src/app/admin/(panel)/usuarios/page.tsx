import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { UsersManager } from "@/components/admin/users/users-manager";
import { timeAgo } from "@/lib/admin/labels";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Usuarios" };
export const instant = false;

export default async function UsersPage() {
  const me = await requireUser("ADMIN");
  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
      updatedAt: true,
    },
  });
  const now = new Date();
  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    lastLogin: u.lastLoginAt ? timeAgo(u.lastLoginAt, now) : null,
    isMe: u.id === me.id,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Usuarios"
        description="Los administradores pueden todo. Los editores no pueden gestionar usuarios ni borrar servicios."
      />
      <UsersManager key={users.map((u) => u.updatedAt.toISOString()).join()} rows={rows} />
    </div>
  );
}
