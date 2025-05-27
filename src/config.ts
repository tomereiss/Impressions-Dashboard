const isDevelopment = process.env.NODE_ENV === 'development';
const isHeroku = window.location.hostname.includes('herokuapp.com');

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'
  : isHeroku 
    ? `https://${window.location.hostname}`
    : 'http://localhost:3001'; 