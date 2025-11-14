import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // Local Hardhat network - best for development
    // Uses default Hardhat network (no network flag needed)
    localhost: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      // Reliable public RPC - no authentication needed
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
      chainId: 11155111,
    },
    polygonAmoy: {
      type: "http",
      chainType: "l1",
      // Free public RPC - no authentication needed
      url: "https://rpc-amoy.polygon.technology",
      accounts: [configVariable("POLYGON_PRIVATE_KEY")],
      chainId: 80002,
    },
  },
});
