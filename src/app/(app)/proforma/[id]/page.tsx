"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Printer, Share2, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function ProformaViewPage() {
  const { id } = useParams();
  const trpc = useTRPC();
  const router = useRouter();
  
  const { data: proforma, isLoading, error } = useQuery({
    ...trpc.proformas.getById.queryOptions({ id: id as string }),
    enabled: !!id,
  });

  const proformaData = proforma as any;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quote ${proformaData?.proformaNumber}`,
          text: `Here is the quote from ${(proformaData?.tenant as any)?.name || 'us'}.`,
          url: url,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !proformaData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Quote Not Found</h1>
        <p className="text-gray-600 mb-8">The Pro Forma Invoice you are looking for does not exist or has been removed.</p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const tenant = proformaData.tenant as any;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        nav { display: none !important; }
        .fixed.bottom-4 { display: none !important; }
      `}} />
      <div className="bg-gray-50 min-h-screen py-8 print:bg-white print:py-0">
        <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Action Bar - Hidden on print */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-6 print:hidden gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={handleShare} variant="outline" className="flex-1 sm:flex-none">
              <Share2 className="w-4 h-4 mr-2" /> Share Link
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice Document */}
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm border print:border-none print:shadow-none print:p-0">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b pb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded overflow-hidden border p-1 bg-white shadow-sm flex items-center justify-center print:border-gray-200 print:shadow-none">
                <Image src="/logo.jpeg" alt="Toolbay" fill className="object-contain" priority />
              </div>
              <div>
                <h1 className="text-xl font-black text-blue-900 tracking-tight leading-none mb-1">PRO FORMA</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-gray-700 font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-xs print:bg-transparent print:p-0 print:text-gray-600">#{proformaData.proformaNumber}</span>
                  <Badge variant={proformaData.status === 'converted' ? 'default' : 'outline'} className="print:hidden text-[10px] px-1.5 py-0">
                    {proformaData.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  Date: {new Date(proformaData.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">www.toolbay.net</p>
              </div>
            </div>
            
            <div className="text-left md:text-right max-w-xs pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Seller Details</p>
              <h2 className="text-2xl font-bold text-gray-900">{tenant?.name || "Toolbay Seller"}</h2>
              {tenant?.contactEmail && <p className="text-sm text-gray-600 mt-1 font-medium">{tenant.contactEmail}</p>}
              {tenant?.contactPhone && <p className="text-sm text-gray-600 font-medium">{tenant.contactPhone}</p>}
              {tenant?.address && <p className="text-sm text-gray-600 mt-1">{tenant.address}</p>}
            </div>
          </div>

          {/* Client Details */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Prepared For</h3>
            <p className="text-lg font-bold text-gray-900">{proformaData.customerDetails?.name}</p>
            {proformaData.customerDetails?.email && <p className="text-gray-600">{proformaData.customerDetails.email}</p>}
            {proformaData.customerDetails?.phone && <p className="text-gray-600">{proformaData.customerDetails.phone}</p>}
            {proformaData.customerDetails?.address && <p className="text-gray-600">{proformaData.customerDetails.address}</p>}
          </div>

          {/* Items Table */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-3 text-sm font-bold text-gray-500 uppercase">Description</th>
                  <th className="py-3 text-sm font-bold text-gray-500 uppercase text-center w-24">Qty</th>
                  <th className="py-3 text-sm font-bold text-gray-500 uppercase text-right w-32">Unit Price</th>
                  <th className="py-3 text-sm font-bold text-gray-500 uppercase text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody>
                {proformaData.items.map((item: any, index: number) => {
                  const product = item.product as any;
                  return (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-4 font-medium text-gray-900">
                        {product?.name || 'Unknown Product'}
                      </td>
                      <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-600">RWF {item.unitPrice?.toLocaleString()}</td>
                      <td className="py-4 text-right font-medium text-gray-900">
                        RWF {(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-medium">RWF {proformaData.subTotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                <span className="text-lg font-bold text-blue-600">RWF {proformaData.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer & Notes */}
          <div className="border-t pt-8 text-sm text-gray-500">
            {proformaData.notes && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 mb-2">Notes / Terms:</h4>
                <p className="whitespace-pre-line">{proformaData.notes}</p>
              </div>
            )}
            <p className="text-center italic mt-12">
              This is a Pro Forma Invoice, not a formal receipt of payment. Prices are subject to change based on market conditions unless a validity date is specified.
            </p>
          </div>
          
        </div>
        </div>
      </div>
    </>
  );
}
