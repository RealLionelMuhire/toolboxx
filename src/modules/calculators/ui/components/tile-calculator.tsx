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

// Unit conversion helper from meters to specific square units
const m2ToUnit = (valueM2: number, unit: string) => {
  if (isNaN(valueM2)) return 0;
  switch (unit) {
    case "Feet": return valueM2 * 10.7639; // m2 to sq.ft
    case "Inch": return valueM2 * 1550.0031; // m2 to sq.inch
    case "mm": return valueM2 * 1000000;
    case "m": return valueM2;
    default: return valueM2;
  }
};

export const TileCalculator = () => {
  // 1) Room Dimensions
  const [roomLength, setRoomLength] = useState("12");
  const [roomWidth, setRoomWidth] = useState("11");
  const [roomUnit, setRoomUnit] = useState("Feet");
  const [roomQuantity, setRoomQuantity] = useState("1");

  // 2) Tile Dimensions
  const [tileLength, setTileLength] = useState("2");
  const [tileWidth, setTileWidth] = useState("1.5");
  const [tileUnit, setTileUnit] = useState("Feet");

  // 3) Cost
  const [costPerSqUnit, setCostPerSqUnit] = useState("300");

  // Results
  const [results, setResults] = useState<{
    totalRoomArea: number;
    totalRoomAreaSqFt: number;
    tileArea: number;
    numberOfTiles: number;
    totalCost: number;
  } | null>(null);

  const handleCalculate = () => {
    // Room Area in meters squared
    const rL = toMeter(parseFloat(roomLength), roomUnit);
    const rW = toMeter(parseFloat(roomWidth), roomUnit);
    const rQ = parseFloat(roomQuantity) || 1;
    const roomAreaM2 = rL * rW;
    const totalRoomAreaM2 = roomAreaM2 * rQ;
    const totalRoomAreaSqFt = m2ToUnit(totalRoomAreaM2, "Feet");

    // Tile Area in meters squared
    const tL = toMeter(parseFloat(tileLength), tileUnit);
    const tW = toMeter(parseFloat(tileWidth), tileUnit);
    const tileAreaM2 = tL * tW;

    // Calculations
    const numberOfTiles = tileAreaM2 > 0 ? Math.ceil(totalRoomAreaM2 / tileAreaM2) : 0;
    
    // Assume the cost is per the room unit squared (e.g. per sq.feet if room unit is Feet)
    const costArea = roomUnit === "Feet" ? totalRoomAreaSqFt : m2ToUnit(totalRoomAreaM2, roomUnit);
    const totalCost = costArea * (parseFloat(costPerSqUnit) || 0);

    setResults({
      totalRoomArea: m2ToUnit(totalRoomAreaM2, roomUnit),
      totalRoomAreaSqFt: totalRoomAreaSqFt,
      tileArea: m2ToUnit(tileAreaM2, tileUnit),
      numberOfTiles: numberOfTiles,
      totalCost: totalCost,
    });
  };

  const handleReset = () => {
    setRoomLength("12");
    setRoomWidth("11");
    setRoomUnit("Feet");
    setRoomQuantity("1");
    
    setTileLength("2");
    setTileWidth("1.5");
    setTileUnit("Feet");
    
    setCostPerSqUnit("300");
    
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) Input Dimension of Room for Tiling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Length of Room</Label>
                <Input value={roomLength} onChange={(e) => setRoomLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Width of Room</Label>
                <Input value={roomWidth} onChange={(e) => setRoomWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={roomUnit} onValueChange={setRoomUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">Meter</SelectItem>
                    <SelectItem value="Feet">Feet</SelectItem>
                    <SelectItem value="Inch">Inch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 max-w-xs">
              <Label>Numbers of Room (e.g. 1, 2)</Label>
              <Input value={roomQuantity} onChange={(e) => setRoomQuantity(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) Tile Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Length of Tile</Label>
                <Input value={tileLength} onChange={(e) => setTileLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Width of Tile</Label>
                <Input value={tileWidth} onChange={(e) => setTileWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={tileUnit} onValueChange={setTileUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
            <CardTitle>3) Cost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-xs">
              <Label>Cost of tiles per Square {roomUnit}</Label>
              <Input value={costPerSqUnit} onChange={(e) => setCostPerSqUnit(e.target.value)} type="number" />
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
            <AccordionTrigger>Steps to Calculate no., area and cost of tiles</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Tile square footage Calculator calculates the total Area of room, Numbers of tiles required, and Total cost of tiles.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Step 1:</strong> Calculate the Area of one room (Length × Width).</li>
                <li><strong>Step 2:</strong> Multiply by the Number of Rooms to find the Total Room Area.</li>
                <li><strong>Step 3:</strong> Calculate the Area of one Tile (Length × Width). Ensure units match the room units for accurate results.</li>
                <li><strong>Step 4:</strong> Divide the Total Room Area by the Area of one Tile to find the total Number of Tiles required.</li>
                <li><strong>Step 5:</strong> Multiply the Total Room Area by the cost per square unit to find the Total Cost.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Tile material estimates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Total Area of Rooms</span>
                  <span className="font-semibold">{results.totalRoomArea.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">sq. {roomUnit.toLowerCase()}</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Area of one Tile</span>
                  <span className="font-semibold">{results.tileArea.toFixed(4)} <span className="text-xs font-normal text-muted-foreground">sq. {tileUnit.toLowerCase()}</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Total No. of Tiles</span>
                  <span className="font-semibold text-lg text-primary">{results.numberOfTiles} <span className="text-xs font-normal text-muted-foreground">Nos</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total cost of tile</span>
                  <span className="font-bold text-lg">{results.totalCost.toFixed(2)}</span>
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
