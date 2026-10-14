import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { Skeleton } from "@/components/admin/ui/skeleton";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

// Admin is per-request (session cookie); navigations are allowed to block.
export const instant = false;

async function Panel({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const newLeads = await db.lead.count({ where: { status: "NEW" } });
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} newLeads={newLeads}>
      {children}
    </AdminShell>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-64 border-r bg-card lg:block" />
      <div className="flex-1 space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Panel>{children}</Panel>
    </Suspense>
  );
}
