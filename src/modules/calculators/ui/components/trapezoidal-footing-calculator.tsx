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

export const TrapezoidalFootingCalculator = () => {
  // 1) Number of footing
  const [numFootings, setNumFootings] = useState("1");

  // 2) Size of Raft
  const [raftA, setRaftA] = useState("4");
  const [unitA, setUnitA] = useState("Inch");
  const [raftB, setRaftB] = useState("6");
  const [unitB, setUnitB] = useState("Feet");
  const [raftC, setRaftC] = useState("6");
  const [unitC, setUnitC] = useState("Feet");

  // 3) Height of Trapezium
  const [trapH, setTrapH] = useState("2");
  const [unitH, setUnitH] = useState("Feet");

  // 4) Size of Column
  const [colD, setColD] = useState("10");
  const [unitD, setUnitD] = useState("Inch");
  const [colE, setColE] = useState("12");
  const [unitE, setUnitE] = useState("Inch");
  const [colF, setColF] = useState("24");
  const [unitF, setUnitF] = useState("Feet");

  // 5) Mix Ratio & Extras
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("2");
  const [aggRatio, setAggRatio] = useState("3");
  const [steelPercent, setSteelPercent] = useState("2"); // typically 2-6%

  // 7) Tipper volume
  const [tipperVol, setTipperVol] = useState("2.5");

  // 8) Conversion Factor
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
    sandTippers: number;
    aggTippers: number;
  } | null>(null);

  const handleCalculate = () => {
    // Conversions to meters
    const aM = toMeter(parseFloat(raftA), unitA);
    const bM = toMeter(parseFloat(raftB), unitB);
    const cM = toMeter(parseFloat(raftC), unitC);
    
    const hM = toMeter(parseFloat(trapH), unitH);
    
    const dM = toMeter(parseFloat(colD), unitD);
    const eM = toMeter(parseFloat(colE), unitE);
    const fM = toMeter(parseFloat(colF), unitF);

    const N = parseFloat(numFootings) || 1;

    // 1. Volume of rectangular base (Raft)
    const V1 = bM * cM * aM;

    // 2. Volume of trapezoidal part
    const A1 = bM * cM; // Base area
    const A2 = dM * eM; // Top area (matches column base)
    const V2 = (hM / 3) * (A1 + A2 + Math.sqrt(A1 * A2));

    // 3. Volume of Column
    const V3 = dM * eM * fM;

    // Total Volumes
    const wetVolPerFooting = V1 + V2 + V3;
    const totalWetVol = wetVolPerFooting * N;
    
    const factor = parseFloat(dryFactor) || 1.54;
    const totalDryVol = totalWetVol * factor;

    // Concrete Mix
    const cR = parseFloat(cementRatio) || 1;
    const sR = parseFloat(sandRatio) || 2;
    const aR = parseFloat(aggRatio) || 3;
    const totalR = cR + sR + aR;

    const cementVol = totalDryVol * (cR / totalR);
    const sandVol = totalDryVol * (sR / totalR);
    const aggVol = totalDryVol * (aR / totalR);

    // Weights & Quantities
    const cementWeight = cementVol * 1440; // kg
    const cementBags = cementWeight / 50;

    const steelPct = parseFloat(steelPercent) || 0;
    const steelWeight = totalWetVol * (steelPct / 100) * 7850; // kg

    const tipV = parseFloat(tipperVol) || 2.5;
    const sandTippers = sandVol / tipV;
    const aggTippers = aggVol / tipV;

    setResults({
      wetVolume: totalWetVol,
      dryVolume: totalDryVol,
      cementVol,
      sandVol,
      aggVol,
      cementWeight,
      cementBags,
      steelWeight,
      sandTippers,
      aggTippers
    });
  };

  const handleReset = () => {
    setNumFootings("1");
    setRaftA("4"); setUnitA("Inch");
    setRaftB("6"); setUnitB("Feet");
    setRaftC("6"); setUnitC("Feet");
    setTrapH("2"); setUnitH("Feet");
    setColD("10"); setUnitD("Inch");
    setColE("12"); setUnitE("Inch");
    setColF("24"); setUnitF("Feet");
    setCementRatio("1");
    setSandRatio("2");
    setAggRatio("3");
    setSteelPercent("2");
    setTipperVol("2.5");
    setDryFactor("1.54");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) Footing Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <Label>Number of footing</Label>
              <Input value={numFootings} onChange={(e) => setNumFootings(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Size of Raft (Base)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input value of (a) - Height</Label>
                <div className="flex gap-2">
                  <Input value={raftA} onChange={(e) => setRaftA(e.target.value)} type="number" />
                  <Select value={unitA} onValueChange={setUnitA}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Input value of (b) - Length</Label>
                <div className="flex gap-2">
                  <Input value={raftB} onChange={(e) => setRaftB(e.target.value)} type="number" />
                  <Select value={unitB} onValueChange={setUnitB}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Input value of (c) - Width</Label>
                <div className="flex gap-2">
                  <Input value={raftC} onChange={(e) => setRaftC(e.target.value)} type="number" />
                  <Select value={unitC} onValueChange={setUnitC}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3) Height of Trapezium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <Label>Input value of (h)</Label>
              <div className="flex gap-2">
                <Input value={trapH} onChange={(e) => setTrapH(e.target.value)} type="number" />
                <Select value={unitH} onValueChange={setUnitH}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="Inch">Inch</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4) Size of Column</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input value of (d) - Length</Label>
                <div className="flex gap-2">
                  <Input value={colD} onChange={(e) => setColD(e.target.value)} type="number" />
                  <Select value={unitD} onValueChange={setUnitD}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Input value of (e) - Width</Label>
                <div className="flex gap-2">
                  <Input value={colE} onChange={(e) => setColE(e.target.value)} type="number" />
                  <Select value={unitE} onValueChange={setUnitE}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Input value of (f) - Height</Label>
                <div className="flex gap-2">
                  <Input value={colF} onChange={(e) => setColF(e.target.value)} type="number" />
                  <Select value={unitF} onValueChange={setUnitF}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5) Mix Ratio & Parameters</CardTitle>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Steel Rod (%)</Label>
                <Input value={steelPercent} onChange={(e) => setSteelPercent(e.target.value)} type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label>Tipper Vol. (m³)</Label>
                <Input value={tipperVol} onChange={(e) => setTipperVol(e.target.value)} type="number" step="0.1" />
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
            <AccordionTrigger>About Footing Estimator</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>The above calculator helps you to calculate the total quantity of material like cement, sand, aggregate, numbers of bags of cement, Weight of steel rods, etc.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Put the dimension of trapezoidal footing you want to construct like, length, width, and height.</li>
                <li>Put the ratio of cement, sand and aggregate you want to use for concrete (e.g. 1:2:3, 1:1.5:3 etc).</li>
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
            <CardDescription>Trapezoidal Footing Details</CardDescription>
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
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Steel Rod Weight</span>
                  <span className="font-bold text-sm text-primary">{results.steelWeight.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm">No. of Tipper/Tractor</span>
                </div>
                <div className="flex justify-between items-center pl-4 text-sm">
                  <span className="text-muted-foreground">Tip of Sand</span>
                  <span className="font-medium">{results.sandTippers.toFixed(2)} Tip</span>
                </div>
                <div className="flex justify-between items-center pl-4 text-sm">
                  <span className="text-muted-foreground">Tip of Aggregate</span>
                  <span className="font-medium">{results.aggTippers.toFixed(2)} Tip</span>
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
