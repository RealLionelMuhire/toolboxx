"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Phone, MapPin, Truck, CheckCircle, AlertCircle, Search } from "lucide-react";

export function DeliveryPartnersClient() {
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: partners, isLoading } = useQuery(
    trpc.tenants.getLogisticsProviders.queryOptions({
      query: searchQuery,
      limit: 100,
      includeUnverified: true,
    })
  );

  const filteredPartners = partners || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Delivery Partners</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse all available logistics providers and delivery services to ensure your orders arrive safely and on time
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto w-full">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or coverage area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading logistics providers...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPartners.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {searchQuery
                ? `No delivery partners found matching "${searchQuery}". Try a different search.`
                : "No delivery partners available at the moment. Please check back soon!"}
            </AlertDescription>
          </Alert>
        )}

        {/* Partners Grid */}
        {!isLoading && filteredPartners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner: any) => (
              <Card key={partner.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{partner.name}</CardTitle>
                      <CardDescription className="mt-1">{partner.slug}</CardDescription>
                    </div>
                    {partner.isVerified ? (
                      <Badge
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="whitespace-nowrap"
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Services */}
                  {partner.logisticsServices && partner.logisticsServices.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Services
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {partner.logisticsServices.map((service: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service.service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coverage Areas */}
                  {partner.logisticsCoverageAreas && partner.logisticsCoverageAreas.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Coverage Areas
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {partner.logisticsCoverageAreas.map((area: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {area.area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  {partner.logisticsDetails && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Details</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {partner.logisticsDetails}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="border-t pt-3 space-y-2">
                    {partner.logisticsContactPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-primary" />
                        <a
                          href={`tel:${partner.logisticsContactPhone}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {partner.logisticsContactPhone}
                        </a>
                      </div>
                    )}

                    {partner.logisticsContactEmail && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-4 w-4 text-primary">✉️</span>
                        <a
                          href={`mailto:${partner.logisticsContactEmail}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {partner.logisticsContactEmail}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <Button
                    className="w-full mt-2"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/tenants/${partner.slug}`}>
                      View Full Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              About Our Delivery Partners
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              ✓ All delivery partners shown here are registered on our platform and ready to help transport your orders.
            </p>
            <p>
              ✓ You can select a delivery partner during checkout, or let the seller choose one during payment verification.
            </p>
            <p>
              ✓ Verified partners have completed our verification process and are trusted by our community.
            </p>
            <p>
              ✓ Click "View Full Profile" to see more details about any delivery partner.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
