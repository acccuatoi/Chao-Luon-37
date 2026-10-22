/**
 * Backend Configuration for SentinelAgent (Chao-Luon-37)
 * Configured for seamless local testing and GitHub repository deployment.
 */

export const CONFIG = {
  // Uses relative API path by default when hosted together, or configurable via window.__API_URL__
  BACKEND_URL: window.__API_URL__ || (window.location.hostname === "localhost" ? "http://localhost:8000" : ""),

  // Seamless fallback to local Tide simulation if backend is not yet active
  USE_MOCK_FALLBACK: true,

  // Connection timeout in milliseconds
  CONNECT_TIMEOUT: 2000
};
