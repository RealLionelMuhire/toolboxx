import { GlobalConfig } from "payload";
import { isSuperAdmin } from "../lib/access";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: ({ req: { user } }) => isSuperAdmin(user),
  },
  admin: {
    group: "Settings",
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  fields: [
    {
      name: "sponsoredProductInjectionRate",
      type: "number",
      defaultValue: 6,
      required: true,
      admin: {
        description: "The frequency of sponsored products in search results. E.g., '6' means 1 sponsored product is injected for every 6 organic products.",
      },
      min: 1,
      max: 50,
    },
    {
      name: "paymentMomoCode",
      type: "text",
      admin: {
        description: "The Mobile Money code (e.g. 078...) shown to users when they request a product sponsorship.",
      }
    }
  ],
};
