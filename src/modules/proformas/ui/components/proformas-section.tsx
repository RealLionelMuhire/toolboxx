"use client";

import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, PlusIcon, FileSignature, Share2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { toast } from 'sonner';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

export function ProformasSection() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    ...trpc.proformas.getMyProformas.queryOptions({
      page,
      limit: 10,
    }),
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'accepted':
      case 'converted':
        return 'default'; // primary/greenish depending on theme
      case 'pending':
      case 'sent':
        return 'secondary';
      case 'declined':
      case 'rejected':
        return 'destructive';
      case 'draft':
      default:
        return 'outline';
    }
  };

  const queryClient = useQueryClient();

  const deleteMutation = useMutation(trpc.proformas.delete.mutationOptions({
    onSuccess: () => {
      toast.success("Quote deleted successfully");
      queryClient.invalidateQueries(trpc.proformas.getMyProformas.queryFilter());
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete quote");
    }
  }));

  const updateStatusMutation = useMutation(trpc.proformas.updateStatus.mutationOptions({
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries(trpc.proformas.getMyProformas.queryFilter());
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    }
  }));

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this quote?")) {
      deleteMutation.mutate({ id });
    }
  };

  const proformasData = data as any;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div>
          <h2 className="text-lg font-semibold text-blue-900 mb-1">Quotes / Pro Formas</h2>
          <p className="text-sm text-blue-700">Manage your quotes and pro forma invoices for clients</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/my-store/proformas/create">
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Quote
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !proformasData?.docs || proformasData.docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSignature className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first Pro Forma Invoice to send to a client.
            </p>
            <Button asChild variant="outline">
              <Link href="/my-store/proformas/create">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Pro Forma
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proformasData.docs.map((proforma: any) => (
            <Card key={proforma.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base font-semibold">{proforma.proformaNumber}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(proforma.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getStatusBadgeVariant(proforma.status)}>
                      {proforma.status.charAt(0).toUpperCase() + proforma.status.slice(1)}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/my-store/proformas/edit/${proforma.id}`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: proforma.id, status: 'pending' })}>
                                Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: proforma.id, status: 'paid' })}>
                                Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: proforma.id, status: 'declined' })}>
                                Declined
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(proforma.id)} className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="text-sm font-medium">{proforma.customerDetails?.name}</p>
                    {proforma.customerDetails?.phone && (
                      <p className="text-xs text-muted-foreground">{proforma.customerDetails.phone}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-sm font-bold text-blue-600">
                      RWF {proforma.totalAmount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                      <Link href={`/proforma/${proforma.id}`}>
                        <Share2 className="w-3 h-3 mr-1" /> View & Share
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
