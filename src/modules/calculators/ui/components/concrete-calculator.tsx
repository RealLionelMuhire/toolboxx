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

export const ConcreteCalculator = () => {
  // A) Member, size, quantity
  const [memberType, setMemberType] = useState("Beam");
  
  const [length, setLength] = useState("9");
  const [lengthUnit, setLengthUnit] = useState("Feet");
  
  const [width, setWidth] = useState("9");
  const [widthUnit, setWidthUnit] = useState("Feet");
  
  const [height, setHeight] = useState("10");
  const [heightUnit, setHeightUnit] = useState("Feet");
  
  const [quantity, setQuantity] = useState("1");

  // B) Mix ratio and factors
  const [cementRatio, setCementRatio] = useState("1");
  const [sandRatio, setSandRatio] = useState("2");
  const [aggregateRatio, setAggregateRatio] = useState("3");
  const [dryVolumeFactor, setDryVolumeFactor] = useState("1.54");

  // Results
  const [results, setResults] = useState<{
    wetVolume: number;
    dryVolume: number;
    cementVolume: number;
    sandVolume: number;
    aggregateVolume: number;
    cementWeight: number;
    cementBags: number;
  } | null>(null);

  const handleCalculate = () => {
    // Convert to meters
    const L = toMeter(parseFloat(length), lengthUnit);
    const W = toMeter(parseFloat(width), widthUnit);
    const H = toMeter(parseFloat(height), heightUnit);
    const Q = parseFloat(quantity) || 1;

    // Calculations
    const wetVolume = L * W * H * Q;
    const dryFactor = parseFloat(dryVolumeFactor) || 1.54;
    const dryVolume = wetVolume * dryFactor;

    const cRatio = parseFloat(cementRatio) || 1;
    const sRatio = parseFloat(sandRatio) || 2;
    const aRatio = parseFloat(aggregateRatio) || 3;
    const totalRatio = cRatio + sRatio + aRatio;

    const cementVol = dryVolume * (cRatio / totalRatio);
    const sandVol = dryVolume * (sRatio / totalRatio);
    const aggregateVol = dryVolume * (aRatio / totalRatio);

    const cementWeight = cementVol * 1440; // Density of cement = 1440 kg/m3
    const cementBags = cementWeight / 50; // 1 Bag = 50kg

    setResults({
      wetVolume: wetVolume,
      dryVolume: dryVolume,
      cementVolume: cementVol,
      sandVolume: sandVol,
      aggregateVolume: aggregateVol,
      cementWeight: cementWeight,
      cementBags: cementBags,
    });
  };

  const handleReset = () => {
    setMemberType("Beam");
    setLength("9");
    setLengthUnit("Feet");
    setWidth("9");
    setWidthUnit("Feet");
    setHeight("10");
    setHeightUnit("Feet");
    setQuantity("1");
    
    setCementRatio("1");
    setSandRatio("2");
    setAggregateRatio("3");
    setDryVolumeFactor("1.54");
    
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A) Member, size, quantity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-xs">
              <Label>Member type</Label>
              <Select value={memberType} onValueChange={setMemberType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beam">Beam</SelectItem>
                  <SelectItem value="Column">Column</SelectItem>
                  <SelectItem value="Slab">Slab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Input Length</Label>
                <Input value={length} onChange={(e) => setLength(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={lengthUnit} onValueChange={setLengthUnit}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Input Width</Label>
                <Input value={width} onChange={(e) => setWidth(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={widthUnit} onValueChange={setWidthUnit}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Input Height or Thickness</Label>
                <Input value={height} onChange={(e) => setHeight(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={heightUnit} onValueChange={setHeightUnit}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Quantity of Members (Nos.)</Label>
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B) Mix ratio and factors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Cement Ratio</Label>
                <Input value={cementRatio} onChange={(e) => setCementRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Sand Ratio</Label>
                <Input value={sandRatio} onChange={(e) => setSandRatio(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Aggregate Ratio</Label>
                <Input value={aggregateRatio} onChange={(e) => setAggregateRatio(e.target.value)} type="number" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label>Dry volume factor</Label>
                <Input value={dryVolumeFactor} onChange={(e) => setDryVolumeFactor(e.target.value)} type="number" step="0.01" />
                <p className="text-xs text-muted-foreground mt-1">Default is 1.54</p>
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
            <AccordionTrigger>How to Use This Tool?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Concrete Calculator calculates the volume of cement, sand, and aggregate, the weight of steel rod according to percentage, Numbers of bags of cement required to construct cubical structural members like Beam, Column, and Slab.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Step 1:</strong> Put the dimension of Column, Beam and slab you want to construct like length, width, and height.</li>
                <li><strong>Step 2:</strong> Put the ratio of cement, sand and aggregate you want to use for concrete (e.g., 1:2:3, 1:1.5:3).</li>
                <li><strong>Step 3:</strong> Put the quantity of members if you have multiple items of the same size.</li>
                <li><strong>Step 4:</strong> Press Calculate button and Boom. Your result will be shown below.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="data">
            <AccordionTrigger>Standard Data used in this Calculator</AccordionTrigger>
            <AccordionContent className="space-y-2 text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li>Added 54% extra Concrete to convert wet volume into dry volume (Factor = 1.54).</li>
                <li>Density of cement = 1440 Kg/m³</li>
                <li>Density of Steel rod = 7800 Kg/m³</li>
                <li>1 Bag of cement = 50 Kg</li>
                <li>1 m = 3.281 Feet</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="example">
            <AccordionTrigger>Numerical Example</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Calculate Cement, Sand and Aggregate required in a Column.</p>
                <p>Let's calculate Cement, Sand, and Aggregate in the column of grade M20 (1:1.5:3)</p>
                <p>Length (L) = 400 mm (0.4 m)<br/>Width (B) = 300 mm (0.3 m)<br/>Height (H) = 3 meter</p>
                
                <p className="font-semibold text-foreground pt-2">Step-1: Calculate wet volume of concrete</p>
                <p>V = L × B × H = 0.4 × 0.3 × 3 = 0.36 m³ (Wet Volume)</p>
                
                <p className="font-semibold text-foreground pt-2">Step-2: Calculate Dry volume of concrete</p>
                <p>Dry Volume = Wet volume × 1.54 = 0.36 × 1.54 = 0.554 m³</p>
                
                <p className="font-semibold text-foreground pt-2">Step-3: Calculate ingredient</p>
                <p>Total Part = 1 + 1.5 + 3 = 5.5</p>
                <p>Volume of Cement = (1/5.5) × 0.554 = 0.1 m³</p>
                
                <p className="font-semibold text-foreground pt-2">Step-4: Convert volume of cement in kg of cement</p>
                <p>Weight = Volume × Density = 0.1 × 1440 = 144 Kg</p>
                
                <p className="font-semibold text-foreground pt-2">Step-5: Kg of Cement to Bags</p>
                <p>No. of bags = 144 / 50 = 2.88 Bags</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Concrete material estimates</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Wet Volume</span>
                  <span className="font-semibold">{results.wetVolume.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Dry Volume</span>
                  <span className="font-semibold">{results.dryVolume.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Cement Volume</span>
                  <span className="font-semibold">{results.cementVolume.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Sand Volume</span>
                  <span className="font-semibold">{results.sandVolume.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Aggregate Volume</span>
                  <span className="font-semibold">{results.aggregateVolume.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">m³</span></span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground text-sm">Cement Weight</span>
                  <span className="font-semibold text-lg">{results.cementWeight.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">kg</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Cement Bags</span>
                  <span className="font-bold text-lg text-primary">{results.cementBags.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">Nos</span></span>
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
