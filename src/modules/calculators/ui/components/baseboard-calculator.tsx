"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Unit conversion helper to feet
const toFeet = (value: number, unit: string) => {
  if (isNaN(value)) return 0;
  switch (unit) {
    case "m": return value * 3.28084;
    case "Inch": return value / 12;
    case "mm": return value * 0.00328084;
    case "Feet": return value;
    default: return value;
  }
};

export const BaseboardCalculator = () => {
  // Dimensions
  const [roomLength, setRoomLength] = useState("16");
  const [roomLengthUnit, setRoomLengthUnit] = useState("Feet");
  
  const [roomWidth, setRoomWidth] = useState("20");
  const [roomWidthUnit, setRoomWidthUnit] = useState("Feet");

  // Doors
  const [numDoors, setNumDoors] = useState("2");
  const [doorWidth, setDoorWidth] = useState("3");
  const [doorWidthUnit, setDoorWidthUnit] = useState("Feet");

  // Baseboard
  const [sectionLength, setSectionLength] = useState("12");
  const [sectionLengthUnit, setSectionLengthUnit] = useState("Feet");

  // Costs
  const [costPerFoot, setCostPerFoot] = useState("3.50");
  const [installCostPerFoot, setInstallCostPerFoot] = useState("2.00");
  const [currency, setCurrency] = useState("$");

  // Results
  const [results, setResults] = useState<{
    perimeter: number;
    deductions: number;
    netLength: number;
    sections: number;
    materialCost: number;
    installCost: number;
    totalCost: number;
  } | null>(null);

  const handleCalculate = () => {
    // 1. Convert all measurements to feet
    const rL = toFeet(parseFloat(roomLength), roomLengthUnit);
    const rW = toFeet(parseFloat(roomWidth), roomWidthUnit);
    
    const dNum = parseFloat(numDoors) || 0;
    const dW = toFeet(parseFloat(doorWidth), doorWidthUnit);
    
    const sL = toFeet(parseFloat(sectionLength), sectionLengthUnit);

    // 2. Perimeter and Deductions
    const perimeter = (rL * 2) + (rW * 2);
    const deductions = dNum * dW;
    const netLength = Math.max(0, perimeter - deductions);

    // 3. Number of sections (Must buy whole sections)
    const sections = sL > 0 ? Math.ceil(netLength / sL) : 0;

    // 4. Costs
    const cRate = parseFloat(costPerFoot) || 0;
    const iRate = parseFloat(installCostPerFoot) || 0;

    // Based on actual required length
    const materialCost = netLength * cRate;
    const installCost = netLength * iRate;
    const totalCost = materialCost + installCost;

    setResults({
      perimeter,
      deductions,
      netLength,
      sections,
      materialCost,
      installCost,
      totalCost,
    });
  };

  const handleReset = () => {
    setRoomLength("16"); setRoomLengthUnit("Feet");
    setRoomWidth("20"); setRoomWidthUnit("Feet");
    setNumDoors("2");
    setDoorWidth("3"); setDoorWidthUnit("Feet");
    setSectionLength("12"); setSectionLengthUnit("Feet");
    setCostPerFoot("3.50");
    setInstallCostPerFoot("2.00");
    setCurrency("$");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) Room Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Length</Label>
                <div className="flex gap-2">
                  <Input value={roomLength} onChange={(e) => setRoomLength(e.target.value)} type="number" />
                  <Select value={roomLengthUnit} onValueChange={setRoomLengthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Room Width</Label>
                <div className="flex gap-2">
                  <Input value={roomWidth} onChange={(e) => setRoomWidth(e.target.value)} type="number" />
                  <Select value={roomWidthUnit} onValueChange={setRoomWidthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Door Deductions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Doors</Label>
                <Input value={numDoors} onChange={(e) => setNumDoors(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Width of Each Door</Label>
                <div className="flex gap-2">
                  <Input value={doorWidth} onChange={(e) => setDoorWidth(e.target.value)} type="number" />
                  <Select value={doorWidthUnit} onValueChange={setDoorWidthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3) Materials & Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
              <div className="space-y-2">
                <Label>Baseboard Section Length</Label>
                <div className="flex gap-2">
                  <Input value={sectionLength} onChange={(e) => setSectionLength(e.target.value)} type="number" />
                  <Select value={sectionLengthUnit} onValueChange={setSectionLengthUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feet">Feet</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Inch">Inch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ (USD)</SelectItem>
                    <SelectItem value="Rs.">Rs. (Rupees)</SelectItem>
                    <SelectItem value="RWF">RWF</SelectItem>
                    <SelectItem value="€">€ (Euro)</SelectItem>
                    <SelectItem value="£">£ (Pound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost per Linear Foot</Label>
                <Input value={costPerFoot} onChange={(e) => setCostPerFoot(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Installation Charge per Foot</Label>
                <Input value={installCostPerFoot} onChange={(e) => setInstallCostPerFoot(e.target.value)} type="number" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate Baseboard
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger>How to calculate baseboards for a room?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-decimal pl-5 space-y-2">
                <li><strong>Total Perimeter:</strong> Multiply Room Length by 2 and Width by 2, then sum them up.</li>
                <li><strong>Subtract Doors:</strong> Multiply the Number of Doors by the Door Width to get total deductions.</li>
                <li><strong>Net Length:</strong> Perimeter minus Door Deductions gives the actual linear feet of baseboard needed.</li>
                <li><strong>Number of Sections:</strong> Divide the Net Length by the Baseboard Section Length and round up to the nearest whole section.</li>
                <li><strong>Total Cost:</strong> Multiply the Net Length by the combined Material and Installation rate per foot.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Baseboard Estimate</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Room Perimeter</span>
                  <span className="font-medium text-sm">{results.perimeter.toFixed(2)} ft</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Door Deductions</span>
                  <span className="font-medium text-sm text-destructive">-{results.deductions.toFixed(2)} ft</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Total Linear Feet Needed</span>
                  <span className="font-bold text-sm text-primary">{results.netLength.toFixed(2)} ft</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Number of Sections Req.</span>
                  <span className="font-bold text-lg">{results.sections} Nos</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Material Cost</span>
                  <span className="font-medium text-sm">
                    {currency}{results.materialCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Installation Cost</span>
                  <span className="font-medium text-sm">
                    {currency}{results.installCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-base font-bold">Total Cost</span>
                  <span className="font-black text-xl text-primary">
                    {currency}{results.totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ruler"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>
                </div>
                <p>Fill the form and click Calculate Baseboard to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
