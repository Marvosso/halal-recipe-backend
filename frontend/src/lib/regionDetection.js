/**
 * Region Detection and Platform Selection
 * Detects user location and determines best affiliate platform
 */

/**
 * Detect user's region from various sources
 * @returns {Promise<{countryCode: string, zipCode: string | null, regionCode: string}>}
 */
export async function detectUserRegion() {
  // Priority order:
  // 1. User preferences (stored in localStorage)
  // 2. Geolocation API (if available and permitted)
  // 3. IP-based detection (via backend API)
  // 4. Browser locale
  // 5. Default to US

  // Check user preferences first
  const userRegion = localStorage.getItem('userRegion');
  if (userRegion) {
    try {
      const parsed = JSON.parse(userRegion);
      if (parsed.countryCode) {
        return {
          countryCode: parsed.countryCode,
          zipCode: parsed.zipCode || null,
          regionCode: parsed.regionCode || parsed.countryCode
        };
      }
    } catch (e) {
      // Invalid stored data, continue to detection
    }
  }

  // Try geolocation API (requires user permission)
  try {
    const position = await getGeolocation();
    if (position) {
      // Reverse geocode to get country (would need a service)
      // For now, use timezone as fallback
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const countryCode = timezoneToCountryCode(timezone);
      
      if (countryCode) {
        return {
          countryCode,
          zipCode: null,
          regionCode: countryCode
        };
      }
    }
  } catch (e) {
    // Geolocation not available or denied
  }

  // Try browser locale
  const locale = navigator.language || navigator.userLanguage;
  const countryCode = locale.split('-')[1]?.toUpperCase() || null;
  
  if (countryCode && isValidCountryCode(countryCode)) {
    return {
      countryCode,
      zipCode: null,
      regionCode: countryCode
    };
  }

  // Default to US
  return {
    countryCode: 'US',
    zipCode: null,
    regionCode: 'US'
  };
}

/**
 * Get geolocation (with timeout)
 * @returns {Promise<GeolocationPosition | null>}
 */
function getGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => {
      resolve(null);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        resolve(position);
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { timeout: 5000, maximumAge: 3600000 } // Cache for 1 hour
    );
  });
}

/**
 * Convert timezone to country code (simplified mapping)
 * @param {string} timezone - IANA timezone (e.g., "America/New_York")
 * @returns {string | null}
 */
function timezoneToCountryCode(timezone) {
  const timezoneMap = {
    'America/': 'US',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'Europe/London': 'UK',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Asia/Dubai': 'AE',
    'Asia/Riyadh': 'SA',
    'Asia/Kuala_Lumpur': 'MY',
    'Asia/Jakarta': 'ID',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU'
  };

  for (const [tz, code] of Object.entries(timezoneMap)) {
    if (timezone.includes(tz)) {
      return code;
    }
  }

  return null;
}

/**
 * Validate country code
 * @param {string} code - ISO country code
 * @returns {boolean}
 */
function isValidCountryCode(code) {
  const validCodes = [
    'US', 'CA', 'UK', 'AU', 'SA', 'AE', 'MY', 'ID', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE'
  ];
  return validCodes.includes(code);
}

/**
 * Check if Instacart is available in region
 * @param {string} countryCode - ISO country code
 * @param {string} zipCode - Optional zip code
 * @returns {Promise<boolean>}
 */
export async function isInstacartAvailable(countryCode, zipCode = null) {
  // Instacart availability map
  const instacartRegions = {
    'US': true,
    'CA': true
  };

  // Check country-level availability
  if (!instacartRegions[countryCode]) {
    return false;
  }

  // For US/CA, check zip code coverage (would need API call in production)
  // For now, return true if country is supported
  return true;
}

/**
 * Check if Amazon is available in region
 * @param {string} countryCode - ISO country code
 * @returns {boolean}
 */
export function isAmazonAvailable(countryCode) {
  // Amazon availability (simplified - all major regions)
  const amazonRegions = {
    'US': true,
    'CA': true,
    'UK': true,
    'AU': true,
    'SA': true,
    'AE': true,
    'MY': true,
    'ID': true,
    'FR': true,
    'DE': true,
    'IT': true,
    'ES': true,
    'NL': true,
    'BE': true
  };

  return amazonRegions[countryCode] || false;
}

/**
 * Check if Thrive Market is available in region
 * @param {string} countryCode - ISO country code
 * @returns {boolean}
 */
export function isThriveMarketAvailable(countryCode) {
  // Thrive Market is US-only
  return countryCode === 'US';
}

/**
 * Save user region preference
 * @param {string} countryCode - ISO country code
 * @param {string} zipCode - Optional zip code
 */
export function saveUserRegion(countryCode, zipCode = null) {
  const regionData = {
    countryCode,
    zipCode,
    regionCode: countryCode,
    detectedAt: new Date().toISOString()
  };

  localStorage.setItem('userRegion', JSON.stringify(regionData));
}
