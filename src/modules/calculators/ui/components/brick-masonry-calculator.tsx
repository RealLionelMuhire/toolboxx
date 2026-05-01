"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

// Unit conversion helper to meters
const toMeter = (value: number, unit: string) => {
  if (isNaN(value)) return 0;
  switch (unit) {
    case "Feet": return value * 0.3048;
    case "Inch": return value * 0.0254;
    case "mm": return value / 1000;
    case "m": return value;
    case "Feet²": return value * 0.092903;
    case "m²": return value;
    default: return value;
  }
};

export const BrickMasonryCalculator = () => {
  // A. Wall dimensions
  const [wallLength, setWallLength] = useState("48");
  const [wallWidth, setWallWidth] = useState("0.66");
  const [wallHeight, setWallHeight] = useState("9");
  const [wallUnit, setWallUnit] = useState("Feet");

  // B. Brick dimensions
  const [brickLength, setBrickLength] = useState("240");
  const [brickWidth, setBrickWidth] = useState("115");
  const [brickHeight, setBrickHeight] = useState("75");
  const [brickUnit, setBrickUnit] = useState("mm");

  // C. Openings
  const [doorLength, setDoorLength] = useState("3");
  const [doorHeight, setDoorHeight] = useState("7");
  const [doorQty, setDoorQty] = useState("1");
  const [doorUnit, setDoorUnit] = useState("Feet");

  const [windowLength, setWindowLength] = useState("4");
  const [windowHeight, setWindowHeight] = useState("5");
  const [windowQty, setWindowQty] = useState("1");
  const [windowUnit, setWindowUnit] = useState("Feet");

  const [otherArea, setOtherArea] = useState("0");
  const [otherAreaUnit, setOtherAreaUnit] = useState("Feet²");

  // D. Mortar and cement
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("6");
  const [mortarThickness, setMortarThickness] = useState("15");
  const [mortarUnit, setMortarUnit] = useState("mm");
  const [dryConversion, setDryConversion] = useState("32");

  // Results
  const [results, setResults] = useState<{
    bricks: number;
    sandVolume: number;
    cementWeight: number;
    cementBags: number;
  } | null>(null);

  const handleCalculate = () => {
    // 1. Convert everything to meters
    const wL = toMeter(parseFloat(wallLength), wallUnit);
    const wW = toMeter(parseFloat(wallWidth), wallUnit);
    const wH = toMeter(parseFloat(wallHeight), wallUnit);

    const bL = toMeter(parseFloat(brickLength), brickUnit);
    const bW = toMeter(parseFloat(brickWidth), brickUnit);
    const bH = toMeter(parseFloat(brickHeight), brickUnit);

    const dL = toMeter(parseFloat(doorLength), doorUnit);
    const dH = toMeter(parseFloat(doorHeight), doorUnit);
    const dQ = parseFloat(doorQty) || 0;

    const winL = toMeter(parseFloat(windowLength), windowUnit);
    const winH = toMeter(parseFloat(windowHeight), windowUnit);
    const winQ = parseFloat(windowQty) || 0;

    const oA = toMeter(parseFloat(otherArea), otherAreaUnit);

    const mT = toMeter(parseFloat(mortarThickness), mortarUnit);

    const cRatio = parseFloat(cementRatio) || 1;
    const sRatio = parseFloat(sandRatio) || 6;
    const dryConv = parseFloat(dryConversion) || 32;

    // 2. Volumes
    const vWall = wL * wW * wH;
    const vDoor = dL * dH * wW * dQ;
    const vWin = winL * winH * wW * winQ;
    const vOther = oA * wW;
    const vNet = Math.max(0, vWall - vDoor - vWin - vOther);

    // 3. Bricks
    const vBrickWith = (bL + mT) * bW * (bH + mT);
    const bricksCount = Math.ceil(vNet / vBrickWith);

    // 4. Mortar
    const vSolid = bricksCount * (bL * bW * bH);
    const vWetMortar = Math.max(0, vNet - vSolid);
    
    // Formula from prompt: Vm,d = Vm,w * p/100
    // Using the exact mathematical relation provided in the prompt example
    // Example: 2.543 * 0.32 = 0.814
    const vDryMortar = vWetMortar * (dryConv / 100);

    // 5. Cement and Sand
    const totalRatio = cRatio + sRatio;
    const vCem = vDryMortar * (cRatio / totalRatio);
    const vSand = vDryMortar * (sRatio / totalRatio);

    const wCem = vCem * 1440; // density of cement in kg/m3
    const bags = wCem / 50; // 50kg bags

    setResults({
      bricks: bricksCount,
      sandVolume: vSand,
      cementWeight: wCem,
      cementBags: bags,
    });
  };

  const handleReset = () => {
    setWallLength("48");
    setWallWidth("0.66");
    setWallHeight("9");
    setWallUnit("Feet");

    setBrickLength("240");
    setBrickWidth("115");
    setBrickHeight("75");
    setBrickUnit("mm");

    setDoorLength("3");
    setDoorHeight("7");
    setDoorQty("1");
    setDoorUnit("Feet");

    setWindowLength("4");
    setWindowHeight("5");
    setWindowQty("1");
    setWindowUnit("Feet");

    setOtherArea("0");
    setOtherAreaUnit("Feet²");

    setCementRatio("1");
    setSandRatio("6");
    setMortarThickness("15");
    setMortarUnit("mm");
    setDryConversion("32");

    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A. Wall dimensions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Length of wall</Label>
              <Input value={wallLength} onChange={(e) => setWallLength(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Width of wall</Label>
              <Input value={wallWidth} onChange={(e) => setWallWidth(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Height of wall</Label>
              <Input value={wallHeight} onChange={(e) => setWallHeight(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={wallUnit} onValueChange={setWallUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feet">Feet</SelectItem>
                  <SelectItem value="m">Meter</SelectItem>
                  <SelectItem value="Inch">Inch</SelectItem>
                  <SelectItem value="mm">mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B. Brick dimensions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Length of brick</Label>
              <Input value={brickLength} onChange={(e) => setBrickLength(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Width of brick</Label>
              <Input value={brickWidth} onChange={(e) => setBrickWidth(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Height of brick</Label>
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
            <CardTitle>C. Openings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Door Length</Label>
                <Input value={doorLength} onChange={(e) => setDoorLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Door Height</Label>
                <Input value={doorHeight} onChange={(e) => setDoorHeight(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Door Quantity</Label>
                <Input value={doorQty} onChange={(e) => setDoorQty(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={doorUnit} onValueChange={setDoorUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Inch">Inch</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Window Length</Label>
                <Input value={windowLength} onChange={(e) => setWindowLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Window Height</Label>
                <Input value={windowHeight} onChange={(e) => setWindowHeight(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Window Quantity</Label>
                <Input value={windowQty} onChange={(e) => setWindowQty(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={windowUnit} onValueChange={setWindowUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Inch">Inch</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Other opening area</Label>
                <Input value={otherArea} onChange={(e) => setOtherArea(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Area Unit</Label>
                <Select value={otherAreaUnit} onValueChange={setOtherAreaUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feet²">Feet²</SelectItem>
                    <SelectItem value="m²">m²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>D. Mortar and cement</CardTitle>
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
                <Label>Dry Conversion (%)</Label>
                <Input value={dryConversion} onChange={(e) => setDryConversion(e.target.value)} type="number" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Mortar thickness</Label>
                <Input value={mortarThickness} onChange={(e) => setMortarThickness(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={mortarUnit} onValueChange={setMortarUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="Inch">Inch</SelectItem>
                  </SelectContent>
                </Select>
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
              <p>This tool computes brick quantity and mortar requirement for a wall after deducting openings. It converts mixed units to meter, applies a mortar thickness allowance to brick dimensions, and splits dry mortar into cement and sand by the given ratio.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Put the dimension of wall you want to construct like length, width, and height.</li>
                <li>Put the ratio of cement and sand you want to use for mortar (e.g., 1:6).</li>
                <li>Put the dimension of bricks used to construct the wall.</li>
                <li>Press Calculate button and Boom. Your result will be shown in the results panel.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="formulas">
            <AccordionTrigger>Formulas and method</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Conversions</p>
                <ul className="list-disc pl-5">
                  <li>Length to meter: ft × 0.3048, in × 0.0254, mm ÷ 1000.</li>
                  <li>Area to square meter: ft² × 0.092903, in² × 0.00064516.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Volumes & Logic</p>
                <ul className="list-disc pl-5">
                  <li>Net wall volume, Vnet = Vwall − Vdoor − Vwin − Vother.</li>
                  <li>Brick volume with joints, Vbrick,with = (Lb + tm) × (Wb) × (Hb + tm).</li>
                  <li>No. of bricks, N = ceil(Vnet ÷ Vbrick,with).</li>
                  <li>Solid brick volume, Vsolid = N × (Lb × Wb × Hb).</li>
                  <li>Wet mortar volume, Vm,w = max(0, Vnet − Vsolid).</li>
                  <li>Dry mortar volume, Vm,d = Vm,w × p/100, where p is the dry conversion percent.</li>
                  <li>Cement volume, Vcem = Vm,d × (C ÷ (C + S)).</li>
                  <li>Sand volume, Vsand = Vm,d × (S ÷ (C + S)).</li>
                  <li>Cement weight, Wcem = Vcem × 1440 kg/m³.</li>
                  <li>Cement bags, Bags = Wcem ÷ 50.</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Results</CardTitle>
            <CardDescription>Brick masonry estimates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground">No. of bricks</span>
                  <span className="text-2xl font-bold text-primary">{results.bricks.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">No.</span></span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground">Sand volume</span>
                  <span className="text-xl font-semibold">{results.sandVolume.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground">Cement weight</span>
                  <span className="text-xl font-semibold">{results.cementWeight.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">kg</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">No. of cement bags</span>
                  <span className="text-xl font-semibold">{results.cementBags.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">50 kg bags</span></span>
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
