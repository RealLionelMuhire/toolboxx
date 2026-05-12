"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const StirrupSpacingCalculator = () => {
  const [dia, setDia] = useState("6");
  const [designShear, setDesignShear] = useState("948.48");
  const [legs, setLegs] = useState("1");

  const [results, setResults] = useState<{
    spacingMm: number;
    spacingCm: number;
    spacingInches: number;
  } | null>(null);

  const handleCalculate = () => {
    const d = parseFloat(dia) || 0;
    const l = parseFloat(legs) || 1;
    const shear = parseFloat(designShear) || 0;

    if (shear === 0) return;

    // Area of one leg = (pi / 4) * d^2
    const asv = l * (Math.PI / 4) * Math.pow(d, 2);
    
    // shear is given in mm²/m. We want spacing (Sv) in mm.
    // Sv (mm) = (Asv * 1000) / Shear(mm²/m)
    const spacingMm = (asv * 1000) / shear;

    setResults({
      spacingMm,
      spacingCm: spacingMm / 10,
      spacingInches: spacingMm / 25.4,
    });
  };

  const handleReset = () => {
    setDia("6");
    setDesignShear("948.48");
    setLegs("1");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Shear Reinforcement Details</CardTitle>
            <CardDescription>Enter the parameters to calculate the required spacing of stirrups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia. of Stirrups</Label>
                <Select value={dia} onValueChange={setDia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 mm</SelectItem>
                    <SelectItem value="8">8 mm</SelectItem>
                    <SelectItem value="10">10 mm</SelectItem>
                    <SelectItem value="12">12 mm</SelectItem>
                    <SelectItem value="16">16 mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. of legs</Label>
                <Select value={legs} onValueChange={setLegs}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 legged</SelectItem>
                    <SelectItem value="2">2 legged</SelectItem>
                    <SelectItem value="4">4 legged</SelectItem>
                    <SelectItem value="6">6 legged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 max-w-sm pt-2">
              <Label>Design Shear reinforcement (Asv/Sv)</Label>
              <div className="flex items-center gap-2">
                <Input value={designShear} onChange={(e) => setDesignShear(e.target.value)} type="number" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">mm²/meter</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate Spacing
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger>How is Stirrup Spacing Calculated?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>This calculator determines the required spacing for shear reinforcement (stirrups) in beams based on standard civil engineering formulas.</p>
              <ul className="list-decimal pl-5 space-y-2">
                <li><strong>Calculate Area of Steel (Asv):</strong> Using the formula <code>Area = No. of Legs × (π/4) × Diameter²</code>.</li>
                <li><strong>Calculate Spacing (Sv):</strong> You provide the Design Shear Reinforcement ratio (Asv/Sv) in mm² per meter. The calculator finds the spacing using: <code>Spacing (mm) = (Asv × 1000) / Design Shear Reinforcement</code>.</li>
                <li><strong>Result:</strong> Output is presented in millimeters, centimeters, and inches for comprehensive detailing.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Spacing of Stirrups required</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Spacing in mm</span>
                  <span className="font-bold text-lg text-primary">{results.spacingMm.toFixed(2)} mm</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Spacing in cm</span>
                  <span className="font-medium text-sm">{results.spacingCm.toFixed(2)} cm</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm">Spacing in inches</span>
                  <span className="font-medium text-sm">{results.spacingInches.toFixed(2)} in</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-git-commit-horizontal"><circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/></svg>
                </div>
                <p>Fill the form and click Calculate Spacing to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
