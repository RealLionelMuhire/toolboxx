"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const StairGraniteCalculator = () => {
  // Inputs
  const [steps, setSteps] = useState("16");
  const [treadLength, setTreadLength] = useState("3.5");
  const [treadWidth, setTreadWidth] = useState("1");
  const [riserWidth, setRiserWidth] = useState("3.5");
  const [riserHeight, setRiserHeight] = useState("0.5");
  const [sideHeight, setSideHeight] = useState("0.33");
  const [sideLength, setSideLength] = useState("1");
  const [nosingWidth, setNosingWidth] = useState("0.2");
  
  const [landings, setLandings] = useState("1");
  const [landingLength, setLandingLength] = useState("7");
  const [landingWidth, setLandingWidth] = useState("3");

  // Rates & Extras
  const [graniteRate, setGraniteRate] = useState("430");
  const [laborRate, setLaborRate] = useState("46");
  const [railingLength, setRailingLength] = useState("21");
  const [railingRate, setRailingRate] = useState("1200");
  const [wastage, setWastage] = useState("10");

  // Results
  const [results, setResults] = useState<{
    treadArea: number;
    riserArea: number;
    sideArea: number;
    landingArea: number;
    nosingArea: number;
    totalNetArea: number;
    totalGrossArea: number;
    graniteCost: number;
    laborCost: number;
    railingCost: number;
    totalCost: number;
  } | null>(null);

  const handleCalculate = () => {
    const numSteps = parseFloat(steps) || 0;
    
    // Areas in Sq Ft
    const treadArea = (parseFloat(treadLength) || 0) * (parseFloat(treadWidth) || 0) * numSteps;
    const riserArea = (parseFloat(riserWidth) || 0) * (parseFloat(riserHeight) || 0) * numSteps;
    const sideArea = (parseFloat(sideLength) || 0) * (parseFloat(sideHeight) || 0) * numSteps; // Usually 2 sides, but following user template strictly as 1 unit per step, user can adjust side length if both sides
    const nosingArea = (parseFloat(treadLength) || 0) * (parseFloat(nosingWidth) || 0) * numSteps;
    
    const numLandings = parseFloat(landings) || 0;
    const landingArea = (parseFloat(landingLength) || 0) * (parseFloat(landingWidth) || 0) * numLandings;

    const totalNetArea = treadArea + riserArea + sideArea + nosingArea + landingArea;
    
    const wastagePercent = parseFloat(wastage) || 0;
    const totalGrossArea = totalNetArea * (1 + wastagePercent / 100);

    const costGranite = totalGrossArea * (parseFloat(graniteRate) || 0);
    const costLabor = totalNetArea * (parseFloat(laborRate) || 0);
    const costRailing = (parseFloat(railingLength) || 0) * (parseFloat(railingRate) || 0);

    const totalEstimate = costGranite + costLabor + costRailing;

    setResults({
      treadArea,
      riserArea,
      sideArea,
      landingArea,
      nosingArea,
      totalNetArea,
      totalGrossArea,
      graniteCost: costGranite,
      laborCost: costLabor,
      railingCost: costRailing,
      totalCost: totalEstimate,
    });
  };

  const handleReset = () => {
    setSteps("16");
    setTreadLength("3.5");
    setTreadWidth("1");
    setRiserWidth("3.5");
    setRiserHeight("0.5");
    setSideHeight("0.33");
    setSideLength("1");
    setNosingWidth("0.2");
    setLandings("1");
    setLandingLength("7");
    setLandingWidth("3");
    setGraniteRate("430");
    setLaborRate("46");
    setRailingLength("21");
    setRailingRate("1200");
    setWastage("10");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Stair Dimensions (in Feet)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-xs">
              <Label>1. No. of Steps</Label>
              <Input value={steps} onChange={(e) => setSteps(e.target.value)} type="number" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>2. Tread Length (ft)</Label>
                <Input value={treadLength} onChange={(e) => setTreadLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>3. Tread Width (ft)</Label>
                <Input value={treadWidth} onChange={(e) => setTreadWidth(e.target.value)} type="number" />
              </div>
              
              <div className="space-y-2">
                <Label>4. Riser Width (ft)</Label>
                <Input value={riserWidth} onChange={(e) => setRiserWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>5. Riser Height (ft)</Label>
                <Input value={riserHeight} onChange={(e) => setRiserHeight(e.target.value)} type="number" />
              </div>

              <div className="space-y-2">
                <Label>6. Side Height (ft)</Label>
                <Input value={sideHeight} onChange={(e) => setSideHeight(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>7. Side Length (ft)</Label>
                <Input value={sideLength} onChange={(e) => setSideLength(e.target.value)} type="number" />
              </div>

              <div className="space-y-2">
                <Label>8. Nosing Width (ft)</Label>
                <Input value={nosingWidth} onChange={(e) => setNosingWidth(e.target.value)} type="number" />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2 max-w-xs mb-4">
                <Label>9. No. of Landings</Label>
                <Input value={landings} onChange={(e) => setLandings(e.target.value)} type="number" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>10. Landing Length (ft)</Label>
                  <Input value={landingLength} onChange={(e) => setLandingLength(e.target.value)} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>11. Landing Width (ft)</Label>
                  <Input value={landingWidth} onChange={(e) => setLandingWidth(e.target.value)} type="number" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Granite Rate (Rs/ft²)</Label>
                <Input value={graniteRate} onChange={(e) => setGraniteRate(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Labor Rate (Rs/ft²)</Label>
                <Input value={laborRate} onChange={(e) => setLaborRate(e.target.value)} type="number" />
              </div>
              
              <div className="space-y-2">
                <Label>Railing Length (feet)</Label>
                <Input value={railingLength} onChange={(e) => setRailingLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Railing Rate (Rs/ft)</Label>
                <Input value={railingRate} onChange={(e) => setRailingRate(e.target.value)} type="number" />
              </div>

              <div className="space-y-2">
                <Label>Wastage (%)</Label>
                <Input value={wastage} onChange={(e) => setWastage(e.target.value)} type="number" />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                🔍 Calculate Estimate
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="info">
            <AccordionTrigger>About Stair Granite & Railing</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Tiles, Granite and railing are essential elements of stair. It gives an attractive and stunning look to the stair. Railing provides safety to the people and granite makes surface smooth and attractive.</p>
              <p>House owners always want to make their house attractive and often worry to calculate the expense of these materials in stair. This tool helps you to calculate the actual cost of granite, railing with labour cost.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Stair Material & Labour Estimates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Total Net Area</span>
                  <span className="font-semibold">{results.totalNetArea.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">sq.ft</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Area with Wastage</span>
                  <span className="font-semibold">{results.totalGrossArea.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">sq.ft</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Granite Cost</span>
                  <span className="font-semibold">{results.graniteCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Labour Cost</span>
                  <span className="font-semibold">{results.laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Railing Cost</span>
                  <span className="font-semibold">{results.railingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Total Estimate Cost</span>
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
