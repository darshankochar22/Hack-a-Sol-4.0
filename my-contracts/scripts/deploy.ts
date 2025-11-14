import { network } from "hardhat";

async function main() {
  console.log("🚀 Starting deployment...\n");

  // Connect to network
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Deploying contracts with account:", deployer.account.address);
  
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log("Account balance:", balance.toString(), "\n");

  // Deploy RacerNFT
  console.log("📦 Deploying RacerNFT...");
  const racerNFT = await viem.deployContract("RacerNFT");
  const racerNFTAddress = racerNFT.address;
  console.log("✅ RacerNFT deployed to:", racerNFTAddress, "\n");

  // Deploy TradingEngine
  console.log("📦 Deploying TradingEngine...");
  const tradingEngine = await viem.deployContract("TradingEngine", [
    racerNFTAddress,
  ]);
  const tradingEngineAddress = tradingEngine.address;
  console.log("✅ TradingEngine deployed to:", tradingEngineAddress, "\n");

  // Summary
  console.log("🎉 DEPLOYMENT COMPLETE!\n");
  console.log("Contract Addresses:");
  console.log("===================");
  console.log("RacerNFT:", racerNFTAddress);
  console.log("TradingEngine:", tradingEngineAddress);
  console.log("\n💾 Save these addresses - you'll need them for the backend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

