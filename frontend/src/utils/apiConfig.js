/**
 * API Configuration Utility
 * Automatically detects mobile vs desktop and sets the appropriate backend URL
 */
import logger from "./logger";

/**
 * Detects if the device is mobile
 * @returns {boolean} True if mobile device, false otherwise
 */
function isMobileDevice() {
  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Check screen size (mobile typically < 768px)
  const isSmallScreen = window.innerWidth < 768;
  
  // Check touch capability
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check if device is mobile based on multiple factors
  return mobileRegex.test(userAgent) || (isSmallScreen && hasTouchScreen);
}

/**
 * Gets the network IP address of the current device
 * Uses WebRTC to get local IP, falls back to hostname or localhost
 * @returns {Promise<string>} IP address or hostname
 */
async function getNetworkIP() {
  return new Promise((resolve) => {
    // First, check if we're already accessing via network IP
    const hostname = window.location.hostname;
    
    // If hostname is a valid IP (not localhost), use it
    if (hostname && 
        hostname !== 'localhost' && 
        hostname !== '127.0.0.1' &&
        /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      resolve(hostname);
      return;
    }
    
    // If hostname is a domain name (not localhost), try using it
    // This handles cases where the site is accessed via a domain
    if (hostname && 
        hostname !== 'localhost' && 
        hostname !== '127.0.0.1' &&
        !hostname.includes('.')) {
      // Might be a local network name, try it
      resolve(hostname);
      return;
    }
    
    // Try WebRTC to get local IP (works in Chrome, Edge, some mobile browsers)
    const RTCPeerConnection = window.RTCPeerConnection || 
                              window.mozRTCPeerConnection || 
                              window.webkitRTCPeerConnection;
    
    if (!RTCPeerConnection) {
      // Fallback to localhost if WebRTC not available
      logger.warn('[API Config] WebRTC not available, using localhost');
      resolve('localhost');
      return;
    }
    
    let resolved = false;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    pc.createDataChannel('');
    
    pc.onicecandidate = (event) => {
      if (event.candidate && !resolved) {
        const candidate = event.candidate.candidate;
        // Match IPv4 addresses
        const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match) {
          const ip = match[1];
          // Filter out localhost, invalid IPs, and private network ranges we don't want
          if (ip && 
              !ip.startsWith('127.') && 
              ip !== '0.0.0.0' &&
              !ip.startsWith('169.254.')) { // Link-local addresses
            resolved = true;
            pc.close();
            logger.log(`[API Config] Detected network IP: ${ip}`);
            resolve(ip);
            return;
          }
        }
      }
    };
    
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch((error) => {
        logger.warn('[API Config] WebRTC offer failed:', error);
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve('localhost');
        }
      });
    
    // Timeout after 2 seconds
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        pc.close();
        logger.warn('[API Config] WebRTC timeout, using localhost');
        resolve('localhost');
      }
    }, 2000);
  });
}

/**
 * Gets the base API URL based on device type and environment
 * @returns {Promise<string>} Base URL for API calls
 */
async function getBaseURL() {
  // First, check for environment variable (highest priority)
  const envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
  if (envApiUrl) {
    const cleanUrl = envApiUrl.replace(/\/$/, ''); // Remove trailing slash
    logger.log(`[API Config] Using environment variable API URL: ${cleanUrl}`);
    return cleanUrl;
  }
  
  // Get the current hostname (works when accessing via network IP)
  const currentHostname = window.location.hostname;
  
  // Production fallback: if we're on a production domain (not localhost), use Render backend
  const isProduction = currentHostname !== 'localhost' && 
                       currentHostname !== '127.0.0.1' && 
                       !currentHostname.startsWith('192.168.') &&
                       !currentHostname.startsWith('10.') &&
                       !/^(\d{1,3}\.){3}\d{1,3}$/.test(currentHostname);
  
  if (isProduction) {
    const productionUrl = 'https://halal-recipe-backend.onrender.com';
    logger.log(`[API Config] Using production backend URL: ${productionUrl}`);
    return productionUrl;
  }
  
  // If accessing via IP address (not localhost), use that for backend
  if (currentHostname && 
      currentHostname !== 'localhost' && 
      currentHostname !== '127.0.0.1' &&
      /^(\d{1,3}\.){3}\d{1,3}$/.test(currentHostname)) {
    const backendUrl = `http://${currentHostname}:3000`;
    logger.log(`[API Config] Using current hostname for backend: ${backendUrl}`);
    return backendUrl;
  }
  
  // For mobile devices or when accessing via network, try to detect network IP
  const isMobile = isMobileDevice();
  
  // If we're already accessing the frontend via network IP, use the same IP for backend
  // This is the most reliable method for mobile devices (especially iPad)
  if (currentHostname && 
      currentHostname !== 'localhost' && 
      currentHostname !== '127.0.0.1' &&
      currentHostname !== '0.0.0.0') {
    const backendUrl = `http://${currentHostname}:3000`;
    logger.log(`[API Config] Using current hostname for backend (most reliable for mobile): ${backendUrl}`);
    return backendUrl;
  }
  
  if (isMobile) {
    // On mobile, try to get network IP via WebRTC (may not work on all devices like iPad)
    const ip = await getNetworkIP();
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      const backendUrl = `http://${ip}:3000`;
      logger.log(`[API Config] Using detected network IP for mobile: ${backendUrl}`);
      return backendUrl;
    }
    // If WebRTC fails on mobile, we'll fall through to localhost
    // This should only happen if accessing via localhost on mobile
      logger.warn(`[API Config] WebRTC detection failed on mobile, falling back to localhost`);
  }
  
  // Default fallback: use localhost (for desktop or when all else fails)
  logger.log(`[API Config] Using default localhost backend URL`);
  return 'http://localhost:3000';
}

/**
 * Cached base URL to avoid repeated async calls
 */
let cachedBaseURL = null;
let baseURLPromise = null;

/**
 * Gets the base URL (cached for performance)
 * @returns {Promise<string>} Base URL for API calls
 */
export async function getAPIBaseURL() {
  if (cachedBaseURL) {
    return cachedBaseURL;
  }
  
  if (!baseURLPromise) {
    baseURLPromise = getBaseURL().then(url => {
      cachedBaseURL = url;
      logger.log(`[API Config] Using backend URL: ${url}`);
      return url;
    });
  }
  
  return baseURLPromise;
}

/**
 * Resets the cached base URL (useful for testing or re-detection)
 */
export function resetAPIBaseURL() {
  cachedBaseURL = null;
  baseURLPromise = null;
}

/**
 * Gets the full API endpoint URL
 * @param {string} endpoint - API endpoint (e.g., '/convert')
 * @returns {Promise<string>} Full URL
 */
export async function getAPIURL(endpoint) {
  const baseURL = await getAPIBaseURL();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
}

// Export utility functions for testing
export { isMobileDevice, getNetworkIP };
