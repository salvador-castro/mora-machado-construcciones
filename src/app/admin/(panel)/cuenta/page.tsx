import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { AccountForm, ChangePasswordForm } from "@/components/admin/users/account-forms";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Mi cuenta" };
export const instant = false;

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle
        title="Mi cuenta"
        description={user.role === "ADMIN" ? "Rol: administrador" : "Rol: editor"}
      />
      <AccountForm
        key={`${user.name}|${user.email}`}
        initial={{ name: user.name, email: user.email }}
      />
      <ChangePasswordForm />
    </div>
  );
}
