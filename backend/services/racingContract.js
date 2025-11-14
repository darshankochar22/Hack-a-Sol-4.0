const path = require("path");
const { EventEmitter } = require("events");
const { ethers } = require("ethers");

const {
  RACING_RPC_URL = "http://127.0.0.1:8545",
  RACING_ENGINE_ADDRESS,
  RACING_FROM_BLOCK = "0",
  RACING_PRIVATE_KEY, // Private key for signing transactions (owner)
} = process.env;

if (!RACING_ENGINE_ADDRESS) {
  throw new Error(
    "Missing RACING_ENGINE_ADDRESS in environment. Please set it to your deployed RealtimeRacingEngine address."
  );
}

const ABI_PATH = path.join(
  __dirname,
  "..",
  "..",
  "my-contracts",
  "artifacts",
  "contracts",
  "RealtimeRacingEngine.sol",
  "RealtimeRacingEngine.json"
);

// eslint-disable-next-line import/no-dynamic-require, global-require
const racingArtifact = require(ABI_PATH);
const provider = new ethers.JsonRpcProvider(RACING_RPC_URL);

// Create contract instance with signer if private key is provided
let contract;
let contractWithSigner;
if (RACING_PRIVATE_KEY) {
  const wallet = new ethers.Wallet(RACING_PRIVATE_KEY, provider);
  contractWithSigner = new ethers.Contract(
    RACING_ENGINE_ADDRESS,
    racingArtifact.abi,
    wallet
  );
  console.log("✅ Racing contract signer initialized:", wallet.address);
}

// Read-only contract instance
contract = new ethers.Contract(
  RACING_ENGINE_ADDRESS,
  racingArtifact.abi,
  provider
);

const races = new Map(); // raceId -> race summary
const bettingPools = new Map(); // raceId -> betting summary
const oddsHistory = new Map(); // raceId -> [{ timestamp, markets, totalPoolWei }]
const eventBus = new EventEmitter();

let initialized = false;

const numberify = (value) => Number(ethers.toNumber(value));
const bigintToNumber = (value) =>
  typeof value === "bigint" ? Number(value) : Number(value || 0);

function formatRace(raw) {
  return {
    raceId: Number(raw[0]),
    participantTokenIds: raw[1].map((id) => Number(id)),
    botTokenIds: raw[2].map((id) => Number(id)),
    totalLaps: Number(raw[3]),
    startTime: Number(raw[4]),
    endTime: Number(raw[5]),
    isActive: Boolean(raw[6]),
    isFinished: Boolean(raw[7]),
    winnerTokenId: Number(raw[8]),
    totalDistance: Number(raw[9]),
    updatedAt: Date.now(),
  };
}

function formatTelemetrySnapshot(raw) {
  return {
    timestamp: Number(raw.timestamp),
    positionX: raw.positionX.toString(),
    positionY: raw.positionY.toString(),
    speed: Number(raw.speed),
    currentLap: Number(raw.currentLap),
    lapProgress: Number(raw.lapProgress),
    acceleration: Number(raw.acceleration),
    isBot: Boolean(raw.isBot),
  };
}

function formatBettingPool(raw, participantTokenIds = []) {
  const [totalPool, isSettled, tokenIds, betAmounts] = raw;
  const betsByToken =
    tokenIds && tokenIds.length
      ? tokenIds.reduce((acc, tokenId, idx) => {
          acc[Number(tokenId)] = betAmounts[idx].toString();
          return acc;
        }, {})
      : participantTokenIds.reduce((acc, tokenId) => {
          acc[tokenId] = "0";
          return acc;
        }, {});

  return {
    totalPool: totalPool.toString(),
    isSettled: Boolean(isSettled),
    tokenBets: betsByToken,
    updatedAt: Date.now(),
  };
}

async function refreshRaceFromChain(raceId) {
  try {
    const raw = await contract.getRace(raceId);
    const formatted = formatRace(raw);
    races.set(formatted.raceId, formatted);
    return formatted;
  } catch (error) {
    console.error(`Failed to fetch race ${raceId} from contract`, error);
    throw error;
  }
}

async function refreshBettingPoolFromChain(raceId) {
  try {
    const race =
      races.get(Number(raceId)) || (await refreshRaceFromChain(raceId));
    const raw = await contract.getBettingPool(raceId);
    const formatted = formatBettingPool(raw, race.participantTokenIds);
    bettingPools.set(Number(raceId), { raceId: Number(raceId), ...formatted });
    recordOddsSnapshot(Number(raceId));
    return bettingPools.get(Number(raceId));
  } catch (error) {
    console.error(`Failed to fetch betting pool for race ${raceId}`, error);
    throw error;
  }
}

async function syncExistingRaces() {
  try {
    const fromBlock = Number(RACING_FROM_BLOCK);
    const latestBlock = await provider.getBlockNumber();
    console.log(`🔍 Syncing races from block ${fromBlock} to ${latestBlock}`);

    const events = await contract.queryFilter(
      contract.filters.RaceCreated(),
      fromBlock,
      latestBlock
    );

    console.log(`📦 Found ${events.length} RaceCreated events`);

    for (const evt of events) {
      const raceId = Number(evt.args?.raceId);
      console.log(`  - Syncing race ${raceId}`);
      await refreshRaceFromChain(raceId);
    }

    console.log(`✅ Synced ${races.size} races total`);
  } catch (error) {
    console.error("❌ Error syncing existing races:", error);
    throw error;
  }
}

function subscribeToEvents() {
  contract.on("RaceCreated", async (raceId) => {
    const race = await refreshRaceFromChain(Number(raceId));
    eventBus.emit("raceCreated", race);
  });

  contract.on("RaceFinished", async (raceId, winnerTokenId) => {
    const id = Number(raceId);
    const race = races.get(id) || (await refreshRaceFromChain(id));
    const updatedRace = {
      ...race,
      isFinished: true,
      isActive: false,
      winnerTokenId: Number(winnerTokenId),
      endTime: Date.now(),
    };
    races.set(id, updatedRace);
    eventBus.emit("raceFinished", updatedRace);
  });

  contract.on("BetPlaced", async (raceId) => {
    const pool = await refreshBettingPoolFromChain(Number(raceId));
    eventBus.emit("bettingUpdated", pool);
  });

  contract.on("BettingPoolSettled", async (raceId) => {
    const pool = await refreshBettingPoolFromChain(Number(raceId));
    eventBus.emit("bettingSettled", pool);
  });
}

async function init() {
  if (initialized) return;
  await syncExistingRaces();
  subscribeToEvents();
  initialized = true;
}

function getRacesSnapshot() {
  return Array.from(races.values()).sort((a, b) => b.startTime - a.startTime);
}

async function getRaceById(raceId) {
  const id = Number(raceId);
  if (races.has(id)) {
    return races.get(id);
  }
  return refreshRaceFromChain(id);
}

async function getTelemetrySnapshots(raceId, tokenId, limit = 50) {
  const rawSnapshots = await contract.getTelemetrySnapshots(
    raceId,
    tokenId,
    limit
  );
  return rawSnapshots.map(formatTelemetrySnapshot);
}

async function getBettingPool(raceId) {
  const id = Number(raceId);
  if (bettingPools.has(id)) {
    return bettingPools.get(id);
  }
  return refreshBettingPoolFromChain(id);
}

async function getOdds(raceId, tokenId) {
  const odds = await contract.getOdds(raceId, tokenId);
  return Number(odds);
}

async function getDashboardSnapshot() {
  const snapshot = getRacesSnapshot();
  const enriched = await Promise.all(
    snapshot.map(async (race) => {
      let pool = bettingPools.get(race.raceId);
      if (!pool) {
        try {
          pool = await refreshBettingPoolFromChain(race.raceId);
        } catch (error) {
          pool = null;
        }
      }

      return {
        ...race,
        bettingPool: pool || null,
      };
    })
  );

  return {
    timestamp: Date.now(),
    totalRaces: enriched.length,
    activeRaces: enriched.filter((race) => race.isActive).length,
    finishedRaces: enriched.filter((race) => race.isFinished).length,
    races: enriched,
  };
}

function computeMarketForRace(race, bettingPool) {
  const totalPool = parseFloat(bettingPool?.totalPool || "0");
  const markets = race.participantTokenIds.map((tokenId) => {
    const tokenTotal = parseFloat(bettingPool?.tokenBets?.[tokenId] || "0");
    const impliedProbability =
      totalPool > 0 ? (tokenTotal / totalPool) * 100 : 100;
    return {
      tokenId,
      isBot: race.botTokenIds.includes(tokenId),
      betTotalWei: bettingPool?.tokenBets?.[tokenId] || "0",
      impliedProbability,
    };
  });

  return {
    raceId: race.raceId,
    startTime: race.startTime,
    endTime: race.endTime,
    isActive: race.isActive,
    isFinished: race.isFinished,
    totalLaps: race.totalLaps,
    totalPoolWei: bettingPool?.totalPool || "0",
    markets,
  };
}

async function getMarkets() {
  const snapshot = getRacesSnapshot();
  console.log(`📊 getMarkets: Found ${snapshot.length} races in snapshot`);

  if (snapshot.length === 0) {
    console.log("⚠️  No races found. Races need to be created on-chain first.");
    return [];
  }

  const markets = await Promise.all(
    snapshot.map(async (race) => {
      try {
        const pool = await getBettingPool(race.raceId).catch(() => null);
        return computeMarketForRace(race, pool);
      } catch (error) {
        console.error(`Error computing market for race ${race.raceId}:`, error);
        return computeMarketForRace(race, null);
      }
    })
  );
  return markets;
}

async function getMarketByRaceId(raceId) {
  const race = await getRaceById(raceId);
  if (!race) return null;
  const pool = await getBettingPool(raceId).catch(() => null);
  return computeMarketForRace(race, pool);
}

function recordOddsSnapshot(raceId) {
  const race = races.get(raceId);
  const pool = bettingPools.get(raceId);
  if (!race || !pool) return;

  const snapshot = computeMarketForRace(race, pool);
  const entry = {
    timestamp: Date.now(),
    markets: snapshot.markets,
    totalPoolWei: snapshot.totalPoolWei,
  };

  const history = oddsHistory.get(raceId) || [];
  history.push(entry);
  if (history.length > 500) {
    history.shift();
  }
  oddsHistory.set(raceId, history);
}

function getOddsHistory(raceId, limit = 200) {
  const history = oddsHistory.get(Number(raceId)) || [];
  if (history.length <= limit) {
    return history;
  }
  return history.slice(history.length - limit);
}

/**
 * Update telemetry on-chain
 * @param {number} raceId
 * @param {number} tokenId
 * @param {object} telemetryData - { positionX, positionY, speed, currentLap, lapProgress, acceleration }
 */
async function updateTelemetry(raceId, tokenId, telemetryData) {
  if (!contractWithSigner) {
    throw new Error(
      "Contract signer not initialized. Set RACING_PRIVATE_KEY in .env"
    );
  }

  const {
    positionX = 0,
    positionY = 0,
    speed = 0,
    currentLap = 0,
    lapProgress = 0,
    acceleration = 0,
  } = telemetryData;

  // Clamp and validate values before scaling
  // Clamp acceleration to reasonable range (-10 to 10 m/s²) before scaling
  // Ensure it's a valid number
  const safeAccel =
    isNaN(acceleration) || !isFinite(acceleration) ? 0 : acceleration;
  const clampedAccel = Math.max(-10, Math.min(10, safeAccel));

  // Scale positions (contract expects int256, scale by 1000 for precision)
  const scaledX = Math.round(
    Math.max(-1000000, Math.min(1000000, positionX)) * 1000
  );
  const scaledY = Math.round(
    Math.max(-1000000, Math.min(1000000, positionY)) * 1000
  );
  const scaledAccel = Math.round(clampedAccel * 1000);

  // Contract expects uint256 (unsigned), so we need to convert negative to positive
  // Use offset: add 100000 so -100000 becomes 0, 0 becomes 100000, +100000 becomes 200000
  // This allows representing -100 to +100 m/s² range (after scaling: -100000 to +100000)
  const ACCEL_OFFSET = 100000; // Offset to make negative values positive
  const finalScaledAccel = Math.max(
    0,
    Math.min(200000, scaledAccel + ACCEL_OFFSET)
  );

  // Debug logging (remove in production)
  if (
    scaledAccel < 0 ||
    scaledAccel > 100000 ||
    finalScaledAccel < 0 ||
    finalScaledAccel > 200000
  ) {
    console.warn(
      `[Telemetry Debug] accel: ${acceleration}, clamped: ${clampedAccel}, scaled: ${scaledAccel}, final: ${finalScaledAccel}`
    );
  }

  // Validate other values
  const clampedSpeed = Math.max(0, Math.min(500, Math.round(speed))); // 0-500 km/h
  const clampedLap = Math.max(0, Math.min(100, currentLap));
  const clampedLapProgress = Math.max(
    0,
    Math.min(100, Math.round(lapProgress))
  );

  // Final validation - ensure all values are within uint256 bounds
  if (finalScaledAccel < 0 || finalScaledAccel > 200000) {
    console.error(
      `[Telemetry] Invalid finalScaledAccel: ${finalScaledAccel} (from accel: ${acceleration}, scaled: ${scaledAccel})`
    );
    return { success: false, error: "Acceleration out of bounds" };
  }

  try {
    const tx = await contractWithSigner.updateTelemetry(
      raceId,
      tokenId,
      scaledX,
      scaledY,
      clampedSpeed, // km/h
      clampedLap,
      clampedLapProgress, // 0-100
      finalScaledAccel
    );

    // Don't wait for confirmation to avoid blocking
    tx.wait().catch((err) => {
      console.error("Telemetry update transaction failed:", err);
    });

    return { success: true, txHash: tx.hash };
  } catch (error) {
    // Log error but don't throw - telemetry updates are best-effort
    // This prevents race crashes from telemetry issues
    if (error.code === "INVALID_ARGUMENT" || error.code === "CALL_EXCEPTION") {
      console.warn(
        `Failed to update telemetry on-chain (raceId: ${raceId}, tokenId: ${tokenId}):`,
        error.message
      );
    } else {
      console.error("Failed to update telemetry on-chain:", error);
    }
    // Return success: false but don't throw to avoid breaking the race
    return { success: false, error: error.message };
  }
}

module.exports = {
  init,
  events: eventBus,
  getRacesSnapshot,
  getRaceById,
  getTelemetrySnapshots,
  getBettingPool,
  getDashboardSnapshot,
  getOdds,
  getMarkets,
  getMarketByRaceId,
  getOddsHistory,
  updateTelemetry,
};
