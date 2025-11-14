/* global BigInt */
import { racingApi } from "../utils/racingApi";

/**
 * Unified race data service that fetches and formats data consistently
 */

/**
 * Fetch and format race data with all related information
 * @param {number} raceId - The race ID
 * @returns {Promise<Object>} Formatted race data with market, telemetry, and standings
 */
export async function getFormattedRaceData(raceId) {
  try {
    // Fetch all race-related data in parallel
    const [race, market, bettingPool] = await Promise.allSettled([
      racingApi.getRace(raceId),
      racingApi.getMarket(raceId),
      racingApi.getBettingPool(raceId).catch(() => null),
    ]);

    const raceData = race.status === "fulfilled" ? race.value : null;
    const marketData = market.status === "fulfilled" ? market.value : null;
    const poolData = bettingPool.status === "fulfilled" ? bettingPool.value : null;

    if (!raceData) {
      return null;
    }

    // Fetch telemetry for all participants
    let telemetryData = {};
    if (raceData.participantTokenIds && raceData.participantTokenIds.length > 0) {
      const telemetryPromises = raceData.participantTokenIds.map(async (tokenId) => {
        try {
          const telemetry = await racingApi.getTelemetry(raceId, tokenId, 1);
          if (telemetry && telemetry.snapshots && telemetry.snapshots.length > 0) {
            return { tokenId, telemetry: telemetry.snapshots[0] };
          }
        } catch (err) {
          // Ignore errors for individual telemetry fetches
        }
        return null;
      });

      const telemetryResults = await Promise.all(telemetryPromises);
      telemetryResults.forEach((result) => {
        if (result && result.telemetry) {
          telemetryData[result.tokenId] = result.telemetry;
        }
      });
    }

    // Format competitors with telemetry and standings
    const competitors = raceData.participantTokenIds
      .map((tokenId) => {
        const telemetry = telemetryData[tokenId];
        const isBot = raceData.botTokenIds?.includes(tokenId) || false;
        
        // Calculate total distance based on lap and lap progress
        const totalDistance =
          (telemetry?.currentLap || 0) * (raceData.totalLaps || 10) * 100 +
          ((telemetry?.lapProgress || 0) / 100) * (raceData.totalLaps || 10) * 100;

        return {
          tokenId,
          name: isBot ? `Bot #${tokenId}` : `Car #${tokenId}`,
          speed: telemetry?.speed || 0,
          distance: totalDistance,
          currentLap: telemetry?.currentLap || 0,
          lapProgress: telemetry?.lapProgress || 0,
          position: 0, // Will be calculated after sorting
          isBot,
          telemetry: telemetry || null,
        };
      })
      .sort((a, b) => {
        // Sort by lap (descending), then by lap progress (descending), then by speed (descending)
        if (b.currentLap !== a.currentLap) return b.currentLap - a.currentLap;
        if (b.lapProgress !== a.lapProgress) return b.lapProgress - a.lapProgress;
        return (b.speed || 0) - (a.speed || 0);
      })
      .map((participant, index) => ({
        ...participant,
        position: index + 1,
      }));

    return {
      // Race info
      raceId: raceData.raceId,
      participantTokenIds: raceData.participantTokenIds || [],
      botTokenIds: raceData.botTokenIds || [],
      totalLaps: raceData.totalLaps || 10,
      startTime: raceData.startTime || 0,
      endTime: raceData.endTime || 0,
      isActive: raceData.isActive || false,
      isFinished: raceData.isFinished || false,
      winnerTokenId: raceData.winnerTokenId || 0,
      totalDistance: raceData.totalDistance || 0,

      // Market/betting info
      market: marketData
        ? {
            raceId: marketData.raceId,
            totalPoolWei: marketData.totalPoolWei || "0",
            markets: marketData.markets || [],
            isActive: marketData.isActive || false,
            isFinished: marketData.isFinished || false,
            totalLaps: marketData.totalLaps || raceData.totalLaps || 10,
          }
        : null,

      bettingPool: poolData
        ? {
            totalPool: poolData.totalPool || "0",
            isSettled: poolData.isSettled || false,
            tokenBets: poolData.tokenBets || {},
          }
        : null,

      // Competitors and standings
      competitors,
      telemetryData,

      // Calculated race time
      raceTime: raceData.startTime
        ? Math.floor((Date.now() - raceData.startTime * 1000) / 1000)
        : 0,
    };
  } catch (error) {
    console.error("Error fetching formatted race data:", error);
    return null;
  }
}

/**
 * Fetch all available races with market data
 * @returns {Promise<Array>} Array of formatted race data
 */
export async function getAllRacesWithMarkets() {
  try {
    const markets = await racingApi.getMarkets();
    
    return markets.map((market) => ({
      raceId: market.raceId,
      status: market.isFinished ? "finished" : market.isActive ? "live" : "upcoming",
      isActive: market.isActive || false,
      isFinished: market.isFinished || false,
      totalLaps: market.totalLaps || 10,
      totalPoolWei: market.totalPoolWei || "0",
      startTime: market.startTime || 0,
      endTime: market.endTime || 0,
      markets: market.markets || [], // Betting options
      participantCount: market.markets?.length || 0,
    }));
  } catch (error) {
    console.error("Error fetching all races with markets:", error);
    return [];
  }
}

/**
 * Format market data for display
 * @param {Object} market - Market data from API
 * @returns {Object} Formatted market data
 */
export function formatMarketData(market) {
  if (!market) return null;

  return {
    raceId: market.raceId,
    totalPool: formatEth(market.totalPoolWei || "0"),
    totalPoolWei: market.totalPoolWei || "0",
    isActive: market.isActive || false,
    isFinished: market.isFinished || false,
    totalLaps: market.totalLaps || 10,
    options: (market.markets || []).map((option) => ({
      tokenId: option.tokenId,
      isBot: option.isBot || false,
      impliedProbability: option.impliedProbability || 0,
      betTotal: formatEth(option.betTotalWei || "0"),
      betTotalWei: option.betTotalWei || "0",
      multiplier: option.impliedProbability > 0 
        ? (100 / option.impliedProbability).toFixed(2) 
        : "—",
    })),
  };
}

/**
 * Format ETH from Wei string
 */
function formatEth(weiString = "0") {
  try {
    const wei = BigInt(weiString);
    const ether = Number(wei) / 1e18;
    return ether.toFixed(4);
  } catch {
    const num = parseFloat(weiString) || 0;
    return (num / 1e18).toFixed(4);
  }
}

