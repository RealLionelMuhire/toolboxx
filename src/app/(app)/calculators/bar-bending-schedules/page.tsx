"use client";

import { useState } from "react";
import { StirrupSpacingCalculator } from "@/modules/calculators/ui/components/bbs/stirrup-spacing-calculator";
import { FootingBBSCalculator } from "@/modules/calculators/ui/components/bbs/footing-bbs-calculator";
import { CrankBeamCalculator } from "@/modules/calculators/ui/components/bbs/crank-beam-calculator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler } from "lucide-react";

export default function BBSPage() {
  const [activeCalc, setActiveCalc] = useState("stirrup-spacing");

  const renderCalculator = () => {
    switch (activeCalc) {
      case "stirrup-spacing":
        return <StirrupSpacingCalculator />;
      case "footing-bbs":
        return <FootingBBSCalculator />;
      case "crank-beam":
        return <CrankBeamCalculator />;
      case "placeholder":
        return (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3 bg-card border rounded-lg shadow-sm">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
              <Ruler className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium text-foreground mt-4">Select a Bar Bending Schedule</h3>
            <p>Please select a BBS calculator from the dropdown above to begin estimating steel requirements.</p>
          </div>
        );
      default:
        return <StirrupSpacingCalculator />;
    }
  };

  return (
    <div className="bg-muted/30 min-h-[calc(100vh-64px)] pb-12 pt-8 lg:pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Ruler className="h-8 w-8 text-primary" />
              Bar Bending Schedules (BBS)
            </h1>
            <p className="text-muted-foreground mt-2">
              Calculate exact cutting lengths, total weight, and bending details for steel reinforcement.
            </p>
          </div>
          
          <div className="w-full md:w-[300px]">
            <Select value={activeCalc} onValueChange={setActiveCalc}>
              <SelectTrigger className="w-full bg-background font-medium text-primary border-primary/20 shadow-sm">
                <SelectValue placeholder="Select a BBS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stirrup-spacing">Stirrup Spacing in Beam</SelectItem>
                <SelectItem value="footing-bbs">BBS of Footing</SelectItem>
                <SelectItem value="crank-beam">BBS of Crank Beam</SelectItem>
                <SelectItem value="placeholder">More coming soon...</SelectItem>
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
