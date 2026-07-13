"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ArrowLeft, ChevronsUpDown, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type ProformaItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  name: string;
};

export default function EditProformaPage() {
  const router = useRouter();
  const { id } = useParams();
  const trpc = useTRPC();
  
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [items, setItems] = useState<ProformaItem[]>([{ productId: "", quantity: 1, unitPrice: 0, name: "" }]);
  const [openCombobox, setOpenCombobox] = useState<Record<number, boolean>>({});
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  
  // Fetch seller's products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    ...trpc.products.getMyProducts.queryOptions({ limit: 100 }),
  });
  
  // Fetch existing quote
  const { data: proforma, isLoading: isLoadingProforma } = useQuery({
    ...trpc.proformas.getById.queryOptions({ id: id as string }),
    enabled: !!id,
  });

  useEffect(() => {
    if (proforma) {
      const p = proforma as any;
      if (p.customerDetails) {
        setCustomer({
          name: p.customerDetails.name || "",
          phone: p.customerDetails.phone || "",
          email: p.customerDetails.email || "",
          address: p.customerDetails.address || "",
        });
      }
      if (p.items && p.items.length > 0) {
        setItems(p.items.map((item: any) => ({
          productId: typeof item.product === 'string' ? item.product : item.product?.id || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          name: typeof item.product === 'string' ? "Product" : item.product?.name || "Product",
        })));
      }
    }
  }, [proforma]);
  
  const updateMutation = useMutation(trpc.proformas.update.mutationOptions({
    onSuccess: (data) => {
      toast.success("Quote updated successfully!");
      router.push(`/proforma/${data.id || id}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update quote");
    },
  }));

  const handleProductSelect = (index: number, productId: string) => {
    const product = productsData?.docs.find((p: any) => p.id === productId);
    if (!product) return;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId,
      unitPrice: product.price || 0,
      name: product.name,
      quantity: newItems[index]?.quantity || 1,
    };
    setItems(newItems);
    setOpenCombobox({ ...openCombobox, [index]: false });
  };

  const handleAddItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0, name: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: keyof ProformaItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as ProformaItem;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name) {
      return toast.error("Client name is required");
    }
    
    const validItems = items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      return toast.error("Please add at least one valid product");
    }

    updateMutation.mutate({
      id: id as string,
      customerDetails: customer,
      items: validItems.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  if (isLoadingProforma) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4 -ml-4 text-gray-500 hover:text-gray-900">
          <Link href="/my-store?tab=proformas">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Quote / Pro Forma</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Client Name *</label>
              <Input 
                required 
                placeholder="e.g. Mugisha Construction" 
                value={customer.name}
                onChange={e => setCustomer({...customer, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <Input 
                placeholder="e.g. 0780000000" 
                value={customer.phone}
                onChange={e => setCustomer({...customer, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input 
                type="email" 
                placeholder="client@example.com" 
                value={customer.email}
                onChange={e => setCustomer({...customer, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Address</label>
              <Input 
                placeholder="e.g. Kigali, Rwanda" 
                value={customer.address}
                onChange={e => setCustomer({...customer, address: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Products / Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 items-start p-4 border rounded-lg bg-gray-50">
                <div className="flex-1 w-full relative">
                  <label className="text-sm font-medium mb-1 block">Search Product *</label>
                  <Popover 
                    open={openCombobox[index] || false} 
                    onOpenChange={(val) => setOpenCombobox({ ...openCombobox, [index]: val })}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox[index] || false}
                        className="w-full justify-between bg-white text-left font-normal"
                      >
                        <span className="truncate flex-1 text-left">
                          {item.productId ? item.name : "Search for a product..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Type at least 3 characters..." 
                          value={searchQueries[index] || ""}
                          onValueChange={(val) => setSearchQueries({ ...searchQueries, [index]: val })}
                        />
                        <CommandList>
                          {(searchQueries[index] || "").length < 3 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">Type at least 3 characters to search...</div>
                          ) : (
                            <CommandGroup>
                              {productsData?.docs
                                .filter((p: any) => p.name.toLowerCase().includes((searchQueries[index] || "").toLowerCase()))
                                .map((p: any) => (
                                <CommandItem 
                                  key={p.id} 
                                  value={p.id} 
                                  onSelect={() => handleProductSelect(index, p.id)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", item.productId === p.id ? "opacity-100" : "opacity-0")} />
                                  <span className="truncate">{p.name}</span>
                                  <span className="ml-auto text-gray-500 whitespace-nowrap pl-2">RWF {p.price.toLocaleString()}</span>
                                </CommandItem>
                              ))}
                              {productsData?.docs.filter((p: any) => p.name.toLowerCase().includes((searchQueries[index] || "").toLowerCase())).length === 0 && (
                                <div className="p-4 text-sm text-gray-500 text-center">No products found.</div>
                              )}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="w-full md:w-24">
                  <label className="text-sm font-medium mb-1 block">Qty *</label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={item.quantity} 
                    onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    className="bg-white"
                  />
                </div>
                
                <div className="w-full md:w-32">
                  <label className="text-sm font-medium mb-1 block">Unit Price (RWF)</label>
                  <Input 
                    type="number" 
                    min="0" 
                    value={item.unitPrice} 
                    onChange={e => updateItem(index, 'unitPrice', parseInt(e.target.value) || 0)}
                    className="bg-white"
                  />
                </div>
                
                <div className="w-full md:w-32">
                  <label className="text-sm font-medium mb-1 block">Total (RWF)</label>
                  <div className="h-10 flex items-center font-semibold bg-gray-200 px-3 rounded-md">
                    {(item.quantity * item.unitPrice).toLocaleString()}
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={handleAddItem} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Add Another Item
            </Button>

            <div className="flex justify-end pt-4 border-t mt-6">
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  RWF {calculateTotal().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
