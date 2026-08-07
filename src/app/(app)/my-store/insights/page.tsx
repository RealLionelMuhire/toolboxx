import { redirect } from "next/navigation";
import { caller } from "@/trpc/server";
import { isSuperAdmin } from "@/lib/access";
import { TenantInsightsView } from "@/modules/tenants/ui/views/tenant-insights-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store Insights | Toolbay",
  description: "View visitor analytics and performance data for your store",
};

export default async function MyStoreInsightsPage() {
  const session = await caller.auth.session();

  if (!session.user) {
    redirect("/sign-in");
  }

  // Super admin should go to the admin insights page instead
  if (isSuperAdmin(session.user)) {
    redirect("/all-tenants");
  }

  // Must be a tenant
  const isTenant = session.user.roles?.includes("tenant");
  if (!isTenant) {
    redirect("/dashboard");
  }

  return <TenantInsightsView />;
}
