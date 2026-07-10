/**
 * Central API configuration.
 * Uses the VITE_API_URL environment variable if set,
 * otherwise falls back to the production Render backend URL.
 */
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://sakhipause-backend.onrender.com/api'

export default API_URL
