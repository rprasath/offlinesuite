/**
 * Passport Photo Maker - Document Size Specifications
 */

export const specsData = {
  dpi: 300,
  zoomMin: 0.05,
  zoomMax: 5,

  regions: {
    global: { label: '🌍 International', order: 1 },
    usa: { label: '🇺🇸 United States', order: 2 },
    uk: { label: '🇬🇧 United Kingdom', order: 3 },
    europe: { label: '🇪🇺 Europe', order: 4 },
    asia: { label: '🌏 Asia', order: 5 },
    middleeast: { label: '🕌 Middle East', order: 6 },
    africa: { label: '🌍 Africa', order: 7 },
    americas: { label: '🌎 Americas', order: 8 },
    oceania: { label: '🌊 Oceania', order: 9 },
  },

  documentSizes: {
    'us-passport': {
      label: 'US Passport',
      displayLabel: 'US Passport (2×2 in)',
      region: 'usa',
      widthIn: 2,
      heightIn: 2,
    },
    'us-visa': {
      label: 'US Visa',
      displayLabel: 'US Visa (2×2 in)',
      region: 'usa',
      widthIn: 2,
      heightIn: 2,
    },
    'uk-passport': {
      label: 'UK Passport',
      displayLabel: 'UK Passport (35×45 mm)',
      region: 'uk',
      widthMm: 35,
      heightMm: 45,
    },
    'schengen-visa': {
      label: 'Schengen Visa',
      displayLabel: 'Schengen Visa (35×45 mm)',
      region: 'europe',
      widthMm: 35,
      heightMm: 45,
    },
    'icao-standard': {
      label: 'ICAO Standard',
      displayLabel: 'ICAO Standard (35×45 mm)',
      region: 'global',
      widthMm: 35,
      heightMm: 45,
    },

    // Europe
    'france-passport': {
      label: 'France Passport',
      displayLabel: 'France Passport (35×45 mm)',
      region: 'europe',
      widthMm: 35,
      heightMm: 45,
    },
    'germany-passport': {
      label: 'Germany Passport',
      displayLabel: 'Germany Passport (35×45 mm)',
      region: 'europe',
      widthMm: 35,
      heightMm: 45,
    },
    'spain-passport': {
      label: 'Spain Passport',
      displayLabel: 'Spain Passport (30×40 mm)',
      region: 'europe',
      widthMm: 30,
      heightMm: 40,
    },
    'italy-passport': {
      label: 'Italy Passport',
      displayLabel: 'Italy Passport (35×45 mm)',
      region: 'europe',
      widthMm: 35,
      heightMm: 45,
    },
    'netherlands-passport': {
      label: 'Netherlands Passport',
      displayLabel: 'Netherlands Passport (35×45 mm)',
      region: 'europe',
      widthMm: 35,
      heightMm: 45,
    },
    'ireland-passport': {
      label: 'Ireland Passport',
      displayLabel: 'Ireland Passport (35×45 mm)',
      region: 'europe',
      widthMm: 35,
      heightMm: 45,
    },

    // Asia
    'indian-passport': {
      label: 'Indian Passport',
      displayLabel: 'Indian Passport (35×35 mm)',
      region: 'asia',
      widthMm: 35,
      heightMm: 35,
    },
    'indian-visa': {
      label: 'Indian Visa',
      displayLabel: 'Indian Visa (51×51 mm)',
      region: 'asia',
      widthMm: 51,
      heightMm: 51,
    },
    'china-visa': {
      label: 'China Visa',
      displayLabel: 'China Visa (33×48 mm)',
      region: 'asia',
      widthMm: 33,
      heightMm: 48,
    },
    'japan-visa': {
      label: 'Japan Visa',
      displayLabel: 'Japan Visa (35×45 mm)',
      region: 'asia',
      widthMm: 35,
      heightMm: 45,
    },
    'pakistan-passport': {
      label: 'Pakistan Passport',
      displayLabel: 'Pakistan Passport (35×45 mm)',
      region: 'asia',
      widthMm: 35,
      heightMm: 45,
    },
    'bangladesh-passport': {
      label: 'Bangladesh Passport',
      displayLabel: 'Bangladesh Passport (45×55 mm)',
      region: 'asia',
      widthMm: 45,
      heightMm: 55,
    },
    'sri-lanka-passport': {
      label: 'Sri Lanka Passport',
      displayLabel: 'Sri Lanka Passport (35×45 mm)',
      region: 'asia',
      widthMm: 35,
      heightMm: 45,
    },
    'nepal-passport': {
      label: 'Nepal Passport',
      displayLabel: 'Nepal Passport (35×45 mm)',
      region: 'asia',
      widthMm: 35,
      heightMm: 45,
    },
    'singapore-passport': {
      label: 'Singapore Passport',
      displayLabel: 'Singapore Passport (35×45 mm)',
      region: 'asia',
      widthMm: 35,
      heightMm: 45,
    },
    'south-korea-passport': {
      label: 'South Korea Passport',
      displayLabel: 'South Korea Passport (35×45 mm)',
      region: 'asia',
      widthMm: 35,
      heightMm: 45,
    },

    // Middle East
    'uae-passport': {
      label: 'UAE Passport',
      displayLabel: 'UAE Passport (40×60 mm)',
      region: 'middleeast',
      widthMm: 40,
      heightMm: 60,
    },
    'saudi-visa': {
      label: 'Saudi Arabia Visa',
      displayLabel: 'Saudi Arabia Visa (35×45 mm)',
      region: 'middleeast',
      widthMm: 35,
      heightMm: 45,
    },
    'qatar-visa': {
      label: 'Qatar Visa',
      displayLabel: 'Qatar Visa (35×45 mm)',
      region: 'middleeast',
      widthMm: 35,
      heightMm: 45,
    },

    // Africa
    'south-africa-passport': {
      label: 'South Africa Passport',
      displayLabel: 'South Africa Passport (35×45 mm)',
      region: 'africa',
      widthMm: 35,
      heightMm: 45,
    },
    'nigeria-passport': {
      label: 'Nigeria Passport',
      displayLabel: 'Nigeria Passport (35×45 mm)',
      region: 'africa',
      widthMm: 35,
      heightMm: 45,
    },
    'kenya-passport': {
      label: 'Kenya Passport',
      displayLabel: 'Kenya Passport (35×45 mm)',
      region: 'africa',
      widthMm: 35,
      heightMm: 45,
    },

    // Americas
    'canada-passport': {
      label: 'Canada Passport',
      displayLabel: 'Canada Passport (50×70 mm)',
      region: 'americas',
      widthMm: 50,
      heightMm: 70,
    },
    'mexico-passport': {
      label: 'Mexico Passport',
      displayLabel: 'Mexico Passport (35×45 mm)',
      region: 'americas',
      widthMm: 35,
      heightMm: 45,
    },
    'brazil-passport': {
      label: 'Brazil Passport',
      displayLabel: 'Brazil Passport (50×70 mm)',
      region: 'americas',
      widthMm: 50,
      heightMm: 70,
    },
    'argentina-passport': {
      label: 'Argentina Passport',
      displayLabel: 'Argentina Passport (40×40 mm)',
      region: 'americas',
      widthMm: 40,
      heightMm: 40,
    },

    // Oceania
    'australia-passport': {
      label: 'Australia Passport',
      displayLabel: 'Australia Passport (35×45 mm)',
      region: 'oceania',
      widthMm: 35,
      heightMm: 45,
    },
    'new-zealand-passport': {
      label: 'New Zealand Passport',
      displayLabel: 'New Zealand Passport (35×45 mm)',
      region: 'oceania',
      widthMm: 35,
      heightMm: 45,
    },
  },

  printSizes: {
    '4x6': {
      label: '4×6 inches',
      widthIn: 4,
      heightIn: 6,
    },
    '5x7': {
      label: '5×7 inches',
      widthIn: 5,
      heightIn: 7,
    },
    'a4': {
      label: 'A4 (210×297 mm)',
      widthIn: 8.27,
      heightIn: 11.69,
    },
    'letter': {
      label: 'Letter (8.5×11 in)',
      widthIn: 8.5,
      heightIn: 11,
    },
  },
}

// Constants
export const DPI = specsData.dpi
export const ZOOM_MIN = specsData.zoomMin
export const ZOOM_MAX = specsData.zoomMax
export const REGIONS = specsData.regions

// Utility Functions
export function mmToPx(mm) {
  return Math.round((mm / 25.4) * DPI)
}

export function inchToPx(inch) {
  return Math.round(inch * DPI)
}

// Process Document Sizes
function processDocSizes(docSizes) {
  const processed = {}

  for (const [key, spec] of Object.entries(docSizes)) {
    const widthMm = spec.widthMm ?? spec.widthIn * 25.4
    const heightMm = spec.heightMm ?? spec.heightIn * 25.4

    let widthPx, heightPx

    if (spec.widthIn !== undefined && spec.heightIn !== undefined) {
      widthPx = inchToPx(spec.widthIn)
      heightPx = inchToPx(spec.heightIn)
    } else {
      widthPx = mmToPx(widthMm)
      heightPx = mmToPx(heightMm)
    }

    processed[key] = {
      label: spec.label,
      displayLabel: spec.displayLabel,
      region: spec.region,
      widthPx,
      heightPx,
      widthMm,
      heightMm,
    }
  }

  return processed
}

// Process Print Sizes
function processPrintSizes(printSizes) {
  const processed = {}

  for (const [key, spec] of Object.entries(printSizes)) {
    processed[key] = {
      label: spec.label,
      widthPx: inchToPx(spec.widthIn),
      heightPx: inchToPx(spec.heightIn),
    }
  }

  return processed
}

// Exported processed sizes
export const DOC_SIZES = processDocSizes(specsData.documentSizes)
export const PRINT_SIZES = processPrintSizes(specsData.printSizes)
