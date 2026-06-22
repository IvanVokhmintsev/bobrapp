export function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  if (import.meta.env.PROD) {
    return "";
  }

  return "http://localhost:3000";
}

export const apiUrl = getApiUrl();
