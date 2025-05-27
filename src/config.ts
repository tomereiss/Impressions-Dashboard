// Get the API URL from environment variable or fallback to hostname-based logic
const getApiUrl = () => {
  // First try to use the environment variable
  const envApiUrl = (window as any).process?.env?.REACT_APP_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  const hostname = window.location.hostname;
  // If we're on localhost, use localhost:3001
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  // Otherwise, use the current hostname with port 3001
  return `http://${hostname}:3001`;
};

export const API_URL = getApiUrl(); 