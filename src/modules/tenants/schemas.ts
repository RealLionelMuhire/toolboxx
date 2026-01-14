import { z } from "zod";

// Safe File check for server-side rendering
const FileType = typeof File !== 'undefined' ? File : class File {};

export const uploadDocumentsSchema = z.object({
  rdbCertificate: z.instanceof(FileType as any, { message: "RDB Certificate is required" }),
});

export const verifyTenantSchema = z.object({
  tenantId: z.string(),
  verificationStatus: z.enum(["document_verified", "physically_verified", "rejected"]),
  verificationNotes: z.string().optional(),
  canAddMerchants: z.boolean().optional(),
});

export const physicalVerificationSchema = z.object({
  tenantId: z.string(),
  verificationImages: z.array(z.instanceof(FileType as any)).min(3).max(8),
  signedConsent: z.instanceof(FileType as any),
  verificationNotes: z.string().optional(),
});
