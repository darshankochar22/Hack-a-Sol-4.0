/**
 * Script to create a test race on-chain
 * Usage: node scripts/create-test-race.js
 */

require("dotenv").config();
const { ethers } = require("ethers");
const path = require("path");

const {
  RACING_RPC_URL = "http://127.0.0.1:8545",
  RACING_ENGINE_ADDRESS,
  RACING_PRIVATE_KEY,
} = process.env;

if (!RACING_ENGINE_ADDRESS || !RACING_PRIVATE_KEY) {
  console.error(
    "❌ Missing RACING_ENGINE_ADDRESS or RACING_PRIVATE_KEY in .env"
  );
  process.exit(1);
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

async function main() {
  console.log("🚀 Creating test race...\n");

  const provider = new ethers.JsonRpcProvider(RACING_RPC_URL);
  const wallet = new ethers.Wallet(RACING_PRIVATE_KEY, provider);
  const artifact = require(ABI_PATH);
  const contract = new ethers.Contract(
    RACING_ENGINE_ADDRESS,
    artifact.abi,
    wallet
  );

  console.log("📝 Contract:", RACING_ENGINE_ADDRESS);
  console.log("👤 Signer:", wallet.address);
  console.log("");

  // First, create some bots if they don't exist
  console.log("🤖 Creating test bots...");
  const botTokenIds = [];

  try {
    // Create 3 bots using createBotsBatch
    const aggressiveness = [50, 60, 70];
    const consistency = [50, 55, 60];

    try {
      // First check for existing active bots
      console.log("  🔍 Checking for existing bots...");
      for (let id = 10001; id <= 10020; id++) {
        try {
          const config = await contract.getBotConfig(id);
          if (config.isActive) {
            botTokenIds.push(id);
            console.log(`  ✅ Found existing bot ${id}`);
          }
        } catch {
          // Bot doesn't exist, continue
        }
      }

      // If we don't have enough bots, create new ones
      if (botTokenIds.length < 3) {
        console.log(`  📝 Creating ${3 - botTokenIds.length} new bots...`);
        const tx = await contract.createBotsBatch(aggressiveness, consistency);
        console.log("  ⏳ Waiting for bot creation transaction...");
        const receipt = await tx.wait();
        console.log("  ✅ Bots created:", receipt.hash);

        // Find the newly created bots by checking all IDs again
        for (let id = 10001; id <= 10020; id++) {
          try {
            const config = await contract.getBotConfig(id);
            if (config.isActive && !botTokenIds.includes(id)) {
              botTokenIds.push(id);
              console.log(`  ✅ Found new bot ${id}`);
            }
          } catch {
            // Bot doesn't exist, continue
          }
        }
      }

      console.log(
        `  ✅ Total bots available: ${botTokenIds.length} (${botTokenIds.join(
          ", "
        )})`
      );
    } catch (error) {
      console.error("  ❌ Error creating bots:", error.message);
      // Try individual bot creation
      console.log("  🔄 Trying individual bot creation...");
      for (let i = 0; i < 3; i++) {
        try {
          const tx = await contract.createBot(
            aggressiveness[i],
            consistency[i]
          );
          await tx.wait();
          // Bot IDs start from 1, so we'll try to get them
          // Since we can't access counter, we'll try IDs 1, 2, 3
          botTokenIds.push(i + 1);
          console.log(`  ✅ Created bot ${i + 1}`);
        } catch (err) {
          console.log(`  ⚠️  Bot ${i + 1} might exist, checking...`);
          // Check if bot exists
          try {
            const config = await contract.getBotConfig(i + 1);
            if (config.isActive) {
              botTokenIds.push(i + 1);
              console.log(`  ✅ Using existing bot ${i + 1}`);
            }
          } catch {
            // Bot doesn't exist, skip
          }
        }
      }

      if (botTokenIds.length < 2) {
        throw new Error(
          `Need at least 2 bots, only found ${botTokenIds.length}`
        );
      }
    }
    console.log(`  📋 Using bots: ${botTokenIds.join(", ")}`);
    console.log("");

    // Verify bots are active
    console.log("🔍 Verifying bots are active...");
    for (const botId of botTokenIds.slice(0, 3)) {
      try {
        const botConfig = await contract.getBotConfig(botId);
        console.log(
          `  Bot ${botId}: active=${botConfig.isActive}, agg=${botConfig.aggressiveness}, cons=${botConfig.consistency}`
        );
        if (!botConfig.isActive) {
          throw new Error(`Bot ${botId} is not active`);
        }
      } catch (error) {
        console.error(`  ❌ Error checking bot ${botId}:`, error.message);
        throw error;
      }
    }
    console.log("");

    // Create a race with bots only (no player tokens needed for testing)
    console.log("🏁 Creating race with bots...");
    const playerTokenIds = []; // Empty - just bots racing
    const totalLaps = 10;
    const totalDistance = 5000; // 5km track
    const raceBotIds = botTokenIds.slice(0, 3);

    console.log(`  Player tokens: ${playerTokenIds.length}`);
    console.log(
      `  Bot tokens: ${raceBotIds.length} (${raceBotIds.join(", ")})`
    );
    console.log(`  Total laps: ${totalLaps}`);
    console.log(`  Distance: ${totalDistance}m`);

    const tx = await contract.createRace(
      playerTokenIds,
      raceBotIds,
      totalLaps,
      totalDistance
    );

    console.log("⏳ Waiting for transaction...");
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.hash);

    // Get the race ID from events
    const raceCreatedEvent = receipt.logs.find((log) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === "RaceCreated";
      } catch {
        return false;
      }
    });

    if (raceCreatedEvent) {
      const parsed = contract.interface.parseLog(raceCreatedEvent);
      const raceId = Number(parsed.args.raceId);
      console.log("\n🎉 Race created successfully!");
      console.log("   Race ID:", raceId);
      console.log(
        "   Participants:",
        parsed.args.participantTokenIds.map((id) => Number(id))
      );
      console.log(
        "   Bots:",
        parsed.args.botTokenIds.map((id) => Number(id))
      );
      console.log("   Total Laps:", Number(parsed.args.totalLaps));
    } else {
      console.log("\n⚠️  Race created but couldn't parse event");
    }
  } catch (error) {
    console.error("❌ Error creating race:", error);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
