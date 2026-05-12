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

export const CrankBeamCalculator = () => {
  // A & B & C
  const [beamDepth, setBeamDepth] = useState("300");
  const [beamWidth, setBeamWidth] = useState("250");
  const [colAWidth, setColAWidth] = useState("300");
  const [colBWidth, setColBWidth] = useState("350");

  // D, E, F
  const [clearSpan, setClearSpan] = useState("12");
  const [devLengthMult, setDevLengthMult] = useState("60");
  const [clearCover, setClearCover] = useState("25");

  // G - L
  const [diaTop, setDiaTop] = useState("16");
  const [noTop, setNoTop] = useState("2");
  const [diaBot, setDiaBot] = useState("12");
  const [noBot, setNoBot] = useState("2");
  const [diaCrank, setDiaCrank] = useState("16");
  const [noCrank, setNoCrank] = useState("2");
  const [distXYDivider, setDistXYDivider] = useState("3"); // L/3

  // M - P
  const [diaStirrup, setDiaStirrup] = useState("8");
  const [spacingXY, setSpacingXY] = useState("150"); // At supports
  const [spacingYZ, setSpacingYZ] = useState("200"); // At mid span
  const [numBeams, setNumBeams] = useState("1");

  // Results
  const [results, setResults] = useState<{
    topBar: { dia: number; count: number; cl: number; tl: number; wt: number };
    botBar: { dia: number; count: number; cl: number; tl: number; wt: number };
    crankBar: { dia: number; count: number; cl: number; tl: number; wt: number };
    stirrups: { dia: number; count: number; cl: number; tl: number; wt: number };
    totalWeight: number;
  } | null>(null);

  const handleCalculate = () => {
    // Parse
    const bDepth = parseFloat(beamDepth) || 0;
    const bWidth = parseFloat(beamWidth) || 0;
    const cover = parseFloat(clearCover) || 0;
    const spanMm = feetToMm(parseFloat(clearSpan) || 0);
    const ldMult = parseFloat(devLengthMult) || 60;
    
    const dTop = parseFloat(diaTop) || 0;
    const nTop = (parseFloat(noTop) || 0) * (parseFloat(numBeams) || 1);
    
    const dBot = parseFloat(diaBot) || 0;
    const nBot = (parseFloat(noBot) || 0) * (parseFloat(numBeams) || 1);
    
    const dCrank = parseFloat(diaCrank) || 0;
    const nCrank = (parseFloat(noCrank) || 0) * (parseFloat(numBeams) || 1);
    
    const dStirrup = parseFloat(diaStirrup) || 0;
    const sXY = parseFloat(spacingXY) || 1;
    const sYZ = parseFloat(spacingYZ) || 1;
    const xyDiv = parseFloat(distXYDivider) || 3;
    const nBeams = parseFloat(numBeams) || 1;

    // 1. Top Main Bar Cutting Length = Clear Span + 2 * Ld
    const ldTop = ldMult * dTop;
    const clTopMm = spanMm + (2 * ldTop);
    const clTopFt = mmToFeet(clTopMm);
    const tlTopFt = clTopFt * nTop;
    const wtTop = (Math.pow(dTop, 2) * tlTopFt) / 533;

    // 2. Bottom Main Bar Cutting Length = Clear Span + 2 * Ld
    const ldBot = ldMult * dBot;
    const clBotMm = spanMm + (2 * ldBot);
    const clBotFt = mmToFeet(clBotMm);
    const tlBotFt = clBotFt * nBot;
    const wtBot = (Math.pow(dBot, 2) * tlBotFt) / 533;

    // 3. Crank Bar Cutting Length = Clear Span + 2 * Ld + (2 * 0.42 * D) - (4 * 1d)
    const ldCrank = ldMult * dCrank;
    // D is effective depth for crank = Beam Depth - 2*Cover - diaCrank
    const effD = bDepth - (2 * cover) - dCrank;
    const crankExtra = 2 * 0.42 * effD;
    const bendDeductionCrank = 4 * dCrank; // four 45 degree bends
    const clCrankMm = spanMm + (2 * ldCrank) + crankExtra - bendDeductionCrank;
    const clCrankFt = mmToFeet(clCrankMm);
    const tlCrankFt = clCrankFt * nCrank;
    const wtCrank = (Math.pow(dCrank, 2) * tlCrankFt) / 533;

    // 4. Stirrups
    // Cutting length = 2 * (A + B) + hook - bend deductions
    // A = Depth - 2*Cover, B = Width - 2*Cover
    const A = bDepth - (2 * cover);
    const B = bWidth - (2 * cover);
    const hookLength = 2 * 9 * dStirrup; // 2 hooks of 9d
    const bendDeductionStirrup = (3 * 2 * dStirrup) + (2 * 3 * dStirrup); // three 90 deg, two 135 deg
    const clStirrupMm = 2 * (A + B) + hookLength - bendDeductionStirrup;
    const clStirrupFt = mmToFeet(clStirrupMm);

    // Number of stirrups
    const lengthXY = spanMm / xyDiv; // distance from one support
    const lengthYZ = spanMm - (2 * lengthXY); // mid span
    
    const countXY = Math.ceil(lengthXY / sXY);
    const countYZ = Math.ceil(lengthYZ / sYZ);
    // Total stirrups per beam = (2 * countXY) + countYZ + 1 (for the very first one)
    const totalStirrupsPerBeam = (2 * countXY) + countYZ + 1;
    const nStirrups = totalStirrupsPerBeam * nBeams;

    const tlStirrupFt = clStirrupFt * nStirrups;
    const wtStirrup = (Math.pow(dStirrup, 2) * tlStirrupFt) / 533;

    setResults({
      topBar: { dia: dTop, count: nTop, cl: clTopFt, tl: tlTopFt, wt: wtTop },
      botBar: { dia: dBot, count: nBot, cl: clBotFt, tl: tlBotFt, wt: wtBot },
      crankBar: { dia: dCrank, count: nCrank, cl: clCrankFt, tl: tlCrankFt, wt: wtCrank },
      stirrups: { dia: dStirrup, count: nStirrups, cl: clStirrupFt, tl: tlStirrupFt, wt: wtStirrup },
      totalWeight: wtTop + wtBot + wtCrank + wtStirrup,
    });
  };

  const handleReset = () => {
    setBeamDepth("300"); setBeamWidth("250");
    setColAWidth("300"); setColBWidth("350");
    setClearSpan("12"); setDevLengthMult("60"); setClearCover("25");
    setDiaTop("16"); setNoTop("2");
    setDiaBot("12"); setNoBot("2");
    setDiaCrank("16"); setNoCrank("2"); setDistXYDivider("3");
    setDiaStirrup("8"); setSpacingXY("150"); setSpacingYZ("200");
    setNumBeams("1");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A. General Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label>Beam Depth (mm)</Label>
                <Input value={beamDepth} onChange={(e) => setBeamDepth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Beam Width (mm)</Label>
                <Input value={beamWidth} onChange={(e) => setBeamWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Clear Cover (mm)</Label>
                <Input value={clearCover} onChange={(e) => setClearCover(e.target.value)} type="number" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label>Clear Span AB (feet)</Label>
                <Input value={clearSpan} onChange={(e) => setClearSpan(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Dev. Length (Ld) Multiplier</Label>
                <div className="flex items-center gap-2">
                  <Input value={devLengthMult} onChange={(e) => setDevLengthMult(e.target.value)} type="number" />
                  <span className="text-muted-foreground whitespace-nowrap text-sm">x Dia</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div className="space-y-2">
                <Label>Col. Width at A (mm)</Label>
                <Input value={colAWidth} onChange={(e) => setColAWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Col. Width at B (mm)</Label>
                <Input value={colBWidth} onChange={(e) => setColBWidth(e.target.value)} type="number" />
              </div>
            </div>
            <div className="space-y-2 max-w-[200px]">
              <Label>No. of Beams</Label>
              <Input value={numBeams} onChange={(e) => setNumBeams(e.target.value)} type="number" />
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
                <Label>Dia of Top Main Bar (mm)</Label>
                <Select value={diaTop} onValueChange={setDiaTop}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. of Top Bars</Label>
                <Input value={noTop} onChange={(e) => setNoTop(e.target.value)} type="number" />
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Dia of Bottom Main Bar (mm)</Label>
                <Select value={diaBot} onValueChange={setDiaBot}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. of Bottom Bars</Label>
                <Input value={noBot} onChange={(e) => setNoBot(e.target.value)} type="number" />
              </div>
            </div>

            {/* Crank Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Dia of Crank Bar (mm)</Label>
                <Select value={diaCrank} onValueChange={setDiaCrank}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[8, 10, 12, 16, 20, 25, 32].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>No. of Crank Bars</Label>
                <Input value={noCrank} onChange={(e) => setNoCrank(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Crank Dist (L/x)</Label>
                <Select value={distXYDivider} onValueChange={setDistXYDivider}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">L / 3</SelectItem>
                    <SelectItem value="4">L / 4</SelectItem>
                    <SelectItem value="5">L / 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stirrups */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Dia. of Stirrups (mm)</Label>
                <Select value={diaStirrup} onValueChange={setDiaStirrup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[6, 8, 10, 12].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} mm</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Spacing at Supports (mm)</Label>
                <Input value={spacingXY} onChange={(e) => setSpacingXY(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Spacing Mid-span (mm)</Label>
                <Input value={spacingYZ} onChange={(e) => setSpacingYZ(e.target.value)} type="number" />
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
            <AccordionTrigger>How is the Crank Beam BBS calculated?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Main Bars Cutting Length:</strong> Clear Span + 2 × Development Length (Ld).</li>
                <li><strong>Crank Bar Extra Length:</strong> For a 45° crank, extra length = `0.42 × D`, where D is effective depth. For two cranks, extra = `0.84 × D`.</li>
                <li><strong>Bend Deductions:</strong> 45° bends deduct 1d, 90° bends deduct 2d, 135° bends deduct 3d.</li>
                <li><strong>Stirrup Spacing:</strong> Stirrups are densely packed at distances of `L/3` from supports (using spacing x-y), and less dense in the mid-span (using spacing y-z).</li>
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
            <CardDescription>Crank Beam Details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                
                {/* Top Main */}
                <div className="grid grid-cols-2 gap-y-1 text-sm border-b pb-2">
                  <span className="col-span-2 font-semibold text-primary mb-1">Top Main Bars</span>
                  <span className="text-muted-foreground">Dia & Count:</span>
                  <span className="text-right font-medium">{results.topBar.dia}mm - {results.topBar.count} Nos</span>
                  <span className="text-muted-foreground">Cut. Length/pc:</span>
                  <span className="text-right">{results.topBar.cl.toFixed(2)} ft</span>
                  <span className="text-muted-foreground font-semibold">Weight:</span>
                  <span className="text-right font-bold">{results.topBar.wt.toFixed(2)} Kg</span>
                </div>

                {/* Bottom Main */}
                <div className="grid grid-cols-2 gap-y-1 text-sm border-b pb-2">
                  <span className="col-span-2 font-semibold text-primary mb-1">Bottom Main Bars</span>
                  <span className="text-muted-foreground">Dia & Count:</span>
                  <span className="text-right font-medium">{results.botBar.dia}mm - {results.botBar.count} Nos</span>
                  <span className="text-muted-foreground">Cut. Length/pc:</span>
                  <span className="text-right">{results.botBar.cl.toFixed(2)} ft</span>
                  <span className="text-muted-foreground font-semibold">Weight:</span>
                  <span className="text-right font-bold">{results.botBar.wt.toFixed(2)} Kg</span>
                </div>

                {/* Crank */}
                <div className="grid grid-cols-2 gap-y-1 text-sm border-b pb-2">
                  <span className="col-span-2 font-semibold text-primary mb-1">Crank Bars</span>
                  <span className="text-muted-foreground">Dia & Count:</span>
                  <span className="text-right font-medium">{results.crankBar.dia}mm - {results.crankBar.count} Nos</span>
                  <span className="text-muted-foreground">Cut. Length/pc:</span>
                  <span className="text-right">{results.crankBar.cl.toFixed(2)} ft</span>
                  <span className="text-muted-foreground font-semibold">Weight:</span>
                  <span className="text-right font-bold">{results.crankBar.wt.toFixed(2)} Kg</span>
                </div>

                {/* Stirrups */}
                <div className="grid grid-cols-2 gap-y-1 text-sm border-b pb-2">
                  <span className="col-span-2 font-semibold text-primary mb-1">Stirrups</span>
                  <span className="text-muted-foreground">Dia & Count:</span>
                  <span className="text-right font-medium">{results.stirrups.dia}mm - {results.stirrups.count} Nos</span>
                  <span className="text-muted-foreground">Cut. Length/pc:</span>
                  <span className="text-right">{results.stirrups.cl.toFixed(2)} ft</span>
                  <span className="text-muted-foreground font-semibold">Weight:</span>
                  <span className="text-right font-bold">{results.stirrups.wt.toFixed(2)} Kg</span>
                </div>

                <div className="flex justify-between items-center pt-2 px-1">
                  <span className="text-muted-foreground text-base font-bold">Total Weight</span>
                  <span className="font-black text-2xl text-primary">{results.totalWeight.toFixed(2)} Kg</span>
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
