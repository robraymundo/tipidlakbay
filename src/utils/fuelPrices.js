const FUEL_PRICE_PRESETS = {
  default: {
    areaLabel: "National reference",
    prices: {
      ron91: 61.90,
      premium: 67.40,
      diesel: 59.80,
    },
  },
  ncr: {
    areaLabel: "NCR",
    prices: {
      ron91: 60.80,
      premium: 66.90,
      diesel: 58.90,
    },
  },
  northLuzon: {
    areaLabel: "North Luzon",
    prices: {
      ron91: 61.70,
      premium: 67.80,
      diesel: 60.20,
    },
  },
  southLuzon: {
    areaLabel: "South Luzon",
    prices: {
      ron91: 62.10,
      premium: 68.20,
      diesel: 60.60,
    },
  },
  visayas: {
    areaLabel: "Visayas",
    prices: {
      ron91: 63.40,
      premium: 69.50,
      diesel: 61.90,
    },
  },
  mindanao: {
    areaLabel: "Mindanao",
    prices: {
      ron91: 62.80,
      premium: 68.90,
      diesel: 61.30,
    },
  },
};

const AREA_KEYWORDS = {
  ncr: [
    "metro manila",
    "ncr",
    "manila",
    "quezon city",
    "makati",
    "taguig",
    "pasig",
    "pasay",
    "paranaque",
    "parañaque",
    "las pinas",
    "las piñas",
    "mandaluyong",
    "marikina",
    "muntinlupa",
    "caloocan",
    "malabon",
    "navotas",
    "san juan",
    "valenzuela",
    "pateros",
  ],
  southLuzon: [
    "cavite",
    "laguna",
    "batangas",
    "rizal",
    "quezon",
    "lucena",
    "antipolo",
    "tagaytay",
    "calamba",
    "santa rosa",
    "sta rosa",
    "biñan",
    "binan",
    "lipa",
    "batangas city",
    "san pablo",
    "tanauan",
  ],
  northLuzon: [
    "ilocos",
    "pangasinan",
    "la union",
    "cagayan",
    "tuguegarao",
    "isabela",
    "ilagan",
    "nueva vizcaya",
    "quirino",
    "benguet",
    "baguio",
    "kalinga",
    "apayao",
    "abra",
    "ifugao",
    "nueva ecija",
    "tarlac",
    "pampanga",
    "bulacan",
    "zambales",
    "bataan",
    "aurora",
  ],
  visayas: [
    "cebu",
    "iloilo",
    "bacolod",
    "negros",
    "bohol",
    "leyte",
    "samar",
    "tacloban",
    "ormoc",
    "dumaguete",
    "aklan",
    "capiz",
    "antique",
    "guimaras",
    "siquijor",
  ],
  mindanao: [
    "davao",
    "cagayan de oro",
    "zamboanga",
    "general santos",
    "gensan",
    "butuan",
    "surigao",
    "iligan",
    "misamis",
    "cotabato",
    "bukidnon",
    "dipolog",
    "pagadian",
    "tagum",
    "mati",
    "ozamiz",
  ],
};

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function inferFuelPriceArea(placeName = "") {
  const normalizedPlace = normalizeText(placeName);

  if (!normalizedPlace) {
    return "default";
  }

  for (const [areaKey, keywords] of Object.entries(AREA_KEYWORDS)) {
    const hasMatch = keywords.some((keyword) =>
      normalizedPlace.includes(normalizeText(keyword))
    );

    if (hasMatch) {
      return areaKey;
    }
  }

  return "default";
}

export function getFuelPriceContext(placeName = "") {
  const areaKey = inferFuelPriceArea(placeName);
  const preset = FUEL_PRICE_PRESETS[areaKey] ?? FUEL_PRICE_PRESETS.default;
  const hasOrigin = placeName.trim().length > 0;
  const shouldShowMatchedNote = hasOrigin && areaKey !== "default";

  return {
    areaKey,
    areaLabel: preset.areaLabel,
    prices: preset.prices,
    note: shouldShowMatchedNote
      ? `Estimated reference prices for ${preset.areaLabel}.`
      : "",
  };
}

export function formatFuelPrice(value) {
  return `${Number(value).toFixed(2)}/L`;
}