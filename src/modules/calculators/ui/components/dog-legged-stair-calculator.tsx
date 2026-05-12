"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Unit conversion helper to meters
const toMeter = (value: number, unit: string) => {
  if (isNaN(value)) return 0;
  switch (unit) {
    case "Feet": return value * 0.3048;
    case "Inch": return value * 0.0254;
    case "mm": return value / 1000;
    case "m": return value;
    default: return value;
  }
};

export const DogLeggedStairCalculator = () => {
  // 1) Steps Details
  const [riser, setRiser] = useState("6");
  const [riserUnit, setRiserUnit] = useState("Inch");
  const [tread, setTread] = useState("10");
  const [treadUnit, setTreadUnit] = useState("Inch");
  const [stairWidth, setStairWidth] = useState("4");
  const [stairWidthUnit, setStairWidthUnit] = useState("Feet");
  const [numSteps, setNumSteps] = useState("18");

  // 2) Waist Slab Details
  const [waistLength, setWaistLength] = useState("10");
  const [waistLengthUnit, setWaistLengthUnit] = useState("Feet");
  const [waistThickness, setWaistThickness] = useState("6");
  const [waistThicknessUnit, setWaistThicknessUnit] = useState("Inch");
  const [numWaistSlabs, setNumWaistSlabs] = useState("2");

  // 3) Landing Details
  const [landingWidth, setLandingWidth] = useState("4");
  const [landingWidthUnit, setLandingWidthUnit] = useState("Feet");
  const [landingLength, setLandingLength] = useState("8");
  const [landingLengthUnit, setLandingLengthUnit] = useState("Feet");
  const [numLandings, setNumLandings] = useState("1");

  // 4) Mix Ratio & Extras
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("2");
  const [aggRatio, setAggRatio] = useState("3");
  const [steelPercent, setSteelPercent] = useState("3");

  // Factor
  const [dryFactor, setDryFactor] = useState("1.54");

  // Results
  const [results, setResults] = useState<{
    wetVolume: number;
    dryVolume: number;
    cementVol: number;
    sandVol: number;
    aggVol: number;
    cementWeight: number;
    cementBags: number;
    steelWeight: number;
  } | null>(null);

  const handleCalculate = () => {
    // 1. Steps Volume
    const riserM = toMeter(parseFloat(riser), riserUnit);
    const treadM = toMeter(parseFloat(tread), treadUnit);
    const stairWidthM = toMeter(parseFloat(stairWidth), stairWidthUnit);
    const nSteps = parseFloat(numSteps) || 0;
    
    // Step is a triangle
    const stepVol = 0.5 * riserM * treadM * stairWidthM;
    const totalStepsVol = stepVol * nSteps;

    // 2. Waist Slab Volume
    const waistLengthM = toMeter(parseFloat(waistLength), waistLengthUnit);
    const waistThickM = toMeter(parseFloat(waistThickness), waistThicknessUnit);
    const nWaistSlabs = parseFloat(numWaistSlabs) || 0;
    
    // Width of waist slab is same as stair width
    const totalWaistVol = waistLengthM * stairWidthM * waistThickM * nWaistSlabs;

    // 3. Landing Volume
    const landingWidthM = toMeter(parseFloat(landingWidth), landingWidthUnit);
    const landingLengthM = toMeter(parseFloat(landingLength), landingLengthUnit);
    const nLandings = parseFloat(numLandings) || 0;
    
    // Thickness of landing typically matches waist slab thickness
    const totalLandingVol = landingWidthM * landingLengthM * waistThickM * nLandings;

    // Total Volume
    const wetVolume = totalStepsVol + totalWaistVol + totalLandingVol;
    const dryVolume = wetVolume * (parseFloat(dryFactor) || 1.54);

    // Mix Ratios
    const cR = parseFloat(cementRatio) || 1;
    const sR = parseFloat(sandRatio) || 2;
    const aR = parseFloat(aggRatio) || 3;
    const totalR = cR + sR + aR;

    let cementVol = 0;
    let sandVol = 0;
    let aggVol = 0;

    if (totalR > 0) {
      cementVol = dryVolume * (cR / totalR);
      sandVol = dryVolume * (sR / totalR);
      aggVol = dryVolume * (aR / totalR);
    }

    const cementWeight = cementVol * 1440; // kg
    const cementBags = cementWeight / 50;

    const steelPct = parseFloat(steelPercent) || 0;
    const steelWeight = wetVolume * (steelPct / 100) * 7850;

    setResults({
      wetVolume,
      dryVolume,
      cementVol,
      sandVol,
      aggVol,
      cementWeight,
      cementBags,
      steelWeight,
    });
  };

  const handleReset = () => {
    setRiser("6"); setRiserUnit("Inch");
    setTread("10"); setTreadUnit("Inch");
    setStairWidth("4"); setStairWidthUnit("Feet");
    setNumSteps("18");
    setWaistLength("10"); setWaistLengthUnit("Feet");
    setWaistThickness("6"); setWaistThicknessUnit("Inch");
    setNumWaistSlabs("2");
    setLandingWidth("4"); setLandingWidthUnit("Feet");
    setLandingLength("8"); setLandingLengthUnit("Feet");
    setNumLandings("1");
    setCementRatio("1");
    setSandRatio("2");
    setAggRatio("3");
    setSteelPercent("3");
    setDryFactor("1.54");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) Details of Stair Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Riser (a)</Label>
                <div className="flex gap-2">
                  <Input value={riser} onChange={(e) => setRiser(e.target.value)} type="number" />
                  <Select value={riserUnit} onValueChange={setRiserUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tread (b)</Label>
                <div className="flex gap-2">
                  <Input value={tread} onChange={(e) => setTread(e.target.value)} type="number" />
                  <Select value={treadUnit} onValueChange={setTreadUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Width of stair (c)</Label>
                <div className="flex gap-2">
                  <Input value={stairWidth} onChange={(e) => setStairWidth(e.target.value)} type="number" />
                  <Select value={stairWidthUnit} onValueChange={setStairWidthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 max-w-[200px]">
                <Label>No. of Steps (d)</Label>
                <Input value={numSteps} onChange={(e) => setNumSteps(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Details of Waist Slab</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Length of waist slab (e)</Label>
                <div className="flex gap-2">
                  <Input value={waistLength} onChange={(e) => setWaistLength(e.target.value)} type="number" />
                  <Select value={waistLengthUnit} onValueChange={setWaistLengthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Thickness of waist slab (f)</Label>
                <div className="flex gap-2">
                  <Input value={waistThickness} onChange={(e) => setWaistThickness(e.target.value)} type="number" />
                  <Select value={waistThicknessUnit} onValueChange={setWaistThicknessUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 max-w-[200px]">
                <Label>Number of waist slabs (g)</Label>
                <Input value={numWaistSlabs} onChange={(e) => setNumWaistSlabs(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3) Details of Landing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width of landing (h)</Label>
                <div className="flex gap-2">
                  <Input value={landingWidth} onChange={(e) => setLandingWidth(e.target.value)} type="number" />
                  <Select value={landingWidthUnit} onValueChange={setLandingWidthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Length of Landing (i)</Label>
                <div className="flex gap-2">
                  <Input value={landingLength} onChange={(e) => setLandingLength(e.target.value)} type="number" />
                  <Select value={landingLengthUnit} onValueChange={setLandingLengthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 max-w-[200px]">
                <Label>Number of Landings (j)</Label>
                <Input value={numLandings} onChange={(e) => setNumLandings(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4) Concrete Mix & Reinforcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Cement Ratio</Label>
                <Input value={cementRatio} onChange={(e) => setCementRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Sand Ratio</Label>
                <Input value={sandRatio} onChange={(e) => setSandRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Aggregate Ratio</Label>
                <Input value={aggRatio} onChange={(e) => setAggRatio(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Percentage of Steel (%)</Label>
                <Input value={steelPercent} onChange={(e) => setSteelPercent(e.target.value)} type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label>Dry Vol Factor</Label>
                <Input value={dryFactor} onChange={(e) => setDryFactor(e.target.value)} type="number" step="0.01" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate Estimate
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger>About Stair Estimator</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>This Calculator calculates the volume of cement, sand, and aggregate, the weight of steel rod according to percentage, Numbers of bags of cement required to construct an RCC Dog-Legged Stair.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Put the dimension of stair you want to construct like steps size, waist slab size, and landing dimensions.</li>
                <li>Put the ratio of cement, sand and aggregate you want to use for concrete (e.g. 1:2:4, 1:1.5:3).</li>
                <li>Put the percentage (%) of steel rod used in concrete. Normally 2% to 6%.</li>
                <li>Press Calculate button.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="data">
            <AccordionTrigger>Standard Data used in this Calculator</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li>Added 54% extra Concrete to convert wet volume into dry volume.</li>
                <li>Density of cement = 1440 Kg/m³</li>
                <li>Density of Steel rod = 7850 Kg/m³</li>
                <li>1 Bags of cement = 50 Kg</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Dog-Legged Stair Details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Wet Vol Concrete</span>
                  <span className="font-medium text-sm">{results.wetVolume.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Dry Vol Concrete</span>
                  <span className="font-medium text-sm">{results.dryVolume.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Volume Of Cement</span>
                  <span className="font-medium text-sm">{results.cementVol.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Volume Of Sand</span>
                  <span className="font-medium text-sm">{results.sandVol.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Vol Of Aggregate</span>
                  <span className="font-medium text-sm">{results.aggVol.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Weight Of Cement</span>
                  <span className="font-medium text-sm">{results.cementWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Bags Of Cement</span>
                  <span className="font-bold text-sm text-primary">{results.cementBags.toFixed(2)} Bags</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm">Weight of Steel</span>
                  <span className="font-bold text-sm text-primary">{results.steelWeight.toFixed(2)} kg</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
                </div>
                <p>Fill the form and click Calculate to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
