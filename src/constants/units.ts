export const UNIT_OPTIONS = [
  { value: "unit", label: "Unit(s)" },
  { value: "piece", label: "Piece(s)" },
  { value: "box", label: "Box(es)" },
  { value: "pack", label: "Pack(s)" },
  { value: "bag", label: "Bag(s)" },
  { value: "kg", label: "Kilogram(s)" },
  { value: "gram", label: "Gram(s)" },
  { value: "meter", label: "Meter(s)" },
  { value: "cm", label: "Centimeter(s)" },
  { value: "liter", label: "Liter(s)" },
  { value: "sqm", label: "Square Meter(s)" },
  { value: "cbm", label: "Cubic Meter(s)" },
  { value: "set", label: "Set(s)" },
  { value: "pair", label: "Pair(s)" },
  { value: "roll", label: "Roll(s)" },
  { value: "sheet", label: "Sheet(s)" },
  { value: "carton", label: "Carton(s)" },
  { value: "pallet", label: "Pallet(s)" },
  { value: "hour", label: "Hour(s) - Rental" },
  { value: "day", label: "Day(s) - Rental" },
  { value: "week", label: "Week(s) - Rental" },
  { value: "month", label: "Month(s) - Rental" },
] as const;

export type UnitValue = (typeof UNIT_OPTIONS)[number]["value"];

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'RWF', label: 'RWF' },
  { value: 'EUR', label: 'EUR' },
] as const;
