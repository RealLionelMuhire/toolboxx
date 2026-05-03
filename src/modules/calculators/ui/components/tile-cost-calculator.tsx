"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

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

const toSqFt = (areaSqM: number) => {
  return areaSqM * 10.7639;
};

export const TileCostCalculator = () => {
  // 1) Storey
  const [storey, setStorey] = useState("1");

  // Room inputs [Length, Width]
  const [bedRoom1, setBedRoom1] = useState({ l: "10", w: "12" });
  const [bedRoom2, setBedRoom2] = useState({ l: "0", w: "0" });
  const [bedRoom3, setBedRoom3] = useState({ l: "0", w: "0" });
  
  const [kitchen, setKitchen] = useState({ l: "8", w: "12" });
  const [bathroom, setBathroom] = useState({ l: "6", w: "8" });
  const [porch, setPorch] = useState({ l: "8", w: "12" });
  const [livingRoom, setLivingRoom] = useState({ l: "12", w: "14" });
  const [passage, setPassage] = useState({ l: "0", w: "0" });

  // Options
  const [skirting, setSkirting] = useState(true);
  const [tileRate, setTileRate] = useState("140");
  const [labourRate, setLabourRate] = useState("35");
  const [extraExpense, setExtraExpense] = useState("2.5");

  // Results
  const [results, setResults] = useState<{
    totalTileCost: number;
    cementBags: number;
    sandVolume: number;
    approxEstimate: number;
    totalAreaSqFt: number;
  } | null>(null);

  const calculateAreaAndPerimeter = (room: {l: string, w: string}) => {
    const l = parseFloat(room.l) || 0;
    const w = parseFloat(room.w) || 0;
    return {
      area: l * w, // sq ft
      perimeter: 2 * (l + w) // linear ft
    };
  };

  const handleCalculate = () => {
    const rooms = [bedRoom1, bedRoom2, bedRoom3, kitchen, bathroom, porch, livingRoom, passage];
    
    let totalAreaSqFt = 0;
    let totalPerimeterFt = 0;

    rooms.forEach(room => {
      const { area, perimeter } = calculateAreaAndPerimeter(room);
      if (area > 0) {
        totalAreaSqFt += area;
        totalPerimeterFt += perimeter;
      }
    });

    // Skirting calculation (Assume 0.5 feet height for skirting, typically 6 inches)
    const skirtingAreaSqFt = skirting ? totalPerimeterFt * 0.5 : 0;
    const grossAreaSqFt = totalAreaSqFt + skirtingAreaSqFt;
    
    // Storey multiplier for labour (optional, usually labour cost increases slightly per storey)
    const storeyFactor = Math.max(1, parseFloat(storey) || 1);

    // Costs
    const rateTile = parseFloat(tileRate) || 0;
    const rateLabour = parseFloat(labourRate) || 0;
    const rateSkirtingLabour = Math.max(0, rateLabour - 20); // Labour for skirting is reduced by 20

    const tileCost = grossAreaSqFt * rateTile;
    
    // Labour cost includes storey factor
    let labourCost = (totalAreaSqFt * rateLabour) * storeyFactor;
    if (skirting) {
      labourCost += (skirtingAreaSqFt * rateSkirtingLabour) * storeyFactor;
    }

    // Material calculation
    // 40 mm mortar under tile = 0.04m
    const totalAreaSqM = totalAreaSqFt / 10.7639;
    const wetVolumeM3 = totalAreaSqM * 0.04;
    const dryVolumeM3 = wetVolumeM3 * 1.2; // Note: Multiplied by 1.2 to convert to dry volume

    // Cement to Sand ratio = 1:5
    const cementVolumeM3 = dryVolumeM3 * (1 / 6);
    const sandVolumeM3 = dryVolumeM3 * (5 / 6);
    
    const cementWeightKg = cementVolumeM3 * 1440;
    const cementBags = cementWeightKg / 50;

    // Approximate cost of Cement (e.g., 400 Rs/bag) and Sand (e.g., 1500 Rs/m3) - generic defaults for estimate
    const approxCementCost = cementBags * 400; 
    const approxSandCost = sandVolumeM3 * 1500;
    
    const baseEstimate = tileCost + labourCost + approxCementCost + approxSandCost;
    const extraExpPercent = parseFloat(extraExpense) || 0;
    const approxEstimate = baseEstimate * (1 + (extraExpPercent / 100));

    setResults({
      totalTileCost: tileCost,
      cementBags: cementBags,
      sandVolume: sandVolumeM3, // returned in m3 (can convert to tractor volumes if needed)
      approxEstimate: approxEstimate,
      totalAreaSqFt: grossAreaSqFt
    });
  };

  const handleReset = () => {
    setStorey("1");
    setBedRoom1({ l: "10", w: "12" });
    setBedRoom2({ l: "0", w: "0" });
    setBedRoom3({ l: "0", w: "0" });
    setKitchen({ l: "8", w: "12" });
    setBathroom({ l: "6", w: "8" });
    setPorch({ l: "8", w: "12" });
    setLivingRoom({ l: "12", w: "14" });
    setPassage({ l: "0", w: "0" });
    setSkirting(true);
    setTileRate("140");
    setLabourRate("35");
    setExtraExpense("2.5");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>1) Tile Installation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label>Tile Installation Storey Upto?</Label>
              <Input value={storey} onChange={(e) => setStorey(e.target.value)} type="number" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="skirting" checked={skirting} onCheckedChange={setSkirting} />
              <Label htmlFor="skirting">Will you do skirting?</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Dimensions (in Feet)</CardTitle>
            <CardDescription>Enter Length × Width</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base">2) Bed Rooms</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-muted-foreground">Room 1</span>
                  <Input value={bedRoom1.l} onChange={(e) => setBedRoom1({...bedRoom1, l: e.target.value})} placeholder="L" className="w-20" />
                  <span>×</span>
                  <Input value={bedRoom1.w} onChange={(e) => setBedRoom1({...bedRoom1, w: e.target.value})} placeholder="W" className="w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-muted-foreground">Room 2</span>
                  <Input value={bedRoom2.l} onChange={(e) => setBedRoom2({...bedRoom2, l: e.target.value})} placeholder="L" className="w-20" />
                  <span>×</span>
                  <Input value={bedRoom2.w} onChange={(e) => setBedRoom2({...bedRoom2, w: e.target.value})} placeholder="W" className="w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs text-muted-foreground">Room 3</span>
                  <Input value={bedRoom3.l} onChange={(e) => setBedRoom3({...bedRoom3, l: e.target.value})} placeholder="L" className="w-20" />
                  <span>×</span>
                  <Input value={bedRoom3.w} onChange={(e) => setBedRoom3({...bedRoom3, w: e.target.value})} placeholder="W" className="w-20" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <Label>3) Kitchen</Label>
                <div className="flex items-center gap-2">
                  <Input value={kitchen.l} onChange={(e) => setKitchen({...kitchen, l: e.target.value})} placeholder="L" className="w-24" />
                  <span>×</span>
                  <Input value={kitchen.w} onChange={(e) => setKitchen({...kitchen, w: e.target.value})} placeholder="W" className="w-24" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>4) Toilet/Bathroom</Label>
                <div className="flex items-center gap-2">
                  <Input value={bathroom.l} onChange={(e) => setBathroom({...bathroom, l: e.target.value})} placeholder="L" className="w-24" />
                  <span>×</span>
                  <Input value={bathroom.w} onChange={(e) => setBathroom({...bathroom, w: e.target.value})} placeholder="W" className="w-24" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>5) Porch</Label>
                <div className="flex items-center gap-2">
                  <Input value={porch.l} onChange={(e) => setPorch({...porch, l: e.target.value})} placeholder="L" className="w-24" />
                  <span>×</span>
                  <Input value={porch.w} onChange={(e) => setPorch({...porch, w: e.target.value})} placeholder="W" className="w-24" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>6) Living Room</Label>
                <div className="flex items-center gap-2">
                  <Input value={livingRoom.l} onChange={(e) => setLivingRoom({...livingRoom, l: e.target.value})} placeholder="L" className="w-24" />
                  <span>×</span>
                  <Input value={livingRoom.w} onChange={(e) => setLivingRoom({...livingRoom, w: e.target.value})} placeholder="W" className="w-24" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>7) Passage</Label>
                <div className="flex items-center gap-2">
                  <Input value={passage.l} onChange={(e) => setPassage({...passage, l: e.target.value})} placeholder="L" className="w-24" />
                  <span>×</span>
                  <Input value={passage.w} onChange={(e) => setPassage({...passage, w: e.target.value})} placeholder="W" className="w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rates & Extras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Rate of Tile (/sq ft)</Label>
                <Input value={tileRate} onChange={(e) => setTileRate(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Rate of Labour (/sq ft)</Label>
                <Input value={labourRate} onChange={(e) => setLabourRate(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Extra Expense (%)</Label>
                <Input value={extraExpense} onChange={(e) => setExtraExpense(e.target.value)} type="number" step="0.1" />
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
            <AccordionTrigger>How to use Tile Cost Calculator for Room?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Tile Cost Calculator helps you to estimate the total area of tile required, cement, and approx estimate of the tiles or marble installation.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Step 1:</strong> Select the storey upto which you want to install tiles or marble.</li>
                <li><strong>Step 2:</strong> Input all the size of bedroom, kitchen, living room, bathroom and porch if available.</li>
                <li><strong>Step 3:</strong> Click on skirting you want to do below wall or not.</li>
                <li><strong>Step 4:</strong> Provide the local rate of tiles/marble and labour required for installation of the tiles.</li>
                <li><strong>Step 5:</strong> Click on calculate button to get result.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="note">
            <AccordionTrigger>Use Note**</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li>1/5 of the volume of cement is taken out. That is, 1 part of cement should be mixed with 5 parts of sand. Multiplied by 1.2 to convert to dry volume.</li>
                <li>If the portion of cement is changed, the quantity will also change.</li>
                <li>40 mm mortar is calculated under the tile/marble. Labor charges for skirting have been reduced by 20 rupees from floor tiling.</li>
                <li>The volume of the tractor is calculated by taking 2.5 cubic meters.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Tile & Marble installation</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Total Area Evaluated</span>
                  <span className="font-semibold">{results.totalAreaSqFt.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">sq.ft</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Total Cost of Tile/Marble</span>
                  <span className="font-semibold">{results.totalTileCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Cement</span>
                  <span className="font-semibold">{results.cementBags.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">Bags</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Quantity of Sand</span>
                  <span className="font-semibold">{results.sandVolume.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Aprox. Total Estimate</span>
                  <span className="font-bold text-lg text-primary">{results.approxEstimate.toFixed(2)}</span>
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
