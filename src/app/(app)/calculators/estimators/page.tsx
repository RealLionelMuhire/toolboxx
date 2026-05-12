"use client";

import { useState } from "react";
import { BrickMasonryCalculator } from "@/modules/calculators/ui/components/brick-masonry-calculator";
import { BrickQuantityCalculator } from "@/modules/calculators/ui/components/brick-quantity-calculator";
import { ConcreteCalculator } from "@/modules/calculators/ui/components/concrete-calculator";
import { PlasterCalculator } from "@/modules/calculators/ui/components/plaster-calculator";
import { TileCalculator } from "@/modules/calculators/ui/components/tile-calculator";
import { TileCostCalculator } from "@/modules/calculators/ui/components/tile-cost-calculator";
import { StairGraniteCalculator } from "@/modules/calculators/ui/components/stair-granite-calculator";
import { SlabEstimateCalculator } from "@/modules/calculators/ui/components/slab-estimate-calculator";
import { TrapezoidalFootingCalculator } from "@/modules/calculators/ui/components/trapezoidal-footing-calculator";
import { DogLeggedStairCalculator } from "@/modules/calculators/ui/components/dog-legged-stair-calculator";
import { RoofSlabCalculator } from "@/modules/calculators/ui/components/roof-slab-calculator";
import { PaintingCostCalculator } from "@/modules/calculators/ui/components/painting-cost-calculator";
import { CompoundWallCalculator } from "@/modules/calculators/ui/components/compound-wall-calculator";
import { CarpetCalculator } from "@/modules/calculators/ui/components/carpet-calculator";
import { LabourCostCalculator } from "@/modules/calculators/ui/components/labour-cost-calculator";
import { ConcreteWeightCalculator } from "@/modules/calculators/ui/components/concrete-weight-calculator";
import { BaseboardCalculator } from "@/modules/calculators/ui/components/baseboard-calculator";
import { ConcreteBlockCalculator } from "@/modules/calculators/ui/components/concrete-block-calculator";
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
      case "stair-granite":
        return <StairGraniteCalculator />;
      case "slab":
        return <SlabEstimateCalculator />;
      case "trapezoidal-footing":
        return <TrapezoidalFootingCalculator />;
      case "dog-legged-stair":
        return <DogLeggedStairCalculator />;
      case "roof-slab":
        return <RoofSlabCalculator />;
      case "painting-cost":
        return <PaintingCostCalculator />;
      case "compound-wall":
        return <CompoundWallCalculator />;
      case "carpet":
        return <CarpetCalculator />;
      case "labour-cost":
        return <LabourCostCalculator />;
      case "concrete-weight":
        return <ConcreteWeightCalculator />;
      case "baseboard":
        return <BaseboardCalculator />;
      case "concrete-block":
        return <ConcreteBlockCalculator />;
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
                <SelectItem value="stair-granite">Stair Granite & Railing Cost</SelectItem>
                <SelectItem value="slab">Slab Estimate & Steel Details</SelectItem>
                <SelectItem value="trapezoidal-footing">Trapezoidal Footing Calculator</SelectItem>
                <SelectItem value="dog-legged-stair">Dog-Legged Stair Estimator</SelectItem>
                <SelectItem value="roof-slab">Roof Slab Materials & Cost</SelectItem>
                <SelectItem value="painting-cost">Painting Cost Estimator</SelectItem>
                <SelectItem value="compound-wall">Compound Wall Estimator</SelectItem>
                <SelectItem value="carpet">Carpet Cost Estimator</SelectItem>
                <SelectItem value="labour-cost">Labour Cost Calculator</SelectItem>
                <SelectItem value="concrete-weight">Concrete Weight Calculator</SelectItem>
                <SelectItem value="baseboard">Baseboard Cost Calculator</SelectItem>
                <SelectItem value="concrete-block">Concrete Block Calculator</SelectItem>
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
