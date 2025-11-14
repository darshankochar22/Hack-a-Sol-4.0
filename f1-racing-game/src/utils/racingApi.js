const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5002";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const racingApi = {
  getDashboardSnapshot: () => request("/api/dashboard/live"),
  getRaces: () => request("/api/races"),
  getRace: (raceId) => request(`/api/races/${raceId}`),
  getTelemetry: (raceId, tokenId, limit = 100) =>
    request(`/api/races/${raceId}/telemetry?tokenId=${tokenId}&limit=${limit}`),
  updateTelemetry: (raceId, tokenId, telemetryData) =>
    request(`/api/races/${raceId}/telemetry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId, ...telemetryData }),
    }),
  getBettingPool: (raceId) => request(`/api/races/${raceId}/betting`),
  getOdds: (raceId, tokenId) => request(`/api/races/${raceId}/odds/${tokenId}`),
  getMarkets: () => request("/api/markets"),
  getMarket: (raceId) => request(`/api/markets/${raceId}`),
  getMarketHistory: (raceId, limit = 200) =>
    request(`/api/markets/${raceId}/history?limit=${limit}`),
};
