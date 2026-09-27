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
      defaultValue: 4,
      required: true,
      admin: {
        description: "How often sponsored products appear in every product listing: one at the top, then one after every N products. E.g. '4' means a sponsored product after every 4 products.",
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
