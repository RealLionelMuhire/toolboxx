"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Unit conversion helper to mm
const toMm = (value: number, unit: string) => {
  if (isNaN(value)) return 0;
  switch (unit) {
    case "m": return value * 1000;
    case "ft": return value * 304.8;
    case "in": return value * 25.4;
    case "mm": return value;
    default: return value;
  }
};

export const ColumnBBSCalculator = () => {
  // Dimensions
  const [colHeight, setColHeight] = useState("3000");
  const [colHeightUnit, setColHeightUnit] = useState("mm");
  
  const [footingShoe, setFootingShoe] = useState("300");
  const [footingShoeUnit, setFootingShoeUnit] = useState("mm");
  
  const [width, setWidth] = useState("400");
  const [widthUnit, setWidthUnit] = useState("mm");
  
  const [depth, setDepth] = useState("400");
  const [depthUnit, setDepthUnit] = useState("mm");

  const [colShape, setColShape] = useState("rectangular");
  const [tieArrangement, setTieArrangement] = useState("single");
  const [numCols, setNumCols] = useState("1");
  const [clearCover, setClearCover] = useState("40");

  // Rebar Details
  const [cornerDia, setCornerDia] = useState("16");
  const [cornerCount, setCornerCount] = useState("4");
  
  const [sideDia, setSideDia] = useState("12");
  const [sideCount, setSideCount] = useState("6");
  
  const [tieDia, setTieDia] = useState("8");
  const [tieSpacing, setTieSpacing] = useState("150");

  // Results
  const [results, setResults] = useState<{
    cornerBars: { dia: number; countPerCol: number; totalCount: number; cutLengthM: number; totalLengthM: number; weightKg: number };
    sideBars: { dia: number; countPerCol: number; totalCount: number; cutLengthM: number; totalLengthM: number; weightKg: number };
    ties: { dia: number; countPerCol: number; totalCount: number; cutLengthM: number; totalLengthM: number; weightKg: number };
    totalWeight: number;
  } | null>(null);

  const handleCalculate = () => {
    // Convert inputs to mm
    const H = toMm(parseFloat(colHeight) || 0, colHeightUnit);
    const shoeL = toMm(parseFloat(footingShoe) || 0, footingShoeUnit);
    const W = toMm(parseFloat(width) || 0, widthUnit);
    const D = toMm(parseFloat(depth) || 0, depthUnit);
    const cover = parseFloat(clearCover) || 0;
    const nCols = parseFloat(numCols) || 1;

    // Corner Bars
    const dCorner = parseFloat(cornerDia) || 0;
    const nCorner = parseFloat(cornerCount) || 0;
    // Cut Length = Height + Shoe - Bend Deduction (one 90 deg bend = 2d)
    const cutLengthCornerMm = H + shoeL - (2 * dCorner);
    const cutLengthCornerM = cutLengthCornerMm / 1000;
    const totalCornerBars = nCorner * nCols;
    const totalCornerLengthM = cutLengthCornerM * totalCornerBars;
    const weightCorner = (Math.pow(dCorner, 2) / 162) * totalCornerLengthM;

    // Side Bars
    const dSide = parseFloat(sideDia) || 0;
    const nSide = parseFloat(sideCount) || 0;
    const cutLengthSideMm = H + shoeL - (2 * dSide);
    const cutLengthSideM = cutLengthSideMm / 1000;
    const totalSideBars = nSide * nCols;
    const totalSideLengthM = cutLengthSideM * totalSideBars;
    const weightSide = (Math.pow(dSide, 2) / 162) * totalSideLengthM;

    // Lateral Ties
    const dTie = parseFloat(tieDia) || 0;
    const spacing = parseFloat(tieSpacing) || 150;
    const A = W - (2 * cover);
    const B = D - (2 * cover);
    // Cut length = Perimeter + Hook allowance (20d commonly used in simplified calculation)
    const cutLengthTieMm = 2 * (A + B) + (20 * dTie);
    const cutLengthTieM = cutLengthTieMm / 1000;
    
    // Number of ties = (Height / Spacing) + 1
    const countTiesPerCol = Math.ceil(H / spacing) + 1;
    const totalTies = countTiesPerCol * nCols;
    const totalTieLengthM = cutLengthTieM * totalTies;
    const weightTie = (Math.pow(dTie, 2) / 162) * totalTieLengthM;

    setResults({
      cornerBars: { dia: dCorner, countPerCol: nCorner, totalCount: totalCornerBars, cutLengthM: cutLengthCornerM, totalLengthM: totalCornerLengthM, weightKg: weightCorner },
      sideBars: { dia: dSide, countPerCol: nSide, totalCount: totalSideBars, cutLengthM: cutLengthSideM, totalLengthM: totalSideLengthM, weightKg: weightSide },
      ties: { dia: dTie, countPerCol: countTiesPerCol, totalCount: totalTies, cutLengthM: cutLengthTieM, totalLengthM: totalTieLengthM, weightKg: weightTie },
      totalWeight: weightCorner + weightSide + weightTie,
    });
  };

  const handleReset = () => {
    setColHeight("3000"); setColHeightUnit("mm");
    setFootingShoe("300"); setFootingShoeUnit("mm");
    setWidth("400"); setWidthUnit("mm");
    setDepth("400"); setDepthUnit("mm");
    setColShape("rectangular"); setTieArrangement("single");
    setNumCols("1"); setClearCover("40");
    setCornerDia("16"); setCornerCount("4");
    setSideDia("12"); setSideCount("6");
    setTieDia("8"); setTieSpacing("150");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A. Structural Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label>Column Height</Label>
                <div className="flex gap-2">
                  <Input value={colHeight} onChange={(e) => setColHeight(e.target.value)} type="number" />
                  <Select value={colHeightUnit} onValueChange={setColHeightUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                      <SelectItem value="in">in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Footing Shoe (L) Bend</Label>
                <div className="flex gap-2">
                  <Input value={footingShoe} onChange={(e) => setFootingShoe(e.target.value)} type="number" />
                  <Select value={footingShoeUnit} onValueChange={setFootingShoeUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label>Column Width</Label>
                <div className="flex gap-2">
                  <Input value={width} onChange={(e) => setWidth(e.target.value)} type="number" />
                  <Select value={widthUnit} onValueChange={setWidthUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Column Depth</Label>
                <div className="flex gap-2">
                  <Input value={depth} onChange={(e) => setDepth(e.target.value)} type="number" />
                  <Select value={depthUnit} onValueChange={setDepthUnit}>
                    <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="ft">ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Column Shape</Label>
                <Select value={colShape} onValueChange={setColShape}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangular">Square/Rectangular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tie Arrangement</Label>
                <Select value={tieArrangement} onValueChange={setTieArrangement}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Tie (Outer Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Clear Cover (mm)</Label>
                <Select value={clearCover} onValueChange={setClearCover}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 mm</SelectItem>
                    <SelectItem value="30">30 mm</SelectItem>
                    <SelectItem value="40">40 mm</SelectItem>
                    <SelectItem value="50">50 mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 max-w-[200px]">
              <Label>No. of Columns</Label>
              <Input value={numCols} onChange={(e) => setNumCols(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B. Reinforcement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Corner Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Corner Vertical Bars Dia (mm)</Label>
                <Select value={cornerDia} onValueChange={setCornerDia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Corner Bars</Label>
                <Input value={cornerCount} onChange={(e) => setCornerCount(e.target.value)} type="number" />
              </div>
            </div>

            {/* Side Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Side Vertical Bars Dia (mm)</Label>
                <Select value={sideDia} onValueChange={setSideDia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Side Bars</Label>
                <Input value={sideCount} onChange={(e) => setSideCount(e.target.value)} type="number" />
              </div>
            </div>

            {/* Ties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Lateral Tie Dia (mm)</Label>
                <Select value={tieDia} onValueChange={setTieDia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[6, 8, 10, 12].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lateral Tie Spacing c/c (mm)</Label>
                <Input value={tieSpacing} onChange={(e) => setTieSpacing(e.target.value)} type="number" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Generate BBS Table
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="formulas">
            <AccordionTrigger>How is the Column BBS calculated?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Vertical Main Bars Cut Length:</strong> `Column Height + Footing Shoe Length - (1 × 90° Bend Deduction)`. The 90° bend is deducted as `2d`.</li>
                <li><strong>Lateral Ties Cut Length:</strong> `2 × (A + B) + 20d`, where A and B are the core dimensions of the column (Width and Depth minus clear covers), and `20d` is the standard allowance for two 135° hooks.</li>
                <li><strong>Number of Lateral Ties:</strong> `(Column Height / Spacing) + 1`.</li>
                <li><strong>Weight per meter:</strong> standard `D² / 162` kg/m equation is used for all diameters.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[500px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Bar Bending Schedule</CardTitle>
            <CardDescription>Column Reinforcement Output</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 p-0 sm:p-6">
            {results ? (
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border rounded-md">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 border-b font-medium">Description</th>
                        <th className="px-3 py-2 border-b font-medium">Dia</th>
                        <th className="px-3 py-2 border-b font-medium">Total Bars</th>
                        <th className="px-3 py-2 border-b font-medium">Cut L (m)</th>
                        <th className="px-3 py-2 border-b font-medium">Wt (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-3 py-2 font-medium">Corner Bars</td>
                        <td className="px-3 py-2">{results.cornerBars.dia}</td>
                        <td className="px-3 py-2">{results.cornerBars.totalCount}</td>
                        <td className="px-3 py-2">{results.cornerBars.cutLengthM.toFixed(3)}</td>
                        <td className="px-3 py-2 font-semibold">{results.cornerBars.weightKg.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-2 font-medium">Side Bars</td>
                        <td className="px-3 py-2">{results.sideBars.dia}</td>
                        <td className="px-3 py-2">{results.sideBars.totalCount}</td>
                        <td className="px-3 py-2">{results.sideBars.cutLengthM.toFixed(3)}</td>
                        <td className="px-3 py-2 font-semibold">{results.sideBars.weightKg.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-2 font-medium">Lateral Ties</td>
                        <td className="px-3 py-2">{results.ties.dia}</td>
                        <td className="px-3 py-2">{results.ties.totalCount}</td>
                        <td className="px-3 py-2">{results.ties.cutLengthM.toFixed(3)}</td>
                        <td className="px-3 py-2 font-semibold">{results.ties.weightKg.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2 px-1 border-t">
                  <span className="text-muted-foreground text-base font-bold">Total Estimated Steel</span>
                  <span className="font-black text-2xl text-primary">{results.totalWeight.toFixed(2)} kg</span>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3 px-6">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table-properties"><path d="M15 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M21 9H3"/><path d="M21 15H3"/></svg>
                </div>
                <p>Fill the form and click Generate BBS Table to view schedule.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
