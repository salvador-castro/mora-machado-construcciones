import type { Metadata } from "next";
import { Toaster } from "@/components/admin/ui/sonner";
import { TooltipProvider } from "@/components/admin/ui/tooltip";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="admin-theme flex min-h-dvh flex-1 flex-col">{children}</div>
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}
