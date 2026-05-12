"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const PaintingCostCalculator = () => {
  // House Dimensions
  const [storey, setStorey] = useState("1"); // 1 for Ground Floor, 2 for G+1
  const [length, setLength] = useState("36");
  const [width, setWidth] = useState("24");
  const [heightPerStorey, setHeightPerStorey] = useState("10"); // typical default

  // Doors & Windows
  const [doors, setDoors] = useState("1");
  const [windows, setWindows] = useState("1");

  // Putting
  const [puttingCoat, setPuttingCoat] = useState("1"); // 1 = Single, 2 = Double
  const [puttingRate, setPuttingRate] = useState("30");

  // Primer
  const [primerCoat, setPrimerCoat] = useState("1");
  const [primerRate, setPrimerRate] = useState("220");

  // Paint
  const [paintCoat, setPaintCoat] = useState("1");
  const [paintRate, setPaintRate] = useState("300");

  // Labour
  const [labourRate, setLabourRate] = useState("15");

  // Results
  const [results, setResults] = useState<{
    netArea: number;
    puttingQty: number;
    primerQty: number;
    paintQty: number;
    puttingCost: number;
    primerCost: number;
    paintCost: number;
    labourCost: number;
    totalCost: number;
  } | null>(null);

  const handleCalculate = () => {
    // 1. Area Calculation
    const L = parseFloat(length) || 0;
    const W = parseFloat(width) || 0;
    const S = parseFloat(storey) || 1;
    const H = parseFloat(heightPerStorey) || 10;
    
    // Perimeter of exterior walls
    const perimeter = 2 * (L + W);
    const totalHeight = S * H;
    const grossArea = perimeter * totalHeight;

    // Deductions (Standard assumes Door=21 sqft, Window=16 sqft)
    const dCount = parseFloat(doors) || 0;
    const wCount = parseFloat(windows) || 0;
    const deductions = (dCount * 21) + (wCount * 16);

    const netArea = Math.max(0, grossArea - deductions);

    // 2. Material Quantities
    // Standard Coverage Assumptions (per coat)
    const puttingCoverageSqFtPerKg = 15;
    const primerCoverageSqFtPerL = 120;
    const paintCoverageSqFtPerL = 100;

    const pCoat = parseFloat(puttingCoat) || 1;
    const prCoat = parseFloat(primerCoat) || 1;
    const ptCoat = parseFloat(paintCoat) || 1;

    // For multiple coats, coverage area effectively reduces per kg/L (or simply multiplying the required amount by coat number)
    const puttingQty = (netArea / puttingCoverageSqFtPerKg) * pCoat;
    const primerQty = (netArea / primerCoverageSqFtPerL) * prCoat;
    const paintQty = (netArea / paintCoverageSqFtPerL) * ptCoat;

    // 3. Costs
    const puttingCst = puttingQty * (parseFloat(puttingRate) || 0);
    const primerCst = primerQty * (parseFloat(primerRate) || 0);
    const paintCst = paintQty * (parseFloat(paintRate) || 0);
    const labourCst = netArea * (parseFloat(labourRate) || 0);

    const totalCst = puttingCst + primerCst + paintCst + labourCst;

    setResults({
      netArea,
      puttingQty,
      primerQty,
      paintQty,
      puttingCost: puttingCst,
      primerCost: primerCst,
      paintCost: paintCst,
      labourCost: labourCst,
      totalCost: totalCst,
    });
  };

  const handleReset = () => {
    setStorey("1");
    setLength("36");
    setWidth("24");
    setHeightPerStorey("10");
    setDoors("1");
    setWindows("1");
    setPuttingCoat("1");
    setPuttingRate("30");
    setPrimerCoat("1");
    setPrimerRate("220");
    setPaintCoat("1");
    setPaintRate("300");
    setLabourRate("15");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) House Dimensions & Openings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No of Storey?</Label>
                <Select value={storey} onValueChange={setStorey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ground Floor (1 Storey)</SelectItem>
                    <SelectItem value="2">G + 1 (2 Storeys)</SelectItem>
                    <SelectItem value="3">G + 2 (3 Storeys)</SelectItem>
                    <SelectItem value="4">G + 3 (4 Storeys)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Avg. Height per Storey (ft)</Label>
                <Input value={heightPerStorey} onChange={(e) => setHeightPerStorey(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Length of House (Feet)</Label>
                <Input value={length} onChange={(e) => setLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Width of House (Feet)</Label>
                <Input value={width} onChange={(e) => setWidth(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>No. of Doors</Label>
                <Input value={doors} onChange={(e) => setDoors(e.target.value)} type="number" />
                <p className="text-xs text-muted-foreground">Standard 3x7 ft used for deduction</p>
              </div>
              <div className="space-y-2">
                <Label>No. of Windows</Label>
                <Input value={windows} onChange={(e) => setWindows(e.target.value)} type="number" />
                <p className="text-xs text-muted-foreground">Standard 4x4 ft used for deduction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Painting Materials & Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Putting Coat</Label>
                <Select value={puttingCoat} onValueChange={setPuttingCoat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="1">Single Coat</SelectItem>
                    <SelectItem value="2">Double Coat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate of Putting (per Kg)</Label>
                <Input value={puttingRate} onChange={(e) => setPuttingRate(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Primer Coat</Label>
                <Select value={primerCoat} onValueChange={setPrimerCoat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="1">Single Coat</SelectItem>
                    <SelectItem value="2">Double Coat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate of Primer (per Liter)</Label>
                <Input value={primerRate} onChange={(e) => setPrimerRate(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Paint Coat</Label>
                <Select value={paintCoat} onValueChange={setPaintCoat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Single Coat</SelectItem>
                    <SelectItem value="2">Double Coat</SelectItem>
                    <SelectItem value="3">Triple Coat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate of Paint (per Liter)</Label>
                <Input value={paintRate} onChange={(e) => setPaintRate(e.target.value)} type="number" />
              </div>
            </div>

            <div className="space-y-2 max-w-xs">
              <Label>Labour cost per square feet</Label>
              <Input value={labourRate} onChange={(e) => setLabourRate(e.target.value)} type="number" />
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate Cost
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger>How to Calculate Painting Cost?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>This estimator calculates the exterior painting area by multiplying the house perimeter by its height, and subtracting standard deductions for doors and windows.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Area:</strong> Perimeter is 2 × (Length + Width). Average storey height is assumed 10 ft.</li>
                <li><strong>Putty (Putting):</strong> ~15 sq ft coverage per Kg for a single coat.</li>
                <li><strong>Primer:</strong> ~120 sq ft coverage per Liter for a single coat.</li>
                <li><strong>Paint:</strong> ~100 sq ft coverage per Liter for a single coat.</li>
                <li>Quantities are appropriately multiplied if Double or Triple coats are selected.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Painting Estimates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Area of Painting</span>
                  <span className="font-bold text-sm">{results.netArea.toFixed(2)} sq.ft</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Putting</span>
                  <span className="font-medium text-sm">{results.puttingQty.toFixed(2)} Kg</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Putting Cost</span>
                  <span className="font-medium text-sm text-primary">{results.puttingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Primer</span>
                  <span className="font-medium text-sm">{results.primerQty.toFixed(2)} Ltr</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Primer Cost</span>
                  <span className="font-medium text-sm text-primary">{results.primerCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Paint</span>
                  <span className="font-medium text-sm">{results.paintQty.toFixed(2)} Ltr</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Paint Cost</span>
                  <span className="font-medium text-sm text-primary">{results.paintCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Cost of Labour</span>
                  <span className="font-medium text-sm text-primary">{results.labourCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm font-semibold">Total Est. Cost</span>
                  <span className="font-bold text-lg text-primary">{results.totalCost.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>
                </div>
                <p>Fill the form and click Calculate Cost to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
