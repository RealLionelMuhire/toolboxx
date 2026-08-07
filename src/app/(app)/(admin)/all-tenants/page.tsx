import { redirect } from "next/navigation";
import { caller } from "@/trpc/server";
import { isSuperAdmin } from "@/lib/access";
import { AdminInsightsView } from "@/modules/admin/ui/views/admin-insights-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Platform Analytics | Toolbay Admin",
  description: "Cross-tenant visitor and sales analytics for super admins",
};

export default async function AllTenantsPage() {
  const session = await caller.auth.session();

  if (!session.user || !isSuperAdmin(session.user)) {
    redirect("/");
  }

  return <AdminInsightsView />;
}
