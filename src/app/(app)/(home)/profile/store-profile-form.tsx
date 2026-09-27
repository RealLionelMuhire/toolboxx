"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, Store } from 'lucide-react';

import { useTRPC } from '@/trpc/client';
import { updateMyStoreSchema } from '@/modules/tenants/schemas';
import { LocationSelector } from '@/components/location-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type StoreFormValues = z.infer<typeof updateMyStoreSchema>;

const CURRENCIES = [
  { value: 'RWF', label: 'Rwandan Franc (RWF)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'UGX', label: 'Ugandan Shilling (UGX)' },
  { value: 'TZS', label: 'Tanzanian Shilling (TZS)' },
  { value: 'BIF', label: 'Burundian Franc (BIF)' },
  { value: 'KSH', label: 'Kenyan Shilling (KSH)' },
] as const;

export function StoreProfileForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: tenant, isLoading } = useQuery(trpc.tenants.getCurrentTenant.queryOptions());

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(updateMyStoreSchema),
    defaultValues: {
      name: '',
      contactPhone: '',
      locationCountry: undefined,
      locationProvince: '',
      locationDistrict: '',
      locationCityOrArea: '',
      currency: 'RWF',
      paymentMethod: 'momo_pay',
      bankName: '',
      bankAccountNumber: '',
      momoProviderName: '',
      momoAccountName: '',
      momoCode: '',
    },
  });

  // Load the saved store details once they arrive
  useEffect(() => {
    if (!tenant) return;
    form.reset({
      name: tenant.name,
      contactPhone: tenant.contactPhone || '',
      locationCountry: tenant.locationCountry as StoreFormValues['locationCountry'],
      locationProvince: tenant.locationProvince || '',
      locationDistrict: tenant.locationDistrict || '',
      locationCityOrArea: tenant.locationCityOrArea || '',
      currency: (tenant.currency || 'RWF') as StoreFormValues['currency'],
      paymentMethod: (tenant.paymentMethod || 'momo_pay') as StoreFormValues['paymentMethod'],
      bankName: tenant.bankName || '',
      bankAccountNumber: tenant.bankAccountNumber || '',
      momoProviderName: tenant.momoProviderName || '',
      momoAccountName: tenant.momoAccountName || '',
      momoCode: tenant.momoCode != null ? String(tenant.momoCode) : '',
    });
  }, [tenant, form]);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const updateStore = useMutation(trpc.tenants.updateMyStore.mutationOptions({
    onSuccess: () => {
      toast.success('Store profile updated!');
      setLogoFile(null);
      queryClient.invalidateQueries(trpc.tenants.getCurrentTenant.queryFilter());
    },
    onError: (error) => {
      toast.error(error.message);
    },
  }));

  const onSubmit = async (values: StoreFormValues) => {
    let imageId: string | undefined;

    if (logoFile) {
      setIsUploading(true);
      try {
        const fileFormData = new FormData();
        fileFormData.append('file', logoFile);
        fileFormData.append('alt', `${values.name} logo`);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: fileFormData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          toast.error(error.error || 'Logo upload failed');
          return;
        }

        imageId = (await uploadResponse.json()).id;
      } catch (error) {
        console.error('Logo upload error:', error);
        toast.error('Logo upload failed. Please try again.');
        return;
      } finally {
        setIsUploading(false);
      }
    }

    updateStore.mutate({ ...values, imageId });
  };

  const paymentMethod = form.watch('paymentMethod');
  const currentLogoUrl = logoPreview
    || (tenant?.image && typeof tenant.image === 'object' ? tenant.image.url : null);
  const isSaving = isUploading || updateStore.isPending;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!tenant) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Store Profile
        </CardTitle>
        <CardDescription>
          Update how your store appears to buyers and how you get paid
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label htmlFor="storeLogo">Store Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-muted">
                  {currentLogoUrl && (
                    <Image src={currentLogoUrl} alt="Store logo" fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <Input
                  id="storeLogo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && !file.type.startsWith('image/')) {
                      toast.error('Please upload an image file (JPG, PNG, etc.)');
                      return;
                    }
                    setLogoFile(file || null);
                  }}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    You can also sign in with this name. Your store link (/tenants/{tenant.slug}) stays the same.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+250788888888" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LocationSelector form={form} />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="momo_pay">Mobile Money (MoMo)</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {paymentMethod === 'bank_transfer' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="momoProviderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="MTN Mobile Money" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="momoAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="momoCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MoMo Code</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="numeric" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Store Profile
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
