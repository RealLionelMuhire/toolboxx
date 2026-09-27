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

// Store details a seller can edit themselves. Slug, TIN, verification and
// category stay admin-managed.
export const updateMyStoreSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Store name must be at least 3 characters")
    .max(100, "Store name must be less than 100 characters"),
  imageId: z.string().nullable().optional(),
  contactPhone: z
    .string()
    .trim()
    .regex(/^\+\d{10,15}$/, "Phone number must start with + and contain 10-15 digits (e.g., +250788888888)"),
  locationCountry: z.enum(["RW", "UG", "TZ"], { required_error: "Country is required" }),
  locationProvince: z.string().min(1, "Province/Region is required"),
  locationDistrict: z.string().min(1, "District is required"),
  locationCityOrArea: z.string().trim().min(1, "City or area is required"),
  currency: z.enum(["USD", "RWF", "UGX", "TZS", "BIF", "KSH"]),
  paymentMethod: z.enum(["bank_transfer", "momo_pay"]),
  bankName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  momoProviderName: z.string().trim().optional(),
  momoAccountName: z.string().trim().optional(),
  momoCode: z.string().trim().regex(/^\d*$/, "MoMo code must be a number").optional(),
}).refine((data) => {
  if (data.paymentMethod === "bank_transfer") {
    return !!data.bankName && !!data.bankAccountNumber;
  }
  return !!data.momoCode && !!data.momoProviderName && !!data.momoAccountName;
}, {
  message: "Payment method details are required",
  path: ["paymentMethod"],
});
