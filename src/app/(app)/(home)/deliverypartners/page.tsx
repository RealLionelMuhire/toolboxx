import { Metadata } from "next";
import { DeliveryPartnersClient } from "./deliverypartners-client";

export const metadata: Metadata = {
  title: "Delivery Partners | Toolbay",
  description: "Browse all available delivery and logistics partners for fast and reliable shipping",
};

export default function DeliveryPartnersPage() {
  return <DeliveryPartnersClient />;
}
