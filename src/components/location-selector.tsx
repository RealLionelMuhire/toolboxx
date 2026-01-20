"use client";

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { COUNTRIES, getCountryByCode } from "@/lib/location-data";

interface LocationSelectorProps {
  form: UseFormReturn<any>;
  countryFieldName?: string;
  provinceFieldName?: string;
  districtFieldName?: string;
  cityFieldName?: string;
  required?: boolean;
}

export const LocationSelector = ({
  form,
  countryFieldName = "locationCountry",
  provinceFieldName = "locationProvince",
  districtFieldName = "locationDistrict",
  cityFieldName = "locationCityOrArea",
  required = true,
}: LocationSelectorProps) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  
  const watchedCountry = form.watch(countryFieldName);
  const watchedProvince = form.watch(provinceFieldName);

  // Update local state when form values change
  useEffect(() => {
    if (watchedCountry) {
      setSelectedCountry(watchedCountry);
    }
  }, [watchedCountry]);

  useEffect(() => {
    if (watchedProvince) {
      setSelectedProvince(watchedProvince);
    }
  }, [watchedProvince]);

  const country = getCountryByCode(selectedCountry);
  const province = country?.provinces.find((p) => p.code === selectedProvince);

  // Reset dependent fields when parent selection changes
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedProvince("");
    form.setValue(countryFieldName, value);
    form.setValue(provinceFieldName, "");
    form.setValue(districtFieldName, "");
    form.setValue(cityFieldName, "");
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value);
    form.setValue(provinceFieldName, value);
    form.setValue(districtFieldName, "");
    form.setValue(cityFieldName, "");
  };

  const handleDistrictChange = (value: string) => {
    form.setValue(districtFieldName, value);
  };

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <FormField
        control={form.control}
        name={countryFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Country {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <Select
              onValueChange={handleCountryChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Province/Region Selection */}
      {selectedCountry && (
        <FormField
          control={form.control}
          name={provinceFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {selectedCountry === "RW" ? "Province" : "Region"}{" "}
                {required && <span className="text-red-500">*</span>}
              </FormLabel>
              <Select
                onValueChange={handleProvinceChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${selectedCountry === "RW" ? "province" : "region"}`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {country?.provinces.map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* District Selection */}
      {selectedCountry && selectedProvince && province && (
        <FormField
          control={form.control}
          name={districtFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                District {required && <span className="text-red-500">*</span>}
              </FormLabel>
              <Select
                onValueChange={handleDistrictChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px]">
                  {province.districts.map((district) => (
                    <SelectItem key={district.code} value={district.code}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* City/Area Text Input */}
      {selectedCountry && selectedProvince && form.watch(districtFieldName) && (
        <FormField
          control={form.control}
          name={cityFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                City or Area {required && <span className="text-red-500">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter city or area name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};
