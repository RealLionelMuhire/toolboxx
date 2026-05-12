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

export const CompoundWallCalculator = () => {
  // A) Wall Details
  const [wallLength, setWallLength] = useState("16");
  const [wallLengthUnit, setWallLengthUnit] = useState("Feet");

  const [heightAbove, setHeightAbove] = useState("13");
  const [heightAboveUnit, setHeightAboveUnit] = useState("Feet");
  const [widthAbove, setWidthAbove] = useState("120");
  const [widthAboveUnit, setWidthAboveUnit] = useState("mm");

  const [heightBelow, setHeightBelow] = useState("13");
  const [heightBelowUnit, setHeightBelowUnit] = useState("Feet");
  const [widthBelow, setWidthBelow] = useState("120");
  const [widthBelowUnit, setWidthBelowUnit] = useState("mm");

  // B) Brick Details
  const [brickL, setBrickL] = useState("240");
  const [brickLUnit, setBrickLUnit] = useState("mm");
  const [brickW, setBrickW] = useState("115");
  const [brickWUnit, setBrickWUnit] = useState("mm");
  const [brickH, setBrickH] = useState("75");
  const [brickHUnit, setBrickHUnit] = useState("mm");

  // C) Ratio & Mortar
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("4");
  
  const [mortarThick, setMortarThick] = useState("12");
  const [mortarThickUnit, setMortarThickUnit] = useState("mm");

  // Results
  const [results, setResults] = useState<{
    numBricks: number;
    sandVol: number;
    cementVol: number;
    cementBags: number;
    wallVol: number;
  } | null>(null);

  const handleCalculate = () => {
    // Convert wall dimensions to meters
    const wL = toMeter(parseFloat(wallLength), wallLengthUnit);
    
    const hAbove = toMeter(parseFloat(heightAbove), heightAboveUnit);
    const wAbove = toMeter(parseFloat(widthAbove), widthAboveUnit);
    
    const hBelow = toMeter(parseFloat(heightBelow), heightBelowUnit);
    const wBelow = toMeter(parseFloat(widthBelow), widthBelowUnit);

    // 1. Calculate Volume of Wall (m³)
    const volAbove = wL * wAbove * hAbove;
    const volBelow = wL * wBelow * hBelow;
    const totalWallVol = volAbove + volBelow;

    // Convert brick dimensions to meters
    const bL = toMeter(parseFloat(brickL), brickLUnit);
    const bW = toMeter(parseFloat(brickW), brickWUnit);
    const bH = toMeter(parseFloat(brickH), brickHUnit);

    // 2. Volume of Bricks without Mortar
    const volBrickWithout = bL * bW * bH;

    // Convert mortar thickness to meters
    const mThick = toMeter(parseFloat(mortarThick), mortarThickUnit);

    // 3. Volume of Bricks with Mortar
    const volBrickWith = (bL + mThick) * (bW + mThick) * (bH + mThick);

    // 4. Calculate number of bricks
    // Usually round up to ensure enough bricks
    const numBricks = Math.ceil(totalWallVol / volBrickWith) || 0;

    // 5. Calculate Wet volume of Mortar
    // Volume of Wall - (No. of Bricks x Volume of one brick without mortar)
    const wetMortarVol = totalWallVol - (numBricks * volBrickWithout);

    // 6. Calculate Dry volume of Mortar (using standard 1.34 factor)
    const dryMortarVol = wetMortarVol * 1.34;

    // 7. Calculate Cement and Sand
    const cR = parseFloat(cementRatio) || 1;
    const sR = parseFloat(sandRatio) || 4;
    const totalR = cR + sR;

    let cementVol = 0;
    let sandVol = 0;

    if (totalR > 0 && dryMortarVol > 0) {
      cementVol = dryMortarVol * (cR / totalR);
      sandVol = dryMortarVol * (sR / totalR);
    }

    const cementWeight = cementVol * 1440; // kg
    const cementBags = cementWeight / 50; // bags

    setResults({
      numBricks,
      sandVol,
      cementVol,
      cementBags,
      wallVol: totalWallVol,
    });
  };

  const handleReset = () => {
    setWallLength("16"); setWallLengthUnit("Feet");
    setHeightAbove("13"); setHeightAboveUnit("Feet");
    setWidthAbove("120"); setWidthAboveUnit("mm");
    setHeightBelow("13"); setHeightBelowUnit("Feet");
    setWidthBelow("120"); setWidthBelowUnit("mm");
    setBrickL("240"); setBrickLUnit("mm");
    setBrickW("115"); setBrickWUnit("mm");
    setBrickH("75"); setBrickHUnit("mm");
    setCementRatio("1"); setSandRatio("4");
    setMortarThick("12"); setMortarThickUnit("mm");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A) Wall Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label>Length of Wall</Label>
              <div className="flex gap-2">
                <Input value={wallLength} onChange={(e) => setWallLength(e.target.value)} type="number" />
                <Select value={wallLengthUnit} onValueChange={setWallLengthUnit}>
                  <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Inch">Inch</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Height of wall above Floor</Label>
                <div className="flex gap-2">
                  <Input value={heightAbove} onChange={(e) => setHeightAbove(e.target.value)} type="number" />
                  <Select value={heightAboveUnit} onValueChange={setHeightAboveUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Width of wall above Floor</Label>
                <div className="flex gap-2">
                  <Input value={widthAbove} onChange={(e) => setWidthAbove(e.target.value)} type="number" />
                  <Select value={widthAboveUnit} onValueChange={setWidthAboveUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Height of wall below Floor</Label>
                <div className="flex gap-2">
                  <Input value={heightBelow} onChange={(e) => setHeightBelow(e.target.value)} type="number" />
                  <Select value={heightBelowUnit} onValueChange={setHeightBelowUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Width of wall below floor</Label>
                <div className="flex gap-2">
                  <Input value={widthBelow} onChange={(e) => setWidthBelow(e.target.value)} type="number" />
                  <Select value={widthBelowUnit} onValueChange={setWidthBelowUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B) Bricks Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Length of Bricks</Label>
                <div className="flex gap-2">
                  <Input value={brickL} onChange={(e) => setBrickL(e.target.value)} type="number" />
                  <Select value={brickLUnit} onValueChange={setBrickLUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Inch">in</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Width of Bricks</Label>
                <div className="flex gap-2">
                  <Input value={brickW} onChange={(e) => setBrickW(e.target.value)} type="number" />
                  <Select value={brickWUnit} onValueChange={setBrickWUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Inch">in</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Height of Bricks</Label>
                <div className="flex gap-2">
                  <Input value={brickH} onChange={(e) => setBrickH(e.target.value)} type="number" />
                  <Select value={brickHUnit} onValueChange={setBrickHUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Inch">in</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>C & D) Mix Ratio & Mortar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cement Ratio</Label>
                <Input value={cementRatio} onChange={(e) => setCementRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Sand Ratio</Label>
                <Input value={sandRatio} onChange={(e) => setSandRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Mortar Thickness</Label>
                <div className="flex gap-2">
                  <Input value={mortarThick} onChange={(e) => setMortarThick(e.target.value)} type="number" />
                  <Select value={mortarThickUnit} onValueChange={setMortarThickUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Inch">in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
            <AccordionTrigger>How to Estimate Materials in Compound Wall?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-decimal pl-5 space-y-2">
                <li><strong>Calculate Volume of Wall:</strong> Computes the volume above and below ground and sums them up.</li>
                <li><strong>Calculate Volume of Bricks without Mortar:</strong> Multiplies length × width × height of the brick.</li>
                <li><strong>Calculate Volume of Bricks with Mortar:</strong> Adds mortar thickness to all dimensions of the brick.</li>
                <li><strong>Calculate Number of Bricks:</strong> Total wall volume divided by the volume of brick with mortar.</li>
                <li><strong>Calculate Wet Volume of Mortar:</strong> Wall volume minus the volume occupied by bricks (Number of bricks × brick volume without mortar).</li>
                <li><strong>Dry Volume of Mortar:</strong> Wet volume × 1.34 (adds 34% bulkage).</li>
                <li><strong>Quantities:</strong> Applies the Cement:Sand ratio to the dry volume to get the final amounts. (1 bag cement = 50 kg, density = 1440 kg/m³)</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Bricks & Mortar Estimate</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Total Wall Volume</span>
                  <span className="font-medium text-sm">{results.wallVol.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Number of Bricks</span>
                  <span className="font-bold text-lg text-primary">{results.numBricks} Nos.</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Sand</span>
                  <span className="font-medium text-sm">{results.sandVol.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Cement</span>
                  <span className="font-medium text-sm">{results.cementVol.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm font-semibold">No. of Bags of Cement</span>
                  <span className="font-bold text-lg text-primary">{results.cementBags.toFixed(2)} Bags</span>
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
