"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const SlabEstimateCalculator = () => {
  // A. Slab Dimension
  const [length, setLength] = useState("5"); // meters
  const [width, setWidth] = useState("3"); // meters
  const [thickness, setThickness] = useState("200"); // mm

  // B. Reinforcement Detail - Top Mesh
  const [topDiaA, setTopDiaA] = useState("10"); // mm
  const [topSpacingA, setTopSpacingA] = useState("110"); // mm
  const [topDiaB, setTopDiaB] = useState("12"); // mm
  const [topSpacingB, setTopSpacingB] = useState("110"); // mm

  // B. Reinforcement Detail - Bottom Mesh
  const [botDiaA, setBotDiaA] = useState("10"); // mm
  const [botSpacingA, setBotSpacingA] = useState("110"); // mm
  const [botDiaB, setBotDiaB] = useState("12"); // mm
  const [botSpacingB, setBotSpacingB] = useState("110"); // mm

  const [extraRebar, setExtraRebar] = useState("5"); // %

  // C. Concrete Mix Detail
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("2");
  const [aggRatio, setAggRatio] = useState("3");
  const [dryFactor, setDryFactor] = useState("1.54");
  const [clearCover, setClearCover] = useState("25"); // mm

  // Results
  const [results, setResults] = useState<{
    wetVolume: number;
    dryVolume: number;
    numRebarA: number; // For bottom mesh display
    cuttingLengthA: number;
    numRebarB: number; // For bottom mesh display
    cuttingLengthB: number;
    sandVolume: number;
    aggVolume: number;
    cementWeight: number;
    cementBags: number;
    totalRebarWeight: number;
  } | null>(null);

  const handleCalculate = () => {
    // 1. Concrete Volumes
    const L = parseFloat(length) || 0; // m
    const W = parseFloat(width) || 0; // m
    const T = (parseFloat(thickness) || 0) / 1000; // m

    const wetVolume = L * W * T;
    const dryVolume = wetVolume * (parseFloat(dryFactor) || 1.54);

    // 2. Concrete Mix Calculations
    const cRatio = parseFloat(cementRatio) || 1;
    const sRatio = parseFloat(sandRatio) || 2;
    const aRatio = parseFloat(aggRatio) || 3;
    const totalRatio = cRatio + sRatio + aRatio;

    const cementVol = dryVolume * (cRatio / totalRatio);
    const sandVolume = dryVolume * (sRatio / totalRatio);
    const aggVolume = dryVolume * (aRatio / totalRatio);

    const cementWeight = cementVol * 1440; // kg
    const cementBags = cementWeight / 50;

    // 3. Steel Calculations
    const coverM = (parseFloat(clearCover) || 0) / 1000;

    // A-A direction bars run along Length (A-A), so they are distributed along Width (B-B)
    const spanA = Math.max(0, L - 2 * coverM); // Cutting length for A-A bars
    const distB = Math.max(0, W - 2 * coverM); // Distribution length for A-A bars

    // B-B direction bars run along Width (B-B), so they are distributed along Length (A-A)
    const spanB = Math.max(0, W - 2 * coverM); // Cutting length for B-B bars
    const distA = Math.max(0, L - 2 * coverM); // Distribution length for B-B bars

    const calcMeshWeight = (diaA: string, spcA: string, diaB: string, spcB: string) => {
      const dA = parseFloat(diaA) || 0;
      const sA = (parseFloat(spcA) || 1) / 1000;
      const dB = parseFloat(diaB) || 0;
      const sB = (parseFloat(spcB) || 1) / 1000;

      const numA = Math.ceil(distB / sA) + 1;
      const numB = Math.ceil(distA / sB) + 1;

      const weightA = numA * spanA * (dA * dA) / 162.28;
      const weightB = numB * spanB * (dB * dB) / 162.28;

      return { numA, numB, weight: weightA + weightB };
    };

    const topMesh = calcMeshWeight(topDiaA, topSpacingA, topDiaB, topSpacingB);
    const botMesh = calcMeshWeight(botDiaA, botSpacingA, botDiaB, botSpacingB);

    const extraPct = parseFloat(extraRebar) || 0;
    const totalRebarWeight = (topMesh.weight + botMesh.weight) * (1 + extraPct / 100);

    setResults({
      wetVolume,
      dryVolume,
      numRebarA: botMesh.numA, // Typically showing bottom mesh counts
      cuttingLengthA: spanA,
      numRebarB: botMesh.numB,
      cuttingLengthB: spanB,
      sandVolume,
      aggVolume,
      cementWeight,
      cementBags,
      totalRebarWeight,
    });
  };

  const handleReset = () => {
    setLength("5");
    setWidth("3");
    setThickness("200");
    setTopDiaA("10");
    setTopSpacingA("110");
    setTopDiaB("12");
    setTopSpacingB("110");
    setBotDiaA("10");
    setBotSpacingA("110");
    setBotDiaB("12");
    setBotSpacingB("110");
    setExtraRebar("5");
    setCementRatio("1");
    setSandRatio("2");
    setAggRatio("3");
    setDryFactor("1.54");
    setClearCover("25");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A. Slab Dimension</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Length (A-A) [meter]</Label>
                <Input value={length} onChange={(e) => setLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Width (B-B) [meter]</Label>
                <Input value={width} onChange={(e) => setWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Height/Thickness [mm]</Label>
                <Input value={thickness} onChange={(e) => setThickness(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B. Reinforcement Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base text-primary">a. Top Mesh Rebar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 border rounded p-3">
                  <Label>A-A direction</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={topDiaA} onChange={(e) => setTopDiaA(e.target.value)} placeholder="Dia" className="w-20" type="number" /> <span className="text-sm">mm Dia.</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={topSpacingA} onChange={(e) => setTopSpacingA(e.target.value)} placeholder="Spacing" className="w-20" type="number" /> <span className="text-sm">mm Spacing</span>
                  </div>
                </div>
                <div className="space-y-2 border rounded p-3">
                  <Label>B-B direction</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={topDiaB} onChange={(e) => setTopDiaB(e.target.value)} placeholder="Dia" className="w-20" type="number" /> <span className="text-sm">mm Dia.</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={topSpacingB} onChange={(e) => setTopSpacingB(e.target.value)} placeholder="Spacing" className="w-20" type="number" /> <span className="text-sm">mm Spacing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label className="text-base text-primary">b. Bottom Mesh Rebar</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 border rounded p-3">
                  <Label>A-A direction</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={botDiaA} onChange={(e) => setBotDiaA(e.target.value)} placeholder="Dia" className="w-20" type="number" /> <span className="text-sm">mm Dia.</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={botSpacingA} onChange={(e) => setBotSpacingA(e.target.value)} placeholder="Spacing" className="w-20" type="number" /> <span className="text-sm">mm Spacing</span>
                  </div>
                </div>
                <div className="space-y-2 border rounded p-3">
                  <Label>B-B direction</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={botDiaB} onChange={(e) => setBotDiaB(e.target.value)} placeholder="Dia" className="w-20" type="number" /> <span className="text-sm">mm Dia.</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input value={botSpacingB} onChange={(e) => setBotSpacingB(e.target.value)} placeholder="Spacing" className="w-20" type="number" /> <span className="text-sm">mm Spacing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-w-xs border-t pt-4">
              <Label>Extra Rebar / Wastage (%)</Label>
              <Input value={extraRebar} onChange={(e) => setExtraRebar(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>C. Concrete Mix Detail</CardTitle>
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
                <Label>Wet Vol to Dry Factor</Label>
                <Input value={dryFactor} onChange={(e) => setDryFactor(e.target.value)} type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Clear Cover of Slab [mm]</Label>
                <Input value={clearCover} onChange={(e) => setClearCover(e.target.value)} type="number" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger>How to use this tool?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Slab Estimate Calculator calculates the volume of sand, the weight of cement, weight of steel required to construct a cubical slab.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Step 1:</strong> Input all required value for slab dimension, reinforcement and mix ratio.</li>
                <li><strong>Step 2:</strong> Ensure units match the specified fields (Meters for lengths, mm for thickness and rebars).</li>
                <li><strong>Step 3:</strong> Click on Calculate button to get the result.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Steel & Concrete Estimate</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">1. Wet Volume Concrete</span>
                  <span className="font-medium text-sm">{results.wetVolume.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">2. Dry Volume Concrete</span>
                  <span className="font-medium text-sm">{results.dryVolume.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">3. No. Rebar (A-A)</span>
                  <span className="font-medium text-sm">{results.numRebarA} Nos</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">4. Cut Length (A-A)</span>
                  <span className="font-medium text-sm">{results.cuttingLengthA.toFixed(3)} m</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">5. No. Rebar (B-B)</span>
                  <span className="font-medium text-sm">{results.numRebarB} Nos</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">6. Cut Length (B-B)</span>
                  <span className="font-medium text-sm">{results.cuttingLengthB.toFixed(3)} m</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">7. Sand Vol. Required</span>
                  <span className="font-medium text-sm">{results.sandVolume.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">8. Agg. Vol. Required</span>
                  <span className="font-medium text-sm">{results.aggVolume.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">9. Cement Weight</span>
                  <span className="font-medium text-sm">{results.cementWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">10. Cement Bags</span>
                  <span className="font-bold text-sm text-primary">{results.cementBags.toFixed(2)} Bags</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm font-semibold">11. Total Rebar Wt.</span>
                  <span className="font-bold text-base text-primary">{results.totalRebarWeight.toFixed(2)} kg</span>
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
