import { ethers } from "ethers";

// Contract ABIs (you'll need to update these with actual ABIs after deployment)
// For now, using minimal ABIs for the functions we need

const RACER_NFT_ABI = [
  "function racerStats(uint256) public view returns (uint256 speed, uint256 handling, uint256 acceleration, uint256 totalRaces, uint256 wins, uint256 crashes, uint256 currentPrice, bool isRacing, uint256 lastRaceTime)",
  "function getRaceData(uint256) external view returns (uint256 currentSpeed, uint256 currentLap, uint256 position, uint256 lapProgress, uint256 raceStartTime, bool isActive)",
  "function totalSupply() external view returns (uint256)",
  "function ownerOf(uint256) public view returns (address)",
  "function getRacersByOwner(address) external view returns (uint256[] memory)",
  "function getRacer(uint256) external view returns (tuple(uint256 speed, uint256 handling, uint256 acceleration, uint256 totalRaces, uint256 wins, uint256 crashes, uint256 currentPrice, bool isRacing, uint256 lastRaceTime))",
  "event RaceDataUpdated(uint256 indexed tokenId, uint256 currentSpeed, uint256 currentLap, uint256 position, uint256 lapProgress)",
];

// RealtimeRacingEngine ABI - betting functions
const REALTIME_RACING_ENGINE_ABI = [
  "function getRace(uint256 raceId) external view returns (uint256 raceId_, uint256[] memory participantTokenIds, uint256[] memory botTokenIds, uint256 totalLaps, uint256 startTime, uint256 endTime, bool isActive, bool isFinished, uint256 winnerTokenId, uint256 totalDistance)",
  "function getOdds(uint256 raceId, uint256 tokenId) external view returns (uint256)",
  "function getBettingPool(uint256 raceId) external view returns (uint256 totalPool, bool isSettled, uint256[] memory tokenIds, uint256[] memory betAmounts)",
  "function getUserBets(uint256 raceId, address user) external view returns (tuple(address bettor, uint256 tokenId, uint256 amount, uint256 timestamp, bool claimed)[] memory)",
  "function placeBet(uint256 raceId, uint256 tokenId) external payable",
  "function claimWinnings(uint256 raceId) external",
  "event BetPlaced(uint256 indexed raceId, address indexed bettor, uint256 indexed tokenId, uint256 amount)",
  "event BettingPoolSettled(uint256 indexed raceId, uint256 indexed winnerTokenId, uint256 totalPayout)",
];

// Contract addresses (update these after deployment)
// These should be set via environment variables or config
export const CONTRACT_ADDRESSES = {
  RACER_NFT: process.env.REACT_APP_RACER_NFT_ADDRESS || "",
  RACING_ENGINE:
    process.env.REACT_APP_RACING_ENGINE_ADDRESS ||
    process.env.REACT_APP_TRADING_ENGINE_ADDRESS ||
    "",
};

// Get contract instances
export function getRacerNFTContract(provider) {
  if (!CONTRACT_ADDRESSES.RACER_NFT) {
    throw new Error("RacerNFT contract address not set");
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.RACER_NFT,
    RACER_NFT_ABI,
    provider
  );
}

export function getTradingEngineContract(provider) {
  // Use RealtimeRacingEngine address (backward compatible with TRADING_ENGINE_ADDRESS)
  if (!CONTRACT_ADDRESSES.RACING_ENGINE) {
    throw new Error(
      "RacingEngine contract address not set. Please set REACT_APP_RACING_ENGINE_ADDRESS"
    );
  }
  return new ethers.Contract(
    CONTRACT_ADDRESSES.RACING_ENGINE,
    REALTIME_RACING_ENGINE_ABI,
    provider
  );
}

// Contract interaction functions
export async function getRacerStats(contract, tokenId) {
  try {
    const stats = await contract.racerStats(tokenId);
    return {
      speed: Number(stats[0]),
      handling: Number(stats[1]),
      acceleration: Number(stats[2]),
      totalRaces: Number(stats[3]),
      wins: Number(stats[4]),
      crashes: Number(stats[5]),
      currentPrice: stats[6].toString(),
      isRacing: stats[7],
      lastRaceTime: Number(stats[8]),
    };
  } catch (error) {
    console.error("Error fetching racer stats:", error);
    return null;
  }
}

export async function getRaceData(contract, tokenId) {
  try {
    const data = await contract.getRaceData(tokenId);
    return {
      currentSpeed: Number(data[0]),
      currentLap: Number(data[1]),
      position: Number(data[2]),
      lapProgress: Number(data[3]),
      raceStartTime: Number(data[4]),
      isActive: data[5],
    };
  } catch (error) {
    console.error("Error fetching race data:", error);
    return null;
  }
}

export async function getRacePool(contract, raceId) {
  try {
    // RealtimeRacingEngine uses getBettingPool which returns different structure
    // But we can also use getRace for race details
    const pool = await contract.getBettingPool(raceId);
    const race = await contract.getRace(raceId);
    return {
      raceId: Number(raceId),
      participatingTokenIds: race[1].map((id) => Number(id)), // participantTokenIds from getRace
      totalPool: pool[0].toString(), // totalPool from getBettingPool
      startTime: Number(race[4]), // startTime from getRace
      endTime: Number(race[5]), // endTime from getRace
      isActive: race[6], // isActive from getRace
      isSettled: pool[1], // isSettled from getBettingPool
      winnerTokenId: Number(race[8]), // winnerTokenId from getRace
    };
  } catch (error) {
    console.error("Error fetching race pool:", error);
    return null;
  }
}

export async function getOdds(contract, raceId, tokenId) {
  try {
    const odds = await contract.getOdds(raceId, tokenId);
    return Number(odds);
  } catch (error) {
    console.error("Error fetching odds:", error);
    return 0;
  }
}

export async function placeBet(contract, signer, raceId, tokenId, amount) {
  try {
    const tx = await contract.connect(signer).placeBet(raceId, tokenId, {
      value: ethers.parseEther(amount.toString()),
    });
    await tx.wait();
    return tx;
  } catch (error) {
    console.error("Error placing bet:", error);
    throw error;
  }
}

export async function getUserBets(contract, raceId, userAddress) {
  try {
    const bets = await contract.getUserBets(raceId, userAddress);
    return bets.map((bet) => ({
      bettor: bet[0],
      tokenId: Number(bet[1]),
      amount: bet[2].toString(),
      timestamp: Number(bet[3]),
      claimed: bet[4],
    }));
  } catch (error) {
    console.error("Error fetching user bets:", error);
    return [];
  }
}

export async function getTotalSupply(contract) {
  try {
    const supply = await contract.totalSupply();
    return Number(supply);
  } catch (error) {
    console.error("Error fetching total supply:", error);
    return 0;
  }
}
