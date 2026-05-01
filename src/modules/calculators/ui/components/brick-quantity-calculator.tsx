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

export const BrickQuantityCalculator = () => {
  // Section A. Wall Dimensions
  const [wallLength, setWallLength] = useState("10");
  const [wallHeight, setWallHeight] = useState("3");
  const [wallThickness, setWallThickness] = useState("0.23");
  const [wallUnit, setWallUnit] = useState("m");
  const [mortarThickness, setMortarThickness] = useState("10");
  const [mortarUnit, setMortarUnit] = useState("mm");

  // Section B. Brick Details
  const [brickLength, setBrickLength] = useState("190");
  const [brickWidth, setBrickWidth] = useState("90");
  const [brickHeight, setBrickHeight] = useState("90");
  const [brickUnit, setBrickUnit] = useState("mm");

  // Section C. Wastage
  const [wastagePercent, setWastagePercent] = useState("5");

  // Results
  const [results, setResults] = useState<{
    wallVolume: number;
    brickVolWithMortar: number;
    singleBrickVol: number;
    requiredBricks: number;
    bricksWithWastage: number;
    mortarVolume: number;
  } | null>(null);

  const handleCalculate = () => {
    // Convert to meters
    const wL = toMeter(parseFloat(wallLength), wallUnit);
    const wH = toMeter(parseFloat(wallHeight), wallUnit);
    const wT = toMeter(parseFloat(wallThickness), wallUnit);
    
    const mT = toMeter(parseFloat(mortarThickness), mortarUnit);

    const bL = toMeter(parseFloat(brickLength), brickUnit);
    const bW = toMeter(parseFloat(brickWidth), brickUnit);
    const bH = toMeter(parseFloat(brickHeight), brickUnit);

    const wastage = parseFloat(wastagePercent) || 0;

    // Calculations
    // 1. Total Wall Volume
    const wallVol = wL * wH * wT;

    // 2. Brick Volume with Mortar
    const brickVolWithMortar = (bL + mT) * (bW + mT) * (bH + mT);

    // 3. Single Brick Volume without Mortar
    const singleBrickVol = bL * bW * bH;

    // 4. Required Bricks
    const requiredBricks = Math.ceil(wallVol / brickVolWithMortar);

    // 5. Bricks with Wastage
    const bricksWithWastage = Math.ceil(requiredBricks * (1 + wastage / 100));

    // 6. Estimated Mortar Volume
    const solidBrickVolInWall = requiredBricks * singleBrickVol;
    const mortarVolume = Math.max(0, wallVol - solidBrickVolInWall);

    setResults({
      wallVolume: wallVol,
      brickVolWithMortar: brickVolWithMortar,
      singleBrickVol: singleBrickVol,
      requiredBricks: requiredBricks,
      bricksWithWastage: bricksWithWastage,
      mortarVolume: mortarVolume,
    });
  };

  const handleReset = () => {
    setWallLength("10");
    setWallHeight("3");
    setWallThickness("0.23");
    setWallUnit("m");
    setMortarThickness("10");
    setMortarUnit("mm");
    
    setBrickLength("190");
    setBrickWidth("90");
    setBrickHeight("90");
    setBrickUnit("mm");
    
    setWastagePercent("5");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Section A. Wall Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Wall Length</Label>
              <Input value={wallLength} onChange={(e) => setWallLength(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Wall Height</Label>
              <Input value={wallHeight} onChange={(e) => setWallHeight(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Wall Thickness</Label>
              <Input value={wallThickness} onChange={(e) => setWallThickness(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={wallUnit} onValueChange={setWallUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="m">Meter</SelectItem>
                  <SelectItem value="Feet">Feet</SelectItem>
                  <SelectItem value="Inch">Inch</SelectItem>
                  <SelectItem value="mm">mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mortar Thickness</Label>
              <Input value={mortarThickness} onChange={(e) => setMortarThickness(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Mortar Unit</Label>
              <Select value={mortarUnit} onValueChange={setMortarUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="Inch">Inch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Section B. Brick Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Brick Length</Label>
              <Input value={brickLength} onChange={(e) => setBrickLength(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Brick Width</Label>
              <Input value={brickWidth} onChange={(e) => setBrickWidth(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Brick Height</Label>
              <Input value={brickHeight} onChange={(e) => setBrickHeight(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={brickUnit} onValueChange={setBrickUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="Inch">Inch</SelectItem>
                  <SelectItem value="Feet">Feet</SelectItem>
                  <SelectItem value="m">Meter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Section C. Wastage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Wastage Percentage (%)</Label>
                <Input value={wastagePercent} onChange={(e) => setWastagePercent(e.target.value)} type="number" />
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
            <AccordionTrigger>How to Use Brick Quantity Calculator with Mortar?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Step 1:</strong> First of all, input the dimensions of the wall such as length, height and thickness and select the appropriate units.</li>
                <li><strong>Step 2:</strong> After that, enter the standard brick size including length, width and height as per site or IS standard.</li>
                <li><strong>Step 3:</strong> Then, input the mortar thickness which is generally taken as 10 mm for standard brickwork.</li>
                <li><strong>Step 4:</strong> Now, enter the wastage percentage depending on site conditions, usually taken as 5%.</li>
                <li><strong>Step 5:</strong> Finally, the calculator will automatically calculate total wall volume, brick volume, number of bricks and mortar volume instantly.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="benefits">
            <AccordionTrigger>How Brick Quantity Calculator is useful?</AccordionTrigger>
            <AccordionContent className="space-y-2 text-muted-foreground">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Eliminates manual errors by providing accurate calculations.</li>
                <li>Saves time during estimation and project planning.</li>
                <li>Helps in proper material procurement and cost control.</li>
                <li>Ensures standard engineering calculations based on volume method.</li>
                <li>Provides instant results with different unit options.</li>
                <li>Improves site efficiency and reduces wastage.</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="faqs">
            <AccordionTrigger>FAQs</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Q1. Why mortar thickness is added in brick calculation?</p>
                <p>Ans: Mortar thickness is added to get actual space occupied by each brick in masonry.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Q2. What is standard brick size in India and Nepal?</p>
                <p>Ans: Standard brick size is 190 mm x 90 mm x 90 mm without mortar.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Q3. What is ideal wastage percentage?</p>
                <p>Ans: Generally 5% to 10% is considered depending on site conditions.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Q4. Can I use this calculator for different units?</p>
                <p>Ans: Yes, it supports multiple unit conversions like m, ft, mm, and inches.</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Q5. Is this calculator accurate for estimation?</p>
                <p>Ans: Yes, it is based on standard engineering formulas and gives reliable results.</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Brick quantity estimates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Total Wall Volume</span>
                  <span className="font-semibold">{results.wallVolume.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Brick Vol With Mortar</span>
                  <span className="font-semibold">{results.brickVolWithMortar.toFixed(6)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Single Brick Vol</span>
                  <span className="font-semibold">{results.singleBrickVol.toFixed(6)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Required Bricks</span>
                  <span className="text-lg font-bold text-primary">{results.requiredBricks.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Nos</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Bricks With Wastage</span>
                  <span className="text-lg font-bold text-primary">{results.bricksWithWastage.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Nos</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Estimated Mortar Vol</span>
                  <span className="font-semibold text-lg">{results.mortarVolume.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
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
