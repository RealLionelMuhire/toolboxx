"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Helper to convert units to feet
const toFeet = (value: number, unit: string) => {
  if (isNaN(value)) return 0;
  switch (unit) {
    case "Inch": return value / 12;
    case "mm": return value * 0.00328084;
    case "m": return value * 3.28084;
    case "Feet": return value;
    default: return value;
  }
};

export const ConcreteWeightCalculator = () => {
  const [thickness, setThickness] = useState("6");
  const [unit, setUnit] = useState("Inch");
  const [concreteType, setConcreteType] = useState("PCC");

  // Results
  const [results, setResults] = useState<{
    weightKg: number;
    weightTon: number;
    weightPound: number;
    weightOunce: number;
  } | null>(null);

  const handleCalculate = () => {
    const tVal = parseFloat(thickness) || 0;
    const tFeet = toFeet(tVal, unit);

    // Area is fixed to 1 sq.ft
    const volFeet3 = 1 * 1 * tFeet;
    
    // 1 cubic foot = 0.0283168 cubic meter
    const volMeter3 = volFeet3 * 0.0283168466;

    // Density
    const density = concreteType === "PCC" ? 2400 : 2500;

    const weightKg = volMeter3 * density;
    const weightTon = weightKg * 0.00110231;
    const weightPound = weightKg * 2.20462;
    const weightOunce = weightKg * 35.274;

    setResults({
      weightKg,
      weightTon,
      weightPound,
      weightOunce,
    });
  };

  const handleReset = () => {
    setThickness("6");
    setUnit("Inch");
    setConcreteType("PCC");
    setResults(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Concrete Slab Parameters</CardTitle>
            <CardDescription>Calculates the weight per 1 square foot of area.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thickness of Concrete</Label>
                <div className="flex gap-2">
                  <Input value={thickness} onChange={(e) => setThickness(e.target.value)} type="number" />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inch">Inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                      <SelectItem value="m">Meter</SelectItem>
                      <SelectItem value="Feet">Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type of Concrete</Label>
                <Select value={concreteType} onValueChange={setConcreteType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCC">PCC (Plain Cement Concrete)</SelectItem>
                    <SelectItem value="RCC">RCC (Reinforced Cement Concrete)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate Weight
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger>How to calculate the weight of concrete per square foot?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>The weight of concrete is determined by its volume and density.</p>
              <ul className="list-decimal pl-5 space-y-2">
                <li>Take Area = 1 foot × 1 foot = 1 sq.ft</li>
                <li>Multiply the area by the thickness of concrete (in feet) to get Volume in Cubic Feet.</li>
                <li>Convert Cubic Feet to Cubic Meters (1 cubic foot = 0.0283168 cubic meters).</li>
                <li>Multiply the volume by the density of the concrete type:</li>
                <ul className="list-disc pl-5 mt-2">
                  <li><strong>PCC Density:</strong> 2400 kg/m³</li>
                  <li><strong>RCC Density:</strong> 2500 kg/m³ (includes steel reinforcement)</li>
                </ul>
                <li>Convert Kg to other units using standard conversion rates.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="reference-table">
            <AccordionTrigger>Weight of concrete per square foot having different thickness</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 border-b font-medium">Type</th>
                      <th className="px-4 py-2 border-b font-medium">Thickness</th>
                      <th className="px-4 py-2 border-b font-medium">Weight (Kg)</th>
                      <th className="px-4 py-2 border-b font-medium">Pounds</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b"><td className="px-4 py-2">PCC</td><td className="px-4 py-2">4"</td><td className="px-4 py-2">22.65</td><td className="px-4 py-2">49.95</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">PCC</td><td className="px-4 py-2">5"</td><td className="px-4 py-2">28.32</td><td className="px-4 py-2">62.43</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">PCC</td><td className="px-4 py-2">6"</td><td className="px-4 py-2">33.98</td><td className="px-4 py-2">74.92</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">PCC</td><td className="px-4 py-2">7"</td><td className="px-4 py-2">39.64</td><td className="px-4 py-2">87.41</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">PCC</td><td className="px-4 py-2">8"</td><td className="px-4 py-2">45.31</td><td className="px-4 py-2">99.90</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">RCC</td><td className="px-4 py-2">4"</td><td className="px-4 py-2">23.60</td><td className="px-4 py-2">52.03</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">RCC</td><td className="px-4 py-2">5"</td><td className="px-4 py-2">29.49</td><td className="px-4 py-2">65.04</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">RCC</td><td className="px-4 py-2">6"</td><td className="px-4 py-2">35.39</td><td className="px-4 py-2">78.04</td></tr>
                    <tr className="border-b"><td className="px-4 py-2">RCC</td><td className="px-4 py-2">7"</td><td className="px-4 py-2">41.29</td><td className="px-4 py-2">91.05</td></tr>
                    <tr><td className="px-4 py-2">RCC</td><td className="px-4 py-2">8"</td><td className="px-4 py-2">47.19</td><td className="px-4 py-2">104.06</td></tr>
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Weight per 1 Square Foot</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Total Weight (Kg)</span>
                  <span className="font-bold text-lg text-primary">{results.weightKg.toFixed(3)} Kg</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">US Ton</span>
                  <span className="font-medium text-sm">{results.weightTon.toFixed(4)} Ton</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm">Pounds</span>
                  <span className="font-medium text-sm">{results.weightPound.toFixed(3)} Lbs</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-sm">Ounces</span>
                  <span className="font-medium text-sm">{results.weightOunce.toFixed(3)} Oz</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-weight"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.46A2 2 0 0 0 17.5 8Z"/></svg>
                </div>
                <p>Fill the form and click Calculate Weight to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
