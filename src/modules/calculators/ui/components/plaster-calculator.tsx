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

export const PlasterCalculator = () => {
  // 1) Dimension of Plaster
  const [wallLength, setWallLength] = useState("12");
  const [wallLengthUnit, setWallLengthUnit] = useState("Feet");
  
  const [wallHeight, setWallHeight] = useState("9");
  const [wallHeightUnit, setWallHeightUnit] = useState("Feet");

  const [plasterThickness, setPlasterThickness] = useState("14");
  const [plasterThicknessUnit, setPlasterThicknessUnit] = useState("mm");

  // 2) Opening of Door
  const [doorWidth, setDoorWidth] = useState("3");
  const [doorHeight, setDoorHeight] = useState("7");
  const [doorUnit, setDoorUnit] = useState("Feet");
  const [doorQuantity, setDoorQuantity] = useState("2");

  // 3) Opening of window
  const [windowWidth, setWindowWidth] = useState("4");
  const [windowHeight, setWindowHeight] = useState("5");
  const [windowUnit, setWindowUnit] = useState("Feet");
  const [windowQuantity, setWindowQuantity] = useState("3");

  // 4) Ratio of Cement:Sand
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("4");

  // 5) Conversion Factor
  const [dryVolumeFactor, setDryVolumeFactor] = useState("1.32"); // default 32-34% extra

  // Results
  const [results, setResults] = useState<{
    wetVolume: number;
    dryVolume: number;
    cementVolume: number;
    sandVolume: number;
    cementWeight: number;
    cementBags: number;
  } | null>(null);

  const handleCalculate = () => {
    // Wall Dimensions in meters
    const wL = toMeter(parseFloat(wallLength), wallLengthUnit);
    const wH = toMeter(parseFloat(wallHeight), wallHeightUnit);
    const pT = toMeter(parseFloat(plasterThickness), plasterThicknessUnit);

    const wallArea = wL * wH;

    // Door Dimensions in meters
    const dW = toMeter(parseFloat(doorWidth) || 0, doorUnit);
    const dH = toMeter(parseFloat(doorHeight) || 0, doorUnit);
    const dQ = parseFloat(doorQuantity) || 0;
    const doorArea = dW * dH * dQ;

    // Window Dimensions in meters
    const winW = toMeter(parseFloat(windowWidth) || 0, windowUnit);
    const winH = toMeter(parseFloat(windowHeight) || 0, windowUnit);
    const winQ = parseFloat(windowQuantity) || 0;
    const windowArea = winW * winH * winQ;

    // Net Area and Wet Volume
    const netArea = Math.max(0, wallArea - doorArea - windowArea);
    const wetVolume = netArea * pT;

    // Dry Volume
    const dryFactor = parseFloat(dryVolumeFactor) || 1.32;
    const dryVolume = wetVolume * dryFactor;

    // Mix Ratios
    const cRatio = parseFloat(cementRatio) || 1;
    const sRatio = parseFloat(sandRatio) || 4;
    const totalRatio = cRatio + sRatio;

    // Material Volumes
    const cementVol = dryVolume * (cRatio / totalRatio);
    const sandVol = dryVolume * (sRatio / totalRatio);

    // Weights
    const cementWeight = cementVol * 1440; // Density of cement = 1440 kg/m3
    const cementBags = cementWeight / 50; // 1 Bag = 50kg

    setResults({
      wetVolume: wetVolume,
      dryVolume: dryVolume,
      cementVolume: cementVol,
      sandVolume: sandVol,
      cementWeight: cementWeight,
      cementBags: cementBags,
    });
  };

  const handleReset = () => {
    setWallLength("12");
    setWallLengthUnit("Feet");
    setWallHeight("9");
    setWallHeightUnit("Feet");
    setPlasterThickness("14");
    setPlasterThicknessUnit("mm");
    
    setDoorWidth("3");
    setDoorHeight("7");
    setDoorUnit("Feet");
    setDoorQuantity("2");
    
    setWindowWidth("4");
    setWindowHeight("5");
    setWindowUnit("Feet");
    setWindowQuantity("3");
    
    setCementRatio("1");
    setSandRatio("4");
    setDryVolumeFactor("1.32");
    
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) Dimension of Plaster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Length of Wall</Label>
                <Input value={wallLength} onChange={(e) => setWallLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={wallLengthUnit} onValueChange={setWallLengthUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Height of Wall</Label>
                <Input value={wallHeight} onChange={(e) => setWallHeight(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={wallHeightUnit} onValueChange={setWallHeightUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Thickness of Plaster</Label>
                <Input value={plasterThickness} onChange={(e) => setPlasterThickness(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={plasterThicknessUnit} onValueChange={setPlasterThicknessUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="Inch">Inch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Opening of Door</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input value={doorWidth} onChange={(e) => setDoorWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input value={doorHeight} onChange={(e) => setDoorHeight(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={doorUnit} onValueChange={setDoorUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 max-w-xs">
              <Label>Quantity</Label>
              <Input value={doorQuantity} onChange={(e) => setDoorQuantity(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3) Opening of Window</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Width</Label>
                <Input value={windowWidth} onChange={(e) => setWindowWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <Input value={windowHeight} onChange={(e) => setWindowHeight(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={windowUnit} onValueChange={setWindowUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 max-w-xs">
              <Label>Quantity</Label>
              <Input value={windowQuantity} onChange={(e) => setWindowQuantity(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4 & 5) Mix Ratio and Factor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Cement Ratio</Label>
                <Input value={cementRatio} onChange={(e) => setCementRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Sand Ratio</Label>
                <Input value={sandRatio} onChange={(e) => setSandRatio(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Dry volume factor</Label>
                <Input value={dryVolumeFactor} onChange={(e) => setDryVolumeFactor(e.target.value)} type="number" step="0.01" />
                <p className="text-xs text-muted-foreground mt-1">Default 1.32 (Added 32-34% extra mortar)</p>
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
            <AccordionTrigger>How to Use This Tool?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Plaster Calculator calculates the volume of cement, and sand, and the weight of cement, Numbers of bags of cement required to plaster cubical structural members like Wall, Beam, Column, and Slab, etc.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Step 1:</strong> Input all the value required above of the plaster. (Dimension of wall on which plaster should be done, thickness of plaster, and mix ratio of mortar).</li>
                <li><strong>Step 2:</strong> Input the the dimension of opening in wall like door, window etc. along with quantity.</li>
                <li><strong>Step 3:</strong> Click on "Calculate" button.</li>
                <li><strong>Step 4:</strong> Finally, you will get the result of quantity of cement, sand required for the given dimension of wall.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="data">
            <AccordionTrigger>Standard Data used in this Calculator</AccordionTrigger>
            <AccordionContent className="space-y-2 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li>Added 32-34% extra mortar to convert wet volume into dry volume. (You can change)</li>
                <li>Density of cement = 1440 Kg/m³</li>
                <li>1 Bag of cement = 50 Kg</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Plaster material estimates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Dry Volume of Mortar</span>
                  <span className="font-semibold">{results.dryVolume.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Sand</span>
                  <span className="font-semibold">{results.sandVolume.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Cement</span>
                  <span className="font-semibold">{results.cementWeight.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">kg</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">No. of Bags of Cement</span>
                  <span className="font-bold text-lg text-primary">{results.cementBags.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">Nos</span></span>
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
