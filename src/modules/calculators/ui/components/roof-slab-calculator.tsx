"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Helper conversions
const ftToMeter = (ft: number) => ft * 0.3048;
const inchToMeter = (inch: number) => inch * 0.0254;

export const RoofSlabCalculator = () => {
  // 1. Roof Dimensions
  const [roofLength, setRoofLength] = useState("43"); // ft
  const [roofWidth, setRoofWidth] = useState("28"); // ft
  const [longBeams, setLongBeams] = useState("3");
  const [shortBeams, setShortBeams] = useState("5");
  
  // Custom added for accuracy
  const [slabThickness, setSlabThickness] = useState("6"); // inch
  const [beamWidth, setBeamWidth] = useState("9"); // inch
  const [beamDepth, setBeamDepth] = useState("12"); // inch

  // 2. Rates
  const [cementRate, setCementRate] = useState("750"); // per bag
  const [sandRate, setSandRate] = useState("640"); // per m3
  const [aggRate, setAggRate] = useState("1440"); // per m3
  const [rebarRate, setRebarRate] = useState("110"); // per kg
  const [shutteringRate, setShutteringRate] = useState("45"); // per sq ft

  // 3. Slab Reinforcement
  const [slabType, setSlabType] = useState("Single mesh");
  const [mainDia, setMainDia] = useState("8"); // mm
  const [mainSpacing, setMainSpacing] = useState("6"); // inch
  const [distDia, setDistDia] = useState("8"); // mm
  const [distSpacing, setDistSpacing] = useState("6"); // inch

  // 4. Beam Reinforcement
  const [typeADia, setTypeADia] = useState("16"); // mm
  const [typeAQty, setTypeAQty] = useState("4");
  const [typeBDia, setTypeBDia] = useState("12"); // mm
  const [typeBQty, setTypeBQty] = useState("2");
  
  const [stirrupDia, setStirrupDia] = useState("8"); // mm
  const [stirrupSpacing, setStirrupSpacing] = useState("6"); // inch

  // 5. Mix Proportion
  const [cRatio, setCRatio] = useState("1");
  const [sRatio, setSRatio] = useState("1.5");
  const [aRatio, setARatio] = useState("3");

  const [results, setResults] = useState<{
    roofAreaSqFt: number;
    cementBags: number;
    sandM3: number;
    aggM3: number;
    totalRebarKg: number;
    shutteringCost: number;
    totalCost: number;
    beamTypeAKg: number;
    beamTypeBKg: number;
    stirrupsKg: number;
    slabRebarKg: number;
  } | null>(null);

  const handleCalculate = () => {
    // 1. Volumes
    const L_ft = parseFloat(roofLength) || 0;
    const W_ft = parseFloat(roofWidth) || 0;
    const roofAreaSqFt = L_ft * W_ft;
    
    const slabThickM = inchToMeter(parseFloat(slabThickness) || 0);
    const L_m = ftToMeter(L_ft);
    const W_m = ftToMeter(W_ft);
    
    const slabVolM3 = L_m * W_m * slabThickM;

    const nLong = parseFloat(longBeams) || 0;
    const nShort = parseFloat(shortBeams) || 0;
    
    const totalBeamLengthFt = (L_ft * nLong) + (W_ft * nShort);
    const totalBeamLengthM = ftToMeter(totalBeamLengthFt);
    
    const beamWM = inchToMeter(parseFloat(beamWidth) || 0);
    const beamDM = inchToMeter(parseFloat(beamDepth) || 0);
    
    // Beam volume typically subtracts the slab thickness since it's monolithic
    const effectiveBeamDepthM = Math.max(0, beamDM - slabThickM);
    const beamVolM3 = totalBeamLengthM * beamWM * effectiveBeamDepthM;

    const totalWetVolM3 = slabVolM3 + beamVolM3;
    const dryVolM3 = totalWetVolM3 * 1.54;

    // 2. Mix
    const cR = parseFloat(cRatio) || 1;
    const sR = parseFloat(sRatio) || 1.5;
    const aR = parseFloat(aRatio) || 3;
    const totalR = cR + sR + aR;

    const cementVolM3 = dryVolM3 * (cR / totalR);
    const sandM3 = dryVolM3 * (sR / totalR);
    const aggM3 = dryVolM3 * (aR / totalR);

    const cementBags = (cementVolM3 * 1440) / 50;

    // 3. Slab Rebar
    const spcMainM = inchToMeter(parseFloat(mainSpacing) || 6);
    const spcDistM = inchToMeter(parseFloat(distSpacing) || 6);
    
    // Main bars are parallel to short span (Width), distributed over Length
    const numMainBars = Math.ceil(L_m / spcMainM) + 1;
    const totalMainLenM = numMainBars * W_m;
    const dMain = parseFloat(mainDia) || 8;
    const mainWeight = totalMainLenM * (dMain * dMain) / 162.28;

    // Dist bars are parallel to long span (Length), distributed over Width
    const numDistBars = Math.ceil(W_m / spcDistM) + 1;
    const totalDistLenM = numDistBars * L_m;
    const dDist = parseFloat(distDia) || 8;
    const distWeight = totalDistLenM * (dDist * dDist) / 162.28;

    let slabRebarKg = mainWeight + distWeight;
    if (slabType === "Double mesh") {
      slabRebarKg *= 2;
    }

    // 4. Beam Rebar
    const qA = parseFloat(typeAQty) || 0;
    const dA = parseFloat(typeADia) || 16;
    const beamTypeAKg = totalBeamLengthM * qA * (dA * dA) / 162.28;

    const qB = parseFloat(typeBQty) || 0;
    const dB = parseFloat(typeBDia) || 12;
    const beamTypeBKg = totalBeamLengthM * qB * (dB * dB) / 162.28;

    // Stirrups
    const stSpcM = inchToMeter(parseFloat(stirrupSpacing) || 6);
    const numStirrups = Math.ceil(totalBeamLengthM / stSpcM);
    // Perimeter roughly 2 * (Width + Depth) minus covers
    const stirrupLenM = 2 * (beamWM + beamDM) - 0.1; // roughly minus 10cm for covers
    const dSt = parseFloat(stirrupDia) || 8;
    const stirrupsKg = numStirrups * stirrupLenM * (dSt * dSt) / 162.28;

    const totalRebarKg = slabRebarKg + beamTypeAKg + beamTypeBKg + stirrupsKg;

    // 5. Costs
    const shutteringCost = roofAreaSqFt * (parseFloat(shutteringRate) || 0);
    const costCement = cementBags * (parseFloat(cementRate) || 0);
    const costSand = sandM3 * (parseFloat(sandRate) || 0);
    const costAgg = aggM3 * (parseFloat(aggRate) || 0);
    const costRebar = totalRebarKg * (parseFloat(rebarRate) || 0);

    const totalCost = shutteringCost + costCement + costSand + costAgg + costRebar;

    setResults({
      roofAreaSqFt,
      cementBags,
      sandM3,
      aggM3,
      totalRebarKg,
      shutteringCost,
      totalCost,
      beamTypeAKg,
      beamTypeBKg,
      stirrupsKg,
      slabRebarKg
    });
  };

  const handleReset = () => {
    setRoofLength("43"); setRoofWidth("28");
    setLongBeams("3"); setShortBeams("5");
    setSlabThickness("6"); setBeamWidth("9"); setBeamDepth("12");
    setCementRate("750"); setSandRate("640"); setAggRate("1440"); setRebarRate("110"); setShutteringRate("45");
    setSlabType("Single mesh");
    setMainDia("8"); setMainSpacing("6");
    setDistDia("8"); setDistSpacing("6");
    setTypeADia("16"); setTypeAQty("4");
    setTypeBDia("12"); setTypeBQty("2");
    setStirrupDia("8"); setStirrupSpacing("6");
    setCRatio("1"); setSRatio("1.5"); setARatio("3");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) Roof Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roof length (feet)</Label>
                <Input value={roofLength} onChange={(e) => setRoofLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Roof width (feet)</Label>
                <Input value={roofWidth} onChange={(e) => setRoofWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Long beams, number</Label>
                <Input value={longBeams} onChange={(e) => setLongBeams(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Short beams, number</Label>
                <Input value={shortBeams} onChange={(e) => setShortBeams(e.target.value)} type="number" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Slab Thickness (in)</Label>
                <Input value={slabThickness} onChange={(e) => setSlabThickness(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Beam Width (in)</Label>
                <Input value={beamWidth} onChange={(e) => setBeamWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Beam Depth (in)</Label>
                <Input value={beamDepth} onChange={(e) => setBeamDepth(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Rates (Local Currency)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cement (per bag)</Label>
                <Input value={cementRate} onChange={(e) => setCementRate(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Sand (per m³)</Label>
                <Input value={sandRate} onChange={(e) => setSandRate(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Aggregate (per m³)</Label>
                <Input value={aggRate} onChange={(e) => setAggRate(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Rebar (per kg)</Label>
                <Input value={rebarRate} onChange={(e) => setRebarRate(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Shuttering/Masonry (per sq ft)</Label>
                <Input value={shutteringRate} onChange={(e) => setShutteringRate(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3) Rebar Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <Label className="text-base text-primary">Slab Reinforcement</Label>
                <Select value={slabType} onValueChange={setSlabType}>
                  <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single mesh">Single mesh</SelectItem>
                    <SelectItem value="Double mesh">Double mesh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Main bar diameter (mm)</Label>
                  <Input value={mainDia} onChange={(e) => setMainDia(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Spacing of main bars (in)</Label>
                  <Input value={mainSpacing} onChange={(e) => setMainSpacing(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Distribution bar dia. (mm)</Label>
                  <Input value={distDia} onChange={(e) => setDistDia(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Spacing of dist. bars (in)</Label>
                  <Input value={distSpacing} onChange={(e) => setDistSpacing(e.target.value)} type="number" />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label className="text-base text-primary">Beam Reinforcement</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type A bar diameter (mm)</Label>
                  <Input value={typeADia} onChange={(e) => setTypeADia(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Type A Quantity (nos)</Label>
                  <Input value={typeAQty} onChange={(e) => setTypeAQty(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Type B bar diameter (mm)</Label>
                  <Input value={typeBDia} onChange={(e) => setTypeBDia(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Type B Quantity (nos)</Label>
                  <Input value={typeBQty} onChange={(e) => setTypeBQty(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Stirrups diameter (mm)</Label>
                  <Input value={stirrupDia} onChange={(e) => setStirrupDia(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Spacing of stirrups (in)</Label>
                  <Input value={stirrupSpacing} onChange={(e) => setStirrupSpacing(e.target.value)} type="number" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4) Mix Proportion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cement Ratio</Label>
                <Input value={cRatio} onChange={(e) => setCRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Sand Ratio</Label>
                <Input value={sRatio} onChange={(e) => setSRatio(e.target.value)} type="number" step="0.1" />
              </div>
              <div className="space-y-2">
                <Label>Aggregate Ratio</Label>
                <Input value={aRatio} onChange={(e) => setARatio(e.target.value)} type="number" />
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
            <AccordionTrigger>How to Use This Tool?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li>Input all the details of the slab like length, width, and depth along with the total number of long beams and short beams.</li>
                <li>Input the cost of each material according to your region.</li>
                <li>Input the detail of rebar used for the beam, slab like diameter, spacing, quantity, etc.</li>
                <li>Click on Calculate to get all the details of the estimated cost and quantity of rebar, cement, sand, and aggregate according to the data you have provided.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Estimated Cost & Quantities</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Roof area</span>
                  <span className="font-medium text-sm">{results.roofAreaSqFt.toFixed(2)} sq.ft</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Cement quantity</span>
                  <span className="font-medium text-sm">{results.cementBags.toFixed(2)} Bags</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Sand quantity</span>
                  <span className="font-medium text-sm">{results.sandM3.toFixed(2)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Aggregate quantity</span>
                  <span className="font-medium text-sm">{results.aggM3.toFixed(2)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Total rebar</span>
                  <span className="font-medium text-sm">{results.totalRebarKg.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Shuttering, masonry cost</span>
                  <span className="font-medium text-sm">{results.shutteringCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Approximate total cost</span>
                  <span className="font-bold text-sm text-primary">{results.totalCost.toFixed(2)}</span>
                </div>
                
                <div className="pt-2 pb-1 text-sm font-semibold text-primary">Steel Details</div>
                <div className="flex justify-between items-center pl-2 text-sm">
                  <span className="text-muted-foreground">Beam Type A</span>
                  <span className="font-medium">{results.beamTypeAKg.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center pl-2 text-sm">
                  <span className="text-muted-foreground">Beam Type B</span>
                  <span className="font-medium">{results.beamTypeBKg.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center pl-2 text-sm">
                  <span className="text-muted-foreground">Beam stirrups</span>
                  <span className="font-medium">{results.stirrupsKg.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between items-center pl-2 text-sm">
                  <span className="text-muted-foreground">Slab rebar</span>
                  <span className="font-medium">{results.slabRebarKg.toFixed(2)} kg</span>
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
