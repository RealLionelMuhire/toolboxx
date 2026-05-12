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

const sqFeetToSqMeter = (value: number) => {
  if (isNaN(value)) return 0;
  return value * 0.092903;
};

export const ConcreteBlockCalculator = () => {
  // A. Wall Dimensions
  const [wallL, setWallL] = useState("40");
  const [wallLUnit, setWallLUnit] = useState("Feet");
  const [wallW, setWallW] = useState("200");
  const [wallWUnit, setWallWUnit] = useState("mm");
  const [wallH, setWallH] = useState("9");
  const [wallHUnit, setWallHUnit] = useState("Feet");

  // B. Concrete Block Dimensions
  const [blockType, setBlockType] = useState("solid");
  const [blockL, setBlockL] = useState("400");
  const [blockLUnit, setBlockLUnit] = useState("mm");
  const [blockW, setBlockW] = useState("200");
  const [blockWUnit, setBlockWUnit] = useState("mm");
  const [blockH, setBlockH] = useState("200");
  const [blockHUnit, setBlockHUnit] = useState("mm");

  // C. Opening Dimensions
  const [doorL, setDoorL] = useState("3");
  const [doorH, setDoorH] = useState("7");
  const [doorUnit, setDoorUnit] = useState("Feet");
  const [doorQty, setDoorQty] = useState("1");

  const [windowL, setWindowL] = useState("4");
  const [windowH, setWindowH] = useState("5");
  const [windowUnit, setWindowUnit] = useState("Feet");
  const [windowQty, setWindowQty] = useState("1");

  const [otherArea, setOtherArea] = useState("10"); // Sq.Ft

  // D. Mortar & Cement Details
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("6");
  const [mortarThick, setMortarThick] = useState("10"); // mm
  const [dryMulti, setDryMulti] = useState("1.33");
  const [costPerBlock, setCostPerBlock] = useState("2.5");
  const [currency, setCurrency] = useState("$");

  // Results
  const [results, setResults] = useState<{
    netWallVol: number;
    blockCount: number;
    cementKg: number;
    cementBags: number;
    sandVol: number;
    totalBlockCost: number;
  } | null>(null);

  const handleCalculate = () => {
    // Wall to meters
    const wL = toMeter(parseFloat(wallL), wallLUnit);
    const wW = toMeter(parseFloat(wallW), wallWUnit);
    const wH = toMeter(parseFloat(wallH), wallHUnit);
    const wallVol = wL * wW * wH;

    // Openings to meters (Area * Wall Width = Volume)
    const dL = toMeter(parseFloat(doorL), doorUnit);
    const dH = toMeter(parseFloat(doorH), doorUnit);
    const dQty = parseFloat(doorQty) || 0;
    const doorVol = dL * dH * wW * dQty;

    const winL = toMeter(parseFloat(windowL), windowUnit);
    const winH = toMeter(parseFloat(windowH), windowUnit);
    const winQty = parseFloat(windowQty) || 0;
    const windowVol = winL * winH * wW * winQty;

    const otherA_m2 = sqFeetToSqMeter(parseFloat(otherArea) || 0);
    const otherVol = otherA_m2 * wW;

    const netWallVol = wallVol - (doorVol + windowVol + otherVol);

    // Block to meters
    const bL = toMeter(parseFloat(blockL), blockLUnit);
    const bW = toMeter(parseFloat(blockW), blockWUnit);
    const bH = toMeter(parseFloat(blockH), blockHUnit);

    const mThick = toMeter(parseFloat(mortarThick), "mm");

    // Volume of block with mortar
    const blockVolWithMortar = (bL + mThick) * (bW + mThick) * (bH + mThick);
    
    // Block Count
    const blockCount = Math.ceil(netWallVol / blockVolWithMortar);

    // Mortar calculations
    const blockVolWithoutMortar = bL * bW * bH;
    const totalBlockVol = blockCount * blockVolWithoutMortar;
    
    // Safety check - if total block vol exceeds wall vol (due to ceiling/rounding), use 0 for mortar
    const wetMortarVol = Math.max(0, netWallVol - totalBlockVol);
    
    const dMultiplier = parseFloat(dryMulti) || 1.33;
    const dryMortarVol = wetMortarVol * dMultiplier;

    const cRatio = parseFloat(cementRatio) || 1;
    const sRatio = parseFloat(sandRatio) || 6;
    const totalRatio = cRatio + sRatio;

    const cementVol = dryMortarVol * (cRatio / totalRatio);
    const cementKg = cementVol * 1440; // standard density
    const cementBags = cementKg / 50;

    const sandVol = dryMortarVol * (sRatio / totalRatio);

    const cost = parseFloat(costPerBlock) || 0;
    const totalBlockCost = blockCount * cost;

    setResults({
      netWallVol,
      blockCount,
      cementKg,
      cementBags,
      sandVol,
      totalBlockCost,
    });
  };

  const handleReset = () => {
    setWallL("40"); setWallLUnit("Feet");
    setWallW("200"); setWallWUnit("mm");
    setWallH("9"); setWallHUnit("Feet");

    setBlockType("solid");
    setBlockL("400"); setBlockLUnit("mm");
    setBlockW("200"); setBlockWUnit("mm");
    setBlockH("200"); setBlockHUnit("mm");

    setDoorL("3"); setDoorH("7"); setDoorUnit("Feet"); setDoorQty("1");
    setWindowL("4"); setWindowH("5"); setWindowUnit("Feet"); setWindowQty("1");
    setOtherArea("10");

    setCementRatio("1"); setSandRatio("6");
    setMortarThick("10"); setDryMulti("1.33");
    setCostPerBlock("2.5"); setCurrency("$");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A. Wall Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Length</Label>
                <div className="flex gap-2">
                  <Input value={wallL} onChange={(e) => setWallL(e.target.value)} type="number" />
                  <Select value={wallLUnit} onValueChange={setWallLUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Width (Thickness)</Label>
                <div className="flex gap-2">
                  <Input value={wallW} onChange={(e) => setWallW(e.target.value)} type="number" />
                  <Select value={wallWUnit} onValueChange={setWallWUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="Inch">in</SelectItem>
                      <SelectItem value="Feet">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Height</Label>
                <div className="flex gap-2">
                  <Input value={wallH} onChange={(e) => setWallH(e.target.value)} type="number" />
                  <Select value={wallHUnit} onValueChange={setWallHUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">ft</SelectItem>
                      <SelectItem value="m">m</SelectItem>
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
            <CardTitle>B. Block Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-[200px] pb-4">
              <Label>Block Type</Label>
              <Select value={blockType} onValueChange={setBlockType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Block</SelectItem>
                  <SelectItem value="hollow">Hollow Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Length</Label>
                <div className="flex gap-2">
                  <Input value={blockL} onChange={(e) => setBlockL(e.target.value)} type="number" />
                  <Select value={blockLUnit} onValueChange={setBlockLUnit}>
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
                <Label>Width</Label>
                <div className="flex gap-2">
                  <Input value={blockW} onChange={(e) => setBlockW(e.target.value)} type="number" />
                  <Select value={blockWUnit} onValueChange={setBlockWUnit}>
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
                <Label>Height</Label>
                <div className="flex gap-2">
                  <Input value={blockH} onChange={(e) => setBlockH(e.target.value)} type="number" />
                  <Select value={blockHUnit} onValueChange={setBlockHUnit}>
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
            <CardTitle>C. Openings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Door Length</Label>
                <Input value={doorL} onChange={(e) => setDoorL(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Door Height</Label>
                <Input value={doorH} onChange={(e) => setDoorH(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={doorUnit} onValueChange={setDoorUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="m">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input value={doorQty} onChange={(e) => setDoorQty(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Window Length</Label>
                <Input value={windowL} onChange={(e) => setWindowL(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Window Height</Label>
                <Input value={windowH} onChange={(e) => setWindowH(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={windowUnit} onValueChange={setWindowUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="m">Meter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input value={windowQty} onChange={(e) => setWindowQty(e.target.value)} type="number" />
              </div>
            </div>

            <div className="space-y-2 max-w-[200px]">
              <Label>Other Opening Area (Sq.Ft)</Label>
              <Input value={otherArea} onChange={(e) => setOtherArea(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>D. Mortar & Cement</CardTitle>
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
                <Label>Mortar Thick (mm)</Label>
                <Input value={mortarThick} onChange={(e) => setMortarThick(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Dry Vol Multiplier</Label>
                <Input value={dryMulti} onChange={(e) => setDryMulti(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (USD)</SelectItem>
                    <SelectItem value="Rs.">Rs. (Rupees)</SelectItem>
                    <SelectItem value="RWF">RWF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cost per Block</Label>
                <Input value={costPerBlock} onChange={(e) => setCostPerBlock(e.target.value)} type="number" />
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
            <AccordionTrigger>How to calculate concrete blocks for a wall?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-decimal pl-5 space-y-2">
                <li><strong>Convert dimensions to meters:</strong> Standardizes all wall, block, and opening metrics.</li>
                <li><strong>Net Wall Volume:</strong> Wall Volume (L×W×H) minus Volume of all openings.</li>
                <li><strong>Block Volume with Mortar:</strong> Adds the mortar thickness to the Block dimensions.</li>
                <li><strong>Number of Blocks:</strong> Divide the Net Wall Volume by the Block Volume with Mortar.</li>
                <li><strong>Mortar Volume:</strong> Net Wall Volume minus the pure volume of blocks (without mortar).</li>
                <li><strong>Material Quantities:</strong> Multiplies the Wet Mortar by the Dry Volume Multiplier, then applies the Cement:Sand ratio.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Blocks & Mortar Estimate</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Net Wall Vol</span>
                  <span className="font-medium text-sm">{results.netWallVol.toFixed(3)} m³</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Blocks Required</span>
                  <span className="font-bold text-lg text-primary">{results.blockCount} Nos.</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Cement Required</span>
                  <span className="font-medium text-sm">{results.cementKg.toFixed(2)} Kg</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Cement Bags</span>
                  <span className="font-bold text-sm text-primary">{results.cementBags.toFixed(2)} Bags</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground text-sm">Sand Required</span>
                  <span className="font-medium text-sm">{results.sandVol.toFixed(3)} m³</span>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-base font-bold">Total Block Cost</span>
                  <span className="font-black text-xl text-primary">
                    {currency}{results.totalBlockCost.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cuboid"><path d="m21.12 6.4-6.05-4.06a2 2 0 0 0-2.14 0L2.88 6.4a2 2 0 0 0-1.06 1.8v8.6a2 2 0 0 0 1.06 1.8l10.05 6.06a2 2 0 0 0 2.14 0l6.05-4.06a2 2 0 0 0 1.06-1.8V8.2a2 2 0 0 0-1.06-1.8Z"/><path d="M22 8 12 14.5 2 8"/><path d="M12 22v-7.5"/></svg>
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
