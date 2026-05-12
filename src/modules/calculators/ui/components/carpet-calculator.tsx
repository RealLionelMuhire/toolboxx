"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export const CarpetCalculator = () => {
  const [activeTab, setActiveTab] = useState("room");

  // Room Dimensions
  const [roomL, setRoomL] = useState("12");
  const [roomLUnit, setRoomLUnit] = useState("Feet");
  const [roomW, setRoomW] = useState("11");
  const [roomWUnit, setRoomWUnit] = useState("Feet");
  const [roomQty, setRoomQty] = useState("1");

  // Stairs Dimensions
  const [riser, setRiser] = useState("7");
  const [riserUnit, setRiserUnit] = useState("Inch");
  const [tread, setTread] = useState("10");
  const [treadUnit, setTreadUnit] = useState("Inch");
  const [stairWidth, setStairWidth] = useState("3");
  const [stairWidthUnit, setStairWidthUnit] = useState("Feet");
  const [numSteps, setNumSteps] = useState("13");

  // Cost and Extra
  const [carpetCost, setCarpetCost] = useState("300");
  const [installCost, setInstallCost] = useState("50");
  const [wastage, setWastage] = useState("5"); // percentage

  // Results
  const [results, setResults] = useState<{
    netAreaSqFt: number;
    wastageSqFt: number;
    totalAreaSqFt: number;
    totalAreaSqYd: number;
    materialCost: number;
    installationCost: number;
    totalCost: number;
  } | null>(null);

  const handleCalculate = () => {
    let netAreaSqFt = 0;

    if (activeTab === "room") {
      const L_ft = toFeet(parseFloat(roomL), roomLUnit);
      const W_ft = toFeet(parseFloat(roomW), roomWUnit);
      const Qty = parseFloat(roomQty) || 1;
      netAreaSqFt = L_ft * W_ft * Qty;
    } else if (activeTab === "stairs") {
      const R_ft = toFeet(parseFloat(riser), riserUnit);
      const T_ft = toFeet(parseFloat(tread), treadUnit);
      const W_ft = toFeet(parseFloat(stairWidth), stairWidthUnit);
      const N = parseFloat(numSteps) || 0;
      
      const areaPerStep = (R_ft + T_ft) * W_ft;
      netAreaSqFt = areaPerStep * N;
    }

    const wastePct = parseFloat(wastage) || 0;
    const wastageSqFt = netAreaSqFt * (wastePct / 100);
    const totalAreaSqFt = netAreaSqFt + wastageSqFt;
    const totalAreaSqYd = totalAreaSqFt / 9;

    const cRate = parseFloat(carpetCost) || 0;
    const iRate = parseFloat(installCost) || 0;

    const materialCost = totalAreaSqFt * cRate;
    const installationCost = totalAreaSqFt * iRate;
    const totalCost = materialCost + installationCost;

    setResults({
      netAreaSqFt,
      wastageSqFt,
      totalAreaSqFt,
      totalAreaSqYd,
      materialCost,
      installationCost,
      totalCost,
    });
  };

  const handleReset = () => {
    setRoomL("12"); setRoomLUnit("Feet");
    setRoomW("11"); setRoomWUnit("Feet");
    setRoomQty("1");
    setRiser("7"); setRiserUnit("Inch");
    setTread("10"); setTreadUnit("Inch");
    setStairWidth("3"); setStairWidthUnit("Feet");
    setNumSteps("13");
    setCarpetCost("300");
    setInstallCost("50");
    setWastage("5");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setResults(null); }} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="room">Room Carpet</TabsTrigger>
            <TabsTrigger value="stairs">Stairs Carpet</TabsTrigger>
          </TabsList>

          <TabsContent value="room" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Room Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Length</Label>
                    <div className="flex gap-2">
                      <Input value={roomL} onChange={(e) => setRoomL(e.target.value)} type="number" />
                      <Select value={roomLUnit} onValueChange={setRoomLUnit}>
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
                    <Label>Width</Label>
                    <div className="flex gap-2">
                      <Input value={roomW} onChange={(e) => setRoomW(e.target.value)} type="number" />
                      <Select value={roomWUnit} onValueChange={setRoomWUnit}>
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
                  <div className="space-y-2 max-w-[200px]">
                    <Label>Quantity (Nos. of Rooms)</Label>
                    <Input value={roomQty} onChange={(e) => setRoomQty(e.target.value)} type="number" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stairs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Stair Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Riser Height</Label>
                    <div className="flex gap-2">
                      <Input value={riser} onChange={(e) => setRiser(e.target.value)} type="number" />
                      <Select value={riserUnit} onValueChange={setRiserUnit}>
                        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inch">Inch</SelectItem>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="Feet">Feet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tread Depth</Label>
                    <div className="flex gap-2">
                      <Input value={tread} onChange={(e) => setTread(e.target.value)} type="number" />
                      <Select value={treadUnit} onValueChange={setTreadUnit}>
                        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inch">Inch</SelectItem>
                          <SelectItem value="mm">mm</SelectItem>
                          <SelectItem value="Feet">Feet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stair Width</Label>
                    <div className="flex gap-2">
                      <Input value={stairWidth} onChange={(e) => setStairWidth(e.target.value)} type="number" />
                      <Select value={stairWidthUnit} onValueChange={setStairWidthUnit}>
                        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Feet">Feet</SelectItem>
                          <SelectItem value="m">Meter</SelectItem>
                          <SelectItem value="Inch">Inch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2 max-w-[200px]">
                    <Label>Total number of steps</Label>
                    <Input value={numSteps} onChange={(e) => setNumSteps(e.target.value)} type="number" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Rates & Wastage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cost per Sq Ft</Label>
                <Input value={carpetCost} onChange={(e) => setCarpetCost(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Install Cost per Sq Ft</Label>
                <Input value={installCost} onChange={(e) => setInstallCost(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Wastage / Lapping (%)</Label>
                <Input value={wastage} onChange={(e) => setWastage(e.target.value)} type="number" />
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
          <AccordionItem value="room">
            <AccordionTrigger>How to calculate carpet for rooms?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Carpet cost calculator helps you to calculate the total area and cost of carpet for required area.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Convert length and width of carpet to Feet (e.g. 4 meters = 13.124 feet).</li>
                <li>Calculate the Area in Square Feet: Area = Length * Width.</li>
                <li>Convert Square Feet to Square Yards: Area (sq yards) = Area (sq ft) / 9.</li>
                <li>Add extra 3-5% of carpet for wastage and lapping.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="stairs">
            <AccordionTrigger>How to calculate carpet for stairs?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Area per Step:</strong> Add the riser height and tread depth, convert to feet, and multiply by stair width.</li>
                <li><strong>Total Stair Area:</strong> Multiply the area per step by the total number of stairs.</li>
                <li><strong>Wastage:</strong> Add 10-15% extra for cutting, lapping, and nosing overhangs.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Carpet Area & Cost</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Net Area</span>
                  <span className="font-medium text-sm">{results.netAreaSqFt.toFixed(2)} sq.ft</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Wastage Area ({wastage}%)</span>
                  <span className="font-medium text-sm">{results.wastageSqFt.toFixed(2)} sq.ft</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Total Carpet Area</span>
                  <span className="font-bold text-sm">{results.totalAreaSqFt.toFixed(2)} sq.ft</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Total Area in Yards</span>
                  <span className="font-medium text-sm">{results.totalAreaSqYd.toFixed(2)} sq.yd</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Material Cost</span>
                  <span className="font-medium text-sm text-primary">{results.materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Installation Cost</span>
                  <span className="font-medium text-sm text-primary">{results.installationCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm font-semibold">Total Cost</span>
                  <span className="font-bold text-lg text-primary">{results.totalCost.toFixed(2)}</span>
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
