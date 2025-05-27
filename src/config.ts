// Determine if we're running in development or production
const isDevelopment = process.env.NODE_ENV === 'development';

// Set the API base URL based on the environment
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'  // Development URL with port
  : window.location.origin;  // Production URL (same as frontend) 