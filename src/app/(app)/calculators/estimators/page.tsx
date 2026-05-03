"use client";

import { useState } from "react";
import { BrickMasonryCalculator } from "@/modules/calculators/ui/components/brick-masonry-calculator";
import { BrickQuantityCalculator } from "@/modules/calculators/ui/components/brick-quantity-calculator";
import { ConcreteCalculator } from "@/modules/calculators/ui/components/concrete-calculator";
import { PlasterCalculator } from "@/modules/calculators/ui/components/plaster-calculator";
import { TileCalculator } from "@/modules/calculators/ui/components/tile-calculator";
import { TileCostCalculator } from "@/modules/calculators/ui/components/tile-cost-calculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";

export default function EstimatorsPage() {
  const [activeCalc, setActiveCalc] = useState("concrete");

  const renderCalculator = () => {
    switch (activeCalc) {
      case "concrete":
        return <ConcreteCalculator />;
      case "brick-quantity":
        return <BrickQuantityCalculator />;
      case "brick-masonry":
        return <BrickMasonryCalculator />;
      case "plaster":
        return <PlasterCalculator />;
      case "tile":
        return <TileCalculator />;
      case "tile-cost":
        return <TileCostCalculator />;
      default:
        return <ConcreteCalculator />;
    }
  };

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-64px)] pb-12 pt-8 lg:pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              Engineering Estimators
            </h1>
            <p className="text-muted-foreground mt-2">
              Estimate materials accurately for your construction projects.
            </p>
          </div>
          
          <div className="w-full md:w-[300px]">
            <Select value={activeCalc} onValueChange={setActiveCalc}>
              <SelectTrigger className="w-full bg-background font-medium text-primary border-primary/20 shadow-sm">
                <SelectValue placeholder="Select a calculator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concrete">Concrete Volume</SelectItem>
                <SelectItem value="brick-quantity">Brick Quantity (with Mortar)</SelectItem>
                <SelectItem value="brick-masonry">Brick Masonry Estimator</SelectItem>
                <SelectItem value="plaster">Plaster Materials</SelectItem>
                <SelectItem value="tile">Tile Square Footage</SelectItem>
                <SelectItem value="tile-cost">Tile/Marble Cost for Rooms</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderCalculator()}
        </div>
      </div>
    </div>
  );
}
