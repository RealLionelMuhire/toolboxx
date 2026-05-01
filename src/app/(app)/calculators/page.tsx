import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrickMasonryCalculator } from "@/modules/calculators/ui/components/brick-masonry-calculator";
import { BrickQuantityCalculator } from "@/modules/calculators/ui/components/brick-quantity-calculator";
import { ConcreteCalculator } from "@/modules/calculators/ui/components/concrete-calculator";

export const metadata: Metadata = {
  title: "Calculators | ToolBay",
  description: "Engineering and construction calculators for quick material estimation.",
};

export default function CalculatorsPage() {
  return (
    <div className="bg-muted/30 min-h-[calc(100vh-64px)] pb-12 pt-8 lg:pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Engineering Calculators</h1>
          <p className="text-muted-foreground mt-2">
            Estimate materials accurately for your construction projects.
          </p>
        </div>

        <Tabs defaultValue="concrete" className="w-full">
          <TabsList className="mb-6 h-auto p-1 bg-muted/50 border w-full flex-wrap justify-start">
            <TabsTrigger value="concrete" className="py-2.5 px-4 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium">
              Concrete Volume
            </TabsTrigger>
            <TabsTrigger value="brick-quantity" className="py-2.5 px-4 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium">
              Brick Quantity (with Mortar)
            </TabsTrigger>
            <TabsTrigger value="brick-masonry" className="py-2.5 px-4 rounded-sm data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium">
              Brick Masonry Estimator
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="concrete" className="mt-0 outline-none">
            <ConcreteCalculator />
          </TabsContent>
          <TabsContent value="brick-quantity" className="mt-0 outline-none">
            <BrickQuantityCalculator />
          </TabsContent>
          <TabsContent value="brick-masonry" className="mt-0 outline-none">
            <BrickMasonryCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
