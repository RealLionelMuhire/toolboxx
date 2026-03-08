'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COUNTRIES, getCountryByCode } from '@/lib/location-data'

interface TenderDeliveryLocationProps {
  country: string
  province: string
  district: string
  address: string
  onCountryChange: (v: string) => void
  onProvinceChange: (v: string) => void
  onDistrictChange: (v: string) => void
  onAddressChange: (v: string) => void
}

export function TenderDeliveryLocation({
  country,
  province,
  district,
  address,
  onCountryChange,
  onProvinceChange,
  onDistrictChange,
  onAddressChange,
}: TenderDeliveryLocationProps) {
  const countryData = getCountryByCode(country)
  const provinceData = countryData?.provinces.find((p) => p.code === province)

  const handleCountryChange = (value: string) => {
    onCountryChange(value)
    onProvinceChange('')
    onDistrictChange('')
  }

  const handleProvinceChange = (value: string) => {
    onProvinceChange(value)
    onDistrictChange('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Delivery location: Country</Label>
        <Select value={country || undefined} onValueChange={handleCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {country && (
        <div className="space-y-1.5">
          <Label>Province / Region</Label>
          <Select value={province || undefined} onValueChange={handleProvinceChange}>
            <SelectTrigger>
              <SelectValue placeholder={country === 'RW' ? 'Select province' : 'Select region'} />
            </SelectTrigger>
            <SelectContent>
              {countryData?.provinces.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {country && province && provinceData && (
        <div className="space-y-1.5">
          <Label>District</Label>
          <Select value={district || undefined} onValueChange={onDistrictChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {provinceData.districts.map((d) => (
                <SelectItem key={d.code} value={d.code}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {country && province && district && (
        <div className="space-y-1.5">
          <Label>Exact address (street, building, area)</Label>
          <Input
            placeholder="Enter exact delivery address"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
