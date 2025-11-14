import { network } from "hardhat";

async function main() {
  console.log("🚀 Starting RealtimeRacingEngine deployment...\n");

  // Connect to network
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Deploying contracts with account:", deployer.account.address);
  
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log("Account balance:", balance.toString(), "\n");

  // Get existing RacerNFT address (you'll need to provide this)
  // For now, we'll deploy a new one if needed
  const RACER_NFT_ADDRESS = process.env.RACER_NFT_ADDRESS || "";

  if (!RACER_NFT_ADDRESS) {
    console.log("⚠️  RACER_NFT_ADDRESS not set. Deploying RacerNFT first...");
    const racerNFT = await viem.deployContract("RacerNFT");
    const racerNFTAddress = racerNFT.address;
    console.log("✅ RacerNFT deployed to:", racerNFTAddress, "\n");
    
    // Deploy RealtimeRacingEngine
    console.log("📦 Deploying RealtimeRacingEngine...");
    const racingEngine = await viem.deployContract("RealtimeRacingEngine", [
      racerNFTAddress,
    ]);
    const racingEngineAddress = racingEngine.address;
    console.log("✅ RealtimeRacingEngine deployed to:", racingEngineAddress, "\n");

    // Summary
    console.log("🎉 DEPLOYMENT COMPLETE!\n");
    console.log("Contract Addresses:");
    console.log("===================");
    console.log("RacerNFT:", racerNFTAddress);
    console.log("RealtimeRacingEngine:", racingEngineAddress);
    console.log("\n💾 Save these addresses - you'll need them for the backend!");
  } else {
    console.log("📦 Using existing RacerNFT at:", RACER_NFT_ADDRESS);
    
    // Deploy RealtimeRacingEngine
    console.log("📦 Deploying RealtimeRacingEngine...");
    const racingEngine = await viem.deployContract("RealtimeRacingEngine", [
      RACER_NFT_ADDRESS,
    ]);
    const racingEngineAddress = racingEngine.address;
    console.log("✅ RealtimeRacingEngine deployed to:", racingEngineAddress, "\n");

    // Summary
    console.log("🎉 DEPLOYMENT COMPLETE!\n");
    console.log("Contract Addresses:");
    console.log("===================");
    console.log("RacerNFT:", RACER_NFT_ADDRESS);
    console.log("RealtimeRacingEngine:", racingEngineAddress);
    console.log("\n💾 Save these addresses - you'll need them for the backend!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

