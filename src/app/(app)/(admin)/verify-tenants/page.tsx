import { redirect } from "next/navigation";

import { caller } from "@/trpc/server";
import { isSuperAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

const VerifyTenantsPage = async () => {
  const session = await caller.auth.session();

  if (!session.user || !isSuperAdmin(session.user)) {
    redirect("/");
  }

  try {
    const pendingTenants = await caller.tenants.getPendingTenants();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Tenant Verification</h1>
            <p className="text-gray-600 mt-2">
              Review and verify tenant documents
            </p>
          </div>

          <div className="space-y-6">
            {pendingTenants.docs.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No Pending Verifications</h3>
                <p className="text-gray-500">All tenants are up to date with their verification status.</p>
              </div>
            ) : (
              pendingTenants.docs.map((tenant) => (
                <div key={tenant.id} className="bg-white border rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Tenant Info */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4">{tenant.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Slug:</strong> {tenant.slug}</div>
                        <div><strong>TIN Number:</strong> {tenant.tinNumber}</div>
                        <div><strong>Manager ID:</strong> {tenant.storeManagerId}</div>
                        <div><strong>Payment Method:</strong> {tenant.paymentMethod?.replace('_', ' ')}</div>
                        {tenant.paymentMethod === 'bank_transfer' && (
                          <>
                            <div><strong>Bank:</strong> {tenant.bankName}</div>
                            <div><strong>Account:</strong> {tenant.bankAccountNumber}</div>
                          </>
                        )}
                        {tenant.paymentMethod === 'momo_pay' && (
                          <div><strong>MOMO Code:</strong> {tenant.momoPayCode}</div>
                        )}
                        <div><strong>Created:</strong> {new Date(tenant.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Documents & Actions */}
                    <div>
                      <h4 className="font-medium mb-3">Documents</h4>
                      {tenant.rdbCertificate ? (
                        <div className="mb-4">
                          <p className="text-sm text-green-600 mb-2">✓ RDB Certificate uploaded</p>
                          {typeof tenant.rdbCertificate === 'object' && tenant.rdbCertificate?.url && (
                            <a 
                              href={tenant.rdbCertificate.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View Certificate
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-red-600 mb-4">✗ No RDB Certificate</p>
                      )}

                      {/* Admin Actions - These would need to be implemented with forms */}
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                          Admin actions would be implemented here with forms to verify/reject tenants.
                          For now, use the admin panel at /admin/collections/tenants
                        </p>
                        <a 
                          href={`/admin/collections/tenants/${tenant.id}`}
                          className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Edit in Admin Panel
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading pending tenants:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Tenants</h1>
          <p className="text-gray-600">
            There was an error loading the pending tenants. Please try again later.
          </p>
        </div>
      </div>
    );
  }
};

export default VerifyTenantsPage;
