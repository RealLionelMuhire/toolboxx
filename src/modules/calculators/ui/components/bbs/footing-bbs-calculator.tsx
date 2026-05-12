"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Unit conversion helpers
const feetToMm = (feet: number) => feet * 304.8;
const mmToFeet = (mm: number) => mm / 304.8;

export const FootingBBSCalculator = () => {
  // Dimensions
  const [lenAB, setLenAB] = useState("5");
  const [lenBC, setLenBC] = useState("5");
  const [heightRaft, setHeightRaft] = useState("160");
  const [clearCover, setClearCover] = useState("40");

  // Rebar Details
  const [diaAB, setDiaAB] = useState("16");
  const [diaBC, setDiaBC] = useState("16");
  const [spacingAB, setSpacingAB] = useState("150");
  const [spacingBC, setSpacingBC] = useState("150");
  const [numFootings, setNumFootings] = useState("1");

  // Results
  const [results, setResults] = useState<{
    barsAB: {
      dia: number;
      count: number;
      cuttingLengthFt: number;
      totalLengthFt: number;
      totalWeightKg: number;
    };
    barsBC: {
      dia: number;
      count: number;
      cuttingLengthFt: number;
      totalLengthFt: number;
      totalWeightKg: number;
    };
    grandTotalWeight: number;
  } | null>(null);

  const handleCalculate = () => {
    const lAB_mm = feetToMm(parseFloat(lenAB) || 0);
    const lBC_mm = feetToMm(parseFloat(lenBC) || 0);
    const hRaft = parseFloat(heightRaft) || 0;
    const cover = parseFloat(clearCover) || 0;

    const dAB = parseFloat(diaAB) || 0;
    const dBC = parseFloat(diaBC) || 0;
    const spAB = parseFloat(spacingAB) || 1;
    const spBC = parseFloat(spacingBC) || 1;
    const nF = parseFloat(numFootings) || 1;

    // Number of bars calculation
    // Bars ALONG A-B are distributed across B-C width
    const distributionLengthBC = lBC_mm - (2 * cover);
    const countAB_per_footing = Math.ceil(distributionLengthBC / spAB) + 1;
    const totalCountAB = countAB_per_footing * nF;

    // Bars ALONG B-C are distributed across A-B length
    const distributionLengthAB = lAB_mm - (2 * cover);
    const countBC_per_footing = Math.ceil(distributionLengthAB / spBC) + 1;
    const totalCountBC = countBC_per_footing * nF;

    // Cutting length calculation (U-shape: Base + 2 Legs - 2 Bends)
    // Horizontal base length
    const baseLengthAB = lAB_mm - (2 * cover);
    const baseLengthBC = lBC_mm - (2 * cover);

    // Vertical legs length
    const legLength = hRaft - (2 * cover);

    // Bend deductions (Two 90 degree bends = 2 * 2d = 4d)
    const bendDeductionAB = 4 * dAB;
    const bendDeductionBC = 4 * dBC;

    const cuttingLengthAB_mm = baseLengthAB + (2 * legLength) - bendDeductionAB;
    const cuttingLengthBC_mm = baseLengthBC + (2 * legLength) - bendDeductionBC;

    const cuttingLengthAB_ft = mmToFeet(cuttingLengthAB_mm);
    const cuttingLengthBC_ft = mmToFeet(cuttingLengthBC_mm);

    // Total Lengths
    const totalLengthAB_ft = cuttingLengthAB_ft * totalCountAB;
    const totalLengthBC_ft = cuttingLengthBC_ft * totalCountBC;

    // Total Weights (Weight = d^2 * L(ft) / 533)
    const totalWeightAB = (Math.pow(dAB, 2) * totalLengthAB_ft) / 533;
    const totalWeightBC = (Math.pow(dBC, 2) * totalLengthBC_ft) / 533;

    setResults({
      barsAB: {
        dia: dAB,
        count: totalCountAB,
        cuttingLengthFt: cuttingLengthAB_ft,
        totalLengthFt: totalLengthAB_ft,
        totalWeightKg: totalWeightAB,
      },
      barsBC: {
        dia: dBC,
        count: totalCountBC,
        cuttingLengthFt: cuttingLengthBC_ft,
        totalLengthFt: totalLengthBC_ft,
        totalWeightKg: totalWeightBC,
      },
      grandTotalWeight: totalWeightAB + totalWeightBC,
    });
  };

  const handleReset = () => {
    setLenAB("5");
    setLenBC("5");
    setHeightRaft("160");
    setClearCover("40");
    setDiaAB("16");
    setDiaBC("16");
    setSpacingAB("150");
    setSpacingBC("150");
    setNumFootings("1");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A. Footing Dimensions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Length of Footing along A-B (feet)</Label>
                <Input value={lenAB} onChange={(e) => setLenAB(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Length of Footing along B-C (feet)</Label>
                <Input value={lenBC} onChange={(e) => setLenBC(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Height of Raft (mm)</Label>
                <Input value={heightRaft} onChange={(e) => setHeightRaft(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Clear Cover (mm)</Label>
                <Input value={clearCover} onChange={(e) => setClearCover(e.target.value)} type="number" />
              </div>
            </div>
            <div className="space-y-2 max-w-[200px] pt-2">
              <Label>No. of Footing</Label>
              <Input value={numFootings} onChange={(e) => setNumFootings(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B. Reinforcement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label>Dia of bar along A-B (mm)</Label>
                <Select value={diaAB} onValueChange={setDiaAB}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Spacing along A-B (mm)</Label>
                <Input value={spacingAB} onChange={(e) => setSpacingAB(e.target.value)} type="number" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dia of bar along B-C (mm)</Label>
                <Select value={diaBC} onValueChange={setDiaBC}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Spacing along B-C (mm)</Label>
                <Input value={spacingBC} onChange={(e) => setSpacingBC(e.target.value)} type="number" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate BBS
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="formulas">
            <AccordionTrigger>General Formulas for Cutting Length & Weight</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Cutting Length:</strong> Perimeter of Shape + Total Hook Length - Total Bend Length.</li>
                <li><strong>90° Bend Deduction:</strong> 2d (where d = Diameter of Bar). A U-shaped footing bar has two 90° bends (deduction = 4d).</li>
                <li><strong>Number of Bars:</strong> <code>(Distribution Length / Spacing) + 1</code>.</li>
                <li><strong>Weight in feet:</strong> <code>Weight (Kg) = (d² × Length in ft) / 533</code></li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[450px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Bar Bending Schedule</CardTitle>
            <CardDescription>Footing Reinforcement Details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-6">
                
                {/* Bar A-B */}
                <div className="space-y-2 border rounded-md p-3">
                  <h4 className="font-semibold text-primary border-b pb-1 mb-2">Bars along (A-B)</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Diameter:</span>
                    <span className="font-medium text-right">{results.barsAB.dia} mm</span>
                    
                    <span className="text-muted-foreground">No. of Bars:</span>
                    <span className="font-medium text-right">{results.barsAB.count}</span>
                    
                    <span className="text-muted-foreground">Cutting Length/pc:</span>
                    <span className="font-medium text-right">{results.barsAB.cuttingLengthFt.toFixed(2)} ft</span>
                    
                    <span className="text-muted-foreground">Total Length:</span>
                    <span className="font-medium text-right">{results.barsAB.totalLengthFt.toFixed(2)} ft</span>
                    
                    <span className="text-muted-foreground font-semibold">Weight:</span>
                    <span className="font-bold text-right">{results.barsAB.totalWeightKg.toFixed(2)} Kg</span>
                  </div>
                </div>

                {/* Bar B-C */}
                <div className="space-y-2 border rounded-md p-3">
                  <h4 className="font-semibold text-primary border-b pb-1 mb-2">Bars along (B-C)</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Diameter:</span>
                    <span className="font-medium text-right">{results.barsBC.dia} mm</span>
                    
                    <span className="text-muted-foreground">No. of Bars:</span>
                    <span className="font-medium text-right">{results.barsBC.count}</span>
                    
                    <span className="text-muted-foreground">Cutting Length/pc:</span>
                    <span className="font-medium text-right">{results.barsBC.cuttingLengthFt.toFixed(2)} ft</span>
                    
                    <span className="text-muted-foreground">Total Length:</span>
                    <span className="font-medium text-right">{results.barsBC.totalLengthFt.toFixed(2)} ft</span>
                    
                    <span className="text-muted-foreground font-semibold">Weight:</span>
                    <span className="font-bold text-right">{results.barsBC.totalWeightKg.toFixed(2)} Kg</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 px-1">
                  <span className="text-muted-foreground text-base font-bold">Total Weight</span>
                  <span className="font-black text-2xl text-primary">{results.grandTotalWeight.toFixed(2)} Kg</span>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table-properties"><path d="M15 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M21 9H3"/><path d="M21 15H3"/></svg>
                </div>
                <p>Fill the form and click Calculate BBS to view schedule.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
