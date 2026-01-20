/**
 * Location data for Rwanda, Uganda, and Tanzania
 * Contains administrative structure: Country → Province/Region → Districts
 */

export interface District {
  name: string;
  code: string;
}

export interface Province {
  name: string;
  code: string;
  districts: District[];
}

export interface Country {
  name: string;
  code: string;
  provinces: Province[];
}

/**
 * Rwanda: 5 Provinces → 30 Districts
 */
const rwandaProvinces: Province[] = [
  {
    name: "Kigali City",
    code: "KC",
    districts: [
      { name: "Gasabo", code: "GAS" },
      { name: "Kicukiro", code: "KIC" },
      { name: "Nyarugenge", code: "NYA" },
    ],
  },
  {
    name: "Eastern Province",
    code: "EP",
    districts: [
      { name: "Bugesera", code: "BUG" },
      { name: "Gatsibo", code: "GAT" },
      { name: "Kayonza", code: "KAY" },
      { name: "Kirehe", code: "KIR" },
      { name: "Ngoma", code: "NGO" },
      { name: "Nyagatare", code: "NYG" },
      { name: "Rwamagana", code: "RWA" },
    ],
  },
  {
    name: "Northern Province",
    code: "NP",
    districts: [
      { name: "Burera", code: "BUR" },
      { name: "Gakenke", code: "GAK" },
      { name: "Gicumbi", code: "GIC" },
      { name: "Musanze", code: "MUS" },
      { name: "Rulindo", code: "RUL" },
    ],
  },
  {
    name: "Southern Province",
    code: "SP",
    districts: [
      { name: "Gisagara", code: "GIS" },
      { name: "Huye", code: "HUY" },
      { name: "Kamonyi", code: "KAM" },
      { name: "Muhanga", code: "MUH" },
      { name: "Nyamagabe", code: "NYM" },
      { name: "Nyanza", code: "NYZ" },
      { name: "Nyaruguru", code: "NYR" },
      { name: "Ruhango", code: "RUH" },
    ],
  },
  {
    name: "Western Province",
    code: "WP",
    districts: [
      { name: "Karongi", code: "KAR" },
      { name: "Ngororero", code: "NGR" },
      { name: "Nyabihu", code: "NYB" },
      { name: "Nyamasheke", code: "NYS" },
      { name: "Rubavu", code: "RUB" },
      { name: "Rusizi", code: "RUS" },
      { name: "Rutsiro", code: "RUT" },
    ],
  },
];

/**
 * Uganda: 4 Regions → 135+ Districts (Major districts included)
 */
const ugandaRegions: Province[] = [
  {
    name: "Central Region",
    code: "CR",
    districts: [
      { name: "Kampala", code: "KLA" },
      { name: "Wakiso", code: "WAK" },
      { name: "Mpigi", code: "MPG" },
      { name: "Mukono", code: "MUK" },
      { name: "Luwero", code: "LUW" },
      { name: "Nakaseke", code: "NAK" },
      { name: "Nakasongola", code: "NKS" },
      { name: "Kiboga", code: "KIB" },
      { name: "Mubende", code: "MUB" },
      { name: "Mityana", code: "MIT" },
      { name: "Kyankwanzi", code: "KYA" },
      { name: "Gomba", code: "GOM" },
      { name: "Butambala", code: "BUT" },
      { name: "Kalungu", code: "KAL" },
      { name: "Kalangala", code: "KLG" },
      { name: "Lyantonde", code: "LYA" },
      { name: "Masaka", code: "MAS" },
      { name: "Rakai", code: "RAK" },
      { name: "Bukomansimbi", code: "BUK" },
      { name: "Lwengo", code: "LWE" },
    ],
  },
  {
    name: "Eastern Region",
    code: "ER",
    districts: [
      { name: "Jinja", code: "JIN" },
      { name: "Mbale", code: "MBA" },
      { name: "Iganga", code: "IGA" },
      { name: "Tororo", code: "TOR" },
      { name: "Busia", code: "BUS" },
      { name: "Kamuli", code: "KMU" },
      { name: "Kapchorwa", code: "KAP" },
      { name: "Pallisa", code: "PAL" },
      { name: "Soroti", code: "SOR" },
      { name: "Kumi", code: "KUM" },
      { name: "Katakwi", code: "KTK" },
      { name: "Mayuge", code: "MAY" },
      { name: "Sironko", code: "SIR" },
      { name: "Budaka", code: "BUD" },
      { name: "Bududa", code: "BDD" },
      { name: "Butaleja", code: "BTL" },
      { name: "Kaliro", code: "KLR" },
      { name: "Manafwa", code: "MAN" },
      { name: "Namutumba", code: "NAM" },
      { name: "Bukwa", code: "BKW" },
    ],
  },
  {
    name: "Northern Region",
    code: "NR",
    districts: [
      { name: "Gulu", code: "GUL" },
      { name: "Lira", code: "LIR" },
      { name: "Arua", code: "ARU" },
      { name: "Kitgum", code: "KIT" },
      { name: "Pader", code: "PAD" },
      { name: "Apac", code: "APC" },
      { name: "Kotido", code: "KOT" },
      { name: "Moroto", code: "MOR" },
      { name: "Nebbi", code: "NEB" },
      { name: "Yumbe", code: "YUM" },
      { name: "Adjumani", code: "ADJ" },
      { name: "Moyo", code: "MOY" },
      { name: "Amuru", code: "AMU" },
      { name: "Oyam", code: "OYA" },
      { name: "Abim", code: "ABI" },
      { name: "Kaabong", code: "KAA" },
      { name: "Koboko", code: "KOB" },
      { name: "Maracha", code: "MAR" },
      { name: "Nakapiripirit", code: "NKP" },
      { name: "Napak", code: "NAP" },
    ],
  },
  {
    name: "Western Region",
    code: "WR",
    districts: [
      { name: "Mbarara", code: "MBR" },
      { name: "Kasese", code: "KAS" },
      { name: "Hoima", code: "HOI" },
      { name: "Kabale", code: "KAB" },
      { name: "Bushenyi", code: "BSH" },
      { name: "Ntungamo", code: "NTU" },
      { name: "Rukungiri", code: "RUK" },
      { name: "Bundibugyo", code: "BUN" },
      { name: "Kabarole", code: "KBR" },
      { name: "Kisoro", code: "KIS" },
      { name: "Masindi", code: "MSD" },
      { name: "Kanungu", code: "KAN" },
      { name: "Kyenjojo", code: "KYE" },
      { name: "Kamwenge", code: "KMW" },
      { name: "Ibanda", code: "IBA" },
      { name: "Isingiro", code: "ISI" },
      { name: "Kiruhura", code: "KRU" },
      { name: "Buliisa", code: "BUL" },
      { name: "Ntoroko", code: "NTO" },
      { name: "Kiryandongo", code: "KRY" },
    ],
  },
];

/**
 * Tanzania: 31 Regions → 184 Districts (Major districts included)
 */
const tanzaniaRegions: Province[] = [
  {
    name: "Dar es Salaam",
    code: "DAR",
    districts: [
      { name: "Ilala", code: "ILA" },
      { name: "Kinondoni", code: "KIN" },
      { name: "Temeke", code: "TEM" },
      { name: "Ubungo", code: "UBU" },
      { name: "Kigamboni", code: "KIG" },
    ],
  },
  {
    name: "Arusha",
    code: "ARU",
    districts: [
      { name: "Arusha City", code: "ARC" },
      { name: "Arusha", code: "ARD" },
      { name: "Karatu", code: "KAR" },
      { name: "Longido", code: "LON" },
      { name: "Monduli", code: "MON" },
      { name: "Ngorongoro", code: "NGO" },
    ],
  },
  {
    name: "Dodoma",
    code: "DOD",
    districts: [
      { name: "Dodoma City", code: "DOC" },
      { name: "Bahi", code: "BAH" },
      { name: "Chamwino", code: "CHA" },
      { name: "Chemba", code: "CHE" },
      { name: "Kondoa", code: "KON" },
      { name: "Kongwa", code: "KNG" },
      { name: "Mpwapwa", code: "MPW" },
    ],
  },
  {
    name: "Mwanza",
    code: "MWZ",
    districts: [
      { name: "Mwanza City", code: "MWC" },
      { name: "Ilemela", code: "ILE" },
      { name: "Nyamagana", code: "NYM" },
      { name: "Kwimba", code: "KWI" },
      { name: "Magu", code: "MAG" },
      { name: "Misungwi", code: "MIS" },
      { name: "Sengerema", code: "SEN" },
      { name: "Ukerewe", code: "UKE" },
    ],
  },
  {
    name: "Kilimanjaro",
    code: "KLM",
    districts: [
      { name: "Moshi Municipal", code: "MOS" },
      { name: "Moshi", code: "MOD" },
      { name: "Hai", code: "HAI" },
      { name: "Mwanga", code: "MWA" },
      { name: "Rombo", code: "ROM" },
      { name: "Same", code: "SAM" },
      { name: "Siha", code: "SIH" },
    ],
  },
  {
    name: "Tanga",
    code: "TNG",
    districts: [
      { name: "Tanga City", code: "TNC" },
      { name: "Handeni", code: "HAN" },
      { name: "Kilindi", code: "KIL" },
      { name: "Korogwe", code: "KOR" },
      { name: "Lushoto", code: "LUS" },
      { name: "Muheza", code: "MUH" },
      { name: "Mkinga", code: "MKI" },
      { name: "Pangani", code: "PAN" },
    ],
  },
  {
    name: "Morogoro",
    code: "MOR",
    districts: [
      { name: "Morogoro Municipal", code: "MOM" },
      { name: "Morogoro", code: "MOD" },
      { name: "Gairo", code: "GAI" },
      { name: "Kilombero", code: "KBR" },
      { name: "Kilosa", code: "KLS" },
      { name: "Malinyi", code: "MAL" },
      { name: "Mvomero", code: "MVO" },
      { name: "Ulanga", code: "ULA" },
    ],
  },
  {
    name: "Mbeya",
    code: "MBY",
    districts: [
      { name: "Mbeya City", code: "MBC" },
      { name: "Chunya", code: "CHU" },
      { name: "Kyela", code: "KYE" },
      { name: "Mbarali", code: "MBA" },
      { name: "Mbeya", code: "MBD" },
      { name: "Momba", code: "MOM" },
      { name: "Rungwe", code: "RUN" },
    ],
  },
  {
    name: "Zanzibar",
    code: "ZNZ",
    districts: [
      { name: "Zanzibar City", code: "ZNC" },
      { name: "Kaskazini A", code: "KSA" },
      { name: "Kaskazini B", code: "KSB" },
      { name: "Kati", code: "KAT" },
      { name: "Kusini", code: "KUS" },
      { name: "Mjini", code: "MJI" },
    ],
  },
  {
    name: "Pwani (Coast)",
    code: "PWN",
    districts: [
      { name: "Bagamoyo", code: "BAG" },
      { name: "Kibaha", code: "KIB" },
      { name: "Kisarawe", code: "KIS" },
      { name: "Mafia", code: "MAF" },
      { name: "Mkuranga", code: "MKU" },
      { name: "Rufiji", code: "RUF" },
    ],
  },
];

export const COUNTRIES: Country[] = [
  {
    name: "Rwanda",
    code: "RW",
    provinces: rwandaProvinces,
  },
  {
    name: "Uganda",
    code: "UG",
    provinces: ugandaRegions,
  },
  {
    name: "Tanzania",
    code: "TZ",
    provinces: tanzaniaRegions,
  },
];

/**
 * Helper function to get country by code
 */
export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find((c) => c.code === code);
};

/**
 * Helper function to get province by code within a country
 */
export const getProvinceByCode = (countryCode: string, provinceCode: string): Province | undefined => {
  const country = getCountryByCode(countryCode);
  return country?.provinces.find((p) => p.code === provinceCode);
};

/**
 * Helper function to get district by code within a province
 */
export const getDistrictByCode = (
  countryCode: string,
  provinceCode: string,
  districtCode: string
): District | undefined => {
  const province = getProvinceByCode(countryCode, provinceCode);
  return province?.districts.find((d) => d.code === districtCode);
};

/**
 * Helper function to format full location string
 */
export const formatLocation = (
  countryCode: string,
  provinceCode: string,
  districtCode: string,
  cityOrArea?: string
): string => {
  const country = getCountryByCode(countryCode);
  const province = getProvinceByCode(countryCode, provinceCode);
  const district = getDistrictByCode(countryCode, provinceCode, districtCode);

  const parts = [];
  if (cityOrArea) parts.push(cityOrArea);
  if (district) parts.push(district.name);
  if (province) parts.push(province.name);
  if (country) parts.push(country.name);

  return parts.join(", ");
};
