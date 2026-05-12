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

export const ContinuousBeamCalculator = () => {
  // Dimensions
  const [clearSpan, setClearSpan] = useState("4000");
  const [clearSpanUnit, setClearSpanUnit] = useState("mm");
  
  const [leftSupport, setLeftSupport] = useState("300");
  const [leftSupportUnit, setLeftSupportUnit] = useState("mm");
  
  const [rightSupport, setRightSupport] = useState("300");
  const [rightSupportUnit, setRightSupportUnit] = useState("mm");
  
  const [depth, setDepth] = useState("450");
  const [depthUnit, setDepthUnit] = useState("mm");
  
  const [width, setWidth] = useState("300");
  const [widthUnit, setWidthUnit] = useState("mm");
  
  const [numBeams, setNumBeams] = useState("1");
  const [clearCover, setClearCover] = useState("40");

  // Rebar Details
  const [topDia, setTopDia] = useState("12");
  const [topCount, setTopCount] = useState("3");
  
  const [botDia, setBotDia] = useState("16");
  const [botCount, setBotCount] = useState("4");
  
  const [stirrupDia, setStirrupDia] = useState("8");
  const [stirrupSpacing, setStirrupSpacing] = useState("150");

  // Results
  const [results, setResults] = useState<{
    topBar: { dia: number; countPerBeam: number; totalCount: number; cutLengthM: number; totalLengthM: number; weightKg: number };
    botBar: { dia: number; countPerBeam: number; totalCount: number; cutLengthM: number; totalLengthM: number; weightKg: number };
    stirrups: { dia: number; countPerBeam: number; totalCount: number; cutLengthM: number; totalLengthM: number; weightKg: number };
    totalWeight: number;
  } | null>(null);

  const handleCalculate = () => {
    // Convert inputs to mm
    const L = toMm(parseFloat(clearSpan) || 0, clearSpanUnit);
    const suppL = toMm(parseFloat(leftSupport) || 0, leftSupportUnit);
    const suppR = toMm(parseFloat(rightSupport) || 0, rightSupportUnit);
    const D = toMm(parseFloat(depth) || 0, depthUnit);
    const W = toMm(parseFloat(width) || 0, widthUnit);
    const cover = parseFloat(clearCover) || 0;
    const nBeams = parseFloat(numBeams) || 1;

    // Top Bars
    const dTop = parseFloat(topDia) || 0;
    const nTop = parseFloat(topCount) || 0;
    const straightLength = L + suppL + suppR - (2 * cover);
    const hookLength = D - (2 * cover);
    const bendDeductionTop = 2 * 2 * dTop; // 2 bends of 90 degrees (each 2d)
    const cutLengthTopMm = straightLength + (2 * hookLength) - bendDeductionTop;
    const cutLengthTopM = cutLengthTopMm / 1000;
    const totalTopBars = nTop * nBeams;
    const totalTopLengthM = cutLengthTopM * totalTopBars;
    const weightTop = (Math.pow(dTop, 2) / 162) * totalTopLengthM;

    // Bottom Bars
    const dBot = parseFloat(botDia) || 0;
    const nBot = parseFloat(botCount) || 0;
    const bendDeductionBot = 2 * 2 * dBot;
    const cutLengthBotMm = straightLength + (2 * hookLength) - bendDeductionBot;
    const cutLengthBotM = cutLengthBotMm / 1000;
    const totalBotBars = nBot * nBeams;
    const totalBotLengthM = cutLengthBotM * totalBotBars;
    const weightBot = (Math.pow(dBot, 2) / 162) * totalBotLengthM;

    // Stirrups
    const dStirrup = parseFloat(stirrupDia) || 0;
    const spacing = parseFloat(stirrupSpacing) || 150;
    const A = W - (2 * cover);
    const B = D - (2 * cover);
    // Cut length = Perimeter + Hook allowance (20d commonly used in simplified calculation)
    const cutLengthStirrupMm = 2 * (A + B) + (20 * dStirrup);
    const cutLengthStirrupM = cutLengthStirrupMm / 1000;
    
    const countStirrupsPerBeam = Math.ceil(L / spacing) + 1;
    const totalStirrups = countStirrupsPerBeam * nBeams;
    const totalStirrupLengthM = cutLengthStirrupM * totalStirrups;
    const weightStirrup = (Math.pow(dStirrup, 2) / 162) * totalStirrupLengthM;

    setResults({
      topBar: { dia: dTop, countPerBeam: nTop, totalCount: totalTopBars, cutLengthM: cutLengthTopM, totalLengthM: totalTopLengthM, weightKg: weightTop },
      botBar: { dia: dBot, countPerBeam: nBot, totalCount: totalBotBars, cutLengthM: cutLengthBotM, totalLengthM: totalBotLengthM, weightKg: weightBot },
      stirrups: { dia: dStirrup, countPerBeam: countStirrupsPerBeam, totalCount: totalStirrups, cutLengthM: cutLengthStirrupM, totalLengthM: totalStirrupLengthM, weightKg: weightStirrup },
      totalWeight: weightTop + weightBot + weightStirrup,
    });
  };

  const handleReset = () => {
    setClearSpan("4000"); setClearSpanUnit("mm");
    setLeftSupport("300"); setLeftSupportUnit("mm");
    setRightSupport("300"); setRightSupportUnit("mm");
    setDepth("450"); setDepthUnit("mm");
    setWidth("300"); setWidthUnit("mm");
    setNumBeams("1"); setClearCover("40");
    setTopDia("12"); setTopCount("3");
    setBotDia("16"); setBotCount("4");
    setStirrupDia("8"); setStirrupSpacing("150");
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
                <Label>Clear Span</Label>
                <div className="flex gap-2">
                  <Input value={clearSpan} onChange={(e) => setClearSpan(e.target.value)} type="number" />
                  <Select value={clearSpanUnit} onValueChange={setClearSpanUnit}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label>Left Support</Label>
                <div className="flex gap-2">
                  <Input value={leftSupport} onChange={(e) => setLeftSupport(e.target.value)} type="number" />
                  <Select value={leftSupportUnit} onValueChange={setLeftSupportUnit}>
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
                <Label>Right Support</Label>
                <div className="flex gap-2">
                  <Input value={rightSupport} onChange={(e) => setRightSupport(e.target.value)} type="number" />
                  <Select value={rightSupportUnit} onValueChange={setRightSupportUnit}>
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
                <Label>Beam Depth</Label>
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
              <div className="space-y-2">
                <Label>Beam Width</Label>
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
                <Label>No. of Beams</Label>
                <Input value={numBeams} onChange={(e) => setNumBeams(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B. Reinforcement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Top Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Top Main Bars Dia (mm)</Label>
                <Select value={topDia} onValueChange={setTopDia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Top Bars</Label>
                <Input value={topCount} onChange={(e) => setTopCount(e.target.value)} type="number" />
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Bottom Main Bars Dia (mm)</Label>
                <Select value={botDia} onValueChange={setBotDia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of Bottom Bars</Label>
                <Input value={botCount} onChange={(e) => setBotCount(e.target.value)} type="number" />
              </div>
            </div>

            {/* Stirrups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Stirrup Dia (mm)</Label>
                <Select value={stirrupDia} onValueChange={setStirrupDia}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[6, 8, 10, 12].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stirrup Spacing c/c (mm)</Label>
                <Input value={stirrupSpacing} onChange={(e) => setStirrupSpacing(e.target.value)} type="number" />
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
            <AccordionTrigger>How is the Continuous Beam BBS calculated?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Straight Length:</strong> `Clear Span + Left Support + Right Support - (2 × Clear Cover)`.</li>
                <li><strong>Main Bars Cut Length:</strong> `Straight Length + (2 × Hook Length) - (2 × 90° Bend Deductions)`. The Hook Length is taken as `Depth - 2 × Cover`.</li>
                <li><strong>Stirrups Cut Length:</strong> `2 × (A + B) + 20d`, where A and B are the internal dimensions of the stirrup (Width and Depth minus clear covers).</li>
                <li><strong>Number of Stirrups:</strong> `(Clear Span / Spacing) + 1`.</li>
                <li><strong>Weight per meter:</strong> `D² / 162` is used to determine the standard Kg/m weight of steel.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[500px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Bar Bending Schedule</CardTitle>
            <CardDescription>Continuous Beam Output</CardDescription>
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
                        <td className="px-3 py-2">Top Bars</td>
                        <td className="px-3 py-2">{results.topBar.dia}</td>
                        <td className="px-3 py-2">{results.topBar.totalCount}</td>
                        <td className="px-3 py-2">{results.topBar.cutLengthM.toFixed(3)}</td>
                        <td className="px-3 py-2 font-medium">{results.topBar.weightKg.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-2">Bot Bars</td>
                        <td className="px-3 py-2">{results.botBar.dia}</td>
                        <td className="px-3 py-2">{results.botBar.totalCount}</td>
                        <td className="px-3 py-2">{results.botBar.cutLengthM.toFixed(3)}</td>
                        <td className="px-3 py-2 font-medium">{results.botBar.weightKg.toFixed(2)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-3 py-2">Stirrups</td>
                        <td className="px-3 py-2">{results.stirrups.dia}</td>
                        <td className="px-3 py-2">{results.stirrups.totalCount}</td>
                        <td className="px-3 py-2">{results.stirrups.cutLengthM.toFixed(3)}</td>
                        <td className="px-3 py-2 font-medium">{results.stirrups.weightKg.toFixed(2)}</td>
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
