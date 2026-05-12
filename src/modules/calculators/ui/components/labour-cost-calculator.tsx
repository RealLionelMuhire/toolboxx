"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Labor constants for standard construction works (Per unit of quantity)
const WORK_TYPES = [
  { id: "brickwork", name: "Brickwork (per m³)", skilled: 1.5, unskilled: 2.4, unit: "m³" },
  { id: "concrete", name: "PCC / RCC Concrete (per m³)", skilled: 0.5, unskilled: 2.0, unit: "m³" },
  { id: "plastering", name: "Plastering (per 10 m²)", skilled: 1.0, unskilled: 1.5, unit: "10 m²" },
  { id: "excavation", name: "Earth Excavation (per m³)", skilled: 0, unskilled: 0.5, unit: "m³" },
  { id: "painting", name: "Painting (per 10 m²)", skilled: 0.5, unskilled: 0.5, unit: "10 m²" },
];

export const LabourCostCalculator = () => {
  const [selectedWorkId, setSelectedWorkId] = useState("brickwork");
  const [quantity, setQuantity] = useState("34.5");
  
  const [skilledCost, setSkilledCost] = useState("12000"); // Using default RWF like numbers
  const [unskilledCost, setUnskilledCost] = useState("6000");

  const [currency, setCurrency] = useState("RWF"); // RWF or USD

  // Results
  const [results, setResults] = useState<{
    skilledNos: number;
    unskilledNos: number;
    totalSkilledCost: number;
    totalUnskilledCost: number;
    totalCost: number;
    currencySymbol: string;
  } | null>(null);

  const handleCalculate = () => {
    const work = WORK_TYPES.find(w => w.id === selectedWorkId) || WORK_TYPES[0];
    const Q = parseFloat(quantity) || 0;
    
    const skilledNos = Q * work.skilled;
    const unskilledNos = Q * work.unskilled;

    const sRate = parseFloat(skilledCost) || 0;
    const uRate = parseFloat(unskilledCost) || 0;

    const totalSkilledCost = skilledNos * sRate;
    const totalUnskilledCost = unskilledNos * uRate;
    const totalCost = totalSkilledCost + totalUnskilledCost;

    setResults({
      skilledNos,
      unskilledNos,
      totalSkilledCost,
      totalUnskilledCost,
      totalCost,
      currencySymbol: currency === "RWF" ? "RWF" : "$",
    });
  };

  const handleReset = () => {
    setSelectedWorkId("brickwork");
    setQuantity("34.5");
    setSkilledCost("12000");
    setUnskilledCost("6000");
    setCurrency("RWF");
    setResults(null);
  };

  const selectedWorkUnit = WORK_TYPES.find(w => w.id === selectedWorkId)?.unit || "units";

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      <div className="flex-1 space-y-6 w-full">
        <Card>
          <CardHeader>
            <CardTitle>A) Types of Civil Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              <Label>Select Work</Label>
              <Select value={selectedWorkId} onValueChange={setSelectedWorkId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORK_TYPES.map(work => (
                    <SelectItem key={work.id} value={work.id}>{work.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>B) Input Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
              <Label>Quantity of Work ({selectedWorkUnit})</Label>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>C) Labor Costs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Skilled Labor Cost (Head/Day)</Label>
                <Input value={skilledCost} onChange={(e) => setSkilledCost(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Unskilled Labor Cost (Head/Day)</Label>
                <Input value={unskilledCost} onChange={(e) => setUnskilledCost(e.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <Label>Select Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RWF">RWF (Rwandan Franc)</SelectItem>
                    <SelectItem value="USD">$ (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleCalculate} size="lg" className="flex-1 bg-primary text-primary-foreground">
                Calculate Cost
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger>How to use Labour Cost Calculator?</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Cost of labour for building construction works depends upon the rate of working skilled and unskilled labour per day.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Step 1:</strong> First of all select the types of civil works (e.g., Brickwork).</li>
                <li><strong>Step 2:</strong> Input the quantity of works matching the designated unit.</li>
                <li><strong>Step 3:</strong> Put the daily wages for the skilled and unskilled labour according to your country (RWF or $).</li>
                <li><strong>Step 4:</strong> Click on Calculate Button to get the total required heads and complete cost.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="example">
            <AccordionTrigger>Example Calculation</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p><strong>Let's take a brickwork wall having 34.5 m³ volume.</strong></p>
              <p>For 1 m³ of brickwork we need 1.5 skilled labour and 2.4 unskilled labour.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Skilled labour = 34.5 x 1.5 = 51.75 Nos.</li>
                <li>Unskilled labour = 34.5 x 2.4 = 82.8 Nos.</li>
              </ul>
              <p>If skilled daily wage is 12000 RWF and unskilled is 6000 RWF:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Cost of skilled labour = 51.75 x 12000 = 621,000 RWF</li>
                <li>Cost of Unskilled labour = 82.8 x 6000 = 496,800 RWF</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="w-full lg:w-[350px] shrink-0 sticky top-[80px]">
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle>Calculation Result</CardTitle>
            <CardDescription>Estimated Labor Requirements & Costs</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {results ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md space-y-1 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Skilled Labor Heads:</span>
                    <span className="font-semibold">{results.skilledNos.toFixed(2)} Nos</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Unskilled Labor Heads:</span>
                    <span className="font-semibold">{results.unskilledNos.toFixed(2)} Nos</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Total Skilled Labor Cost</span>
                  <span className="font-bold text-sm">
                    {results.currencySymbol === "$" ? "$" : ""}{results.totalSkilledCost.toLocaleString()}{results.currencySymbol === "RWF" ? " RWF" : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground text-sm font-semibold">Total Unskilled Labor Cost</span>
                  <span className="font-bold text-sm">
                    {results.currencySymbol === "$" ? "$" : ""}{results.totalUnskilledCost.toLocaleString()}{results.currencySymbol === "RWF" ? " RWF" : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-foreground text-base font-bold">Total Labor Cost</span>
                  <span className="font-black text-xl text-primary">
                    {results.currencySymbol === "$" ? "$" : ""}{results.totalCost.toLocaleString()}{results.currencySymbol === "RWF" ? " RWF" : ""}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
                <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <p>Fill the form and click Calculate Cost to see results here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
