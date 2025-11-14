// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ============================================
// CONTRACT 1: DYNAMIC RACER NFT
// ============================================

contract RacerNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    struct RacerStats {
        uint256 speed; // 0-100 (base stat from car config)
        uint256 handling; // 0-100 (base stat from car config)
        uint256 acceleration; // 0-100 (base stat from car config)
        uint256 totalRaces;
        uint256 wins;
        uint256 crashes;
        uint256 currentPrice; // in wei
        bool isRacing;
        uint256 lastRaceTime;
    }

    // Real-time race data (updated during active race)
    struct RaceData {
        uint256 currentSpeed; // Real-time speed in km/h (0-400)
        uint256 currentLap; // Current lap number
        uint256 position; // Current position in race (1 = first)
        uint256 lapProgress; // Progress in current lap (0-100)
        uint256 raceStartTime;
        bool isActive;
    }

    mapping(uint256 => RaceData) public raceData;

    mapping(uint256 => RacerStats) public racerStats;

    event RacerMinted(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 initialPrice
    );
    event StatsUpdated(
        uint256 indexed tokenId,
        uint256 totalRaces,
        uint256 wins,
        uint256 crashes
    );
    event PriceUpdated(
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice
    );
    event RacingStatusChanged(uint256 indexed tokenId, bool isRacing);
    event RaceDataUpdated(
        uint256 indexed tokenId,
        uint256 currentSpeed,
        uint256 currentLap,
        uint256 position,
        uint256 lapProgress
    );

    constructor() ERC721("TurboTradeX Racer", "RACE") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }

    // Mint new racer NFT
    function mintRacer(
        string memory tokenURI,
        uint256 speed,
        uint256 handling,
        uint256 acceleration,
        uint256 initialPrice
    ) public payable returns (uint256) {
        require(msg.value >= 0.001 ether, "Minimum 0.001 ETH required to mint");
        require(
            speed <= 100 && handling <= 100 && acceleration <= 100,
            "Stats must be 0-100"
        );
        require(initialPrice > 0, "Initial price must be greater than 0");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        racerStats[newTokenId] = RacerStats({
            speed: speed,
            handling: handling,
            acceleration: acceleration,
            totalRaces: 0,
            wins: 0,
            crashes: 0,
            currentPrice: initialPrice,
            isRacing: false,
            lastRaceTime: 0
        });

        emit RacerMinted(newTokenId, msg.sender, initialPrice);
        return newTokenId;
    }

    // Update stats after race (only owner/backend can call)
    function updateRaceStats(
        uint256 tokenId,
        bool won,
        bool crashed
    ) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");

        RacerStats storage stats = racerStats[tokenId];
        stats.totalRaces++;
        if (won) stats.wins++;
        if (crashed) stats.crashes++;
        stats.lastRaceTime = block.timestamp;

        emit StatsUpdated(tokenId, stats.totalRaces, stats.wins, stats.crashes);
    }

    // Update dynamic price (only owner/backend can call)
    function updatePrice(uint256 tokenId, uint256 newPrice) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");
        require(newPrice > 0, "Price must be greater than 0");

        uint256 oldPrice = racerStats[tokenId].currentPrice;
        racerStats[tokenId].currentPrice = newPrice;

        emit PriceUpdated(tokenId, oldPrice, newPrice);
    }

    // Set racing status (prevent trading while racing)
    function setRacingStatus(uint256 tokenId, bool racing) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");
        racerStats[tokenId].isRacing = racing;
        emit RacingStatusChanged(tokenId, racing);
    }

    // Batch update racing status for multiple racers
    function batchSetRacingStatus(
        uint256[] memory tokenIds,
        bool racing
    ) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (_ownerOf(tokenIds[i]) != address(0)) {
                racerStats[tokenIds[i]].isRacing = racing;
                emit RacingStatusChanged(tokenIds[i], racing);
            }
        }
    }

    // Get racer details
    function getRacer(
        uint256 tokenId
    ) external view returns (RacerStats memory) {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");
        return racerStats[tokenId];
    }

    // Get all racers owned by an address
    function getRacersByOwner(
        address owner
    ) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory ownedTokenIds = new uint256[](balance);
        uint256 index = 0;

        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            if (_ownerOf(i) == owner) {
                ownedTokenIds[index] = i;
                index++;
            }
        }

        return ownedTokenIds;
    }

    // Update real-time race data (only owner/backend can call during race)
    function updateRaceData(
        uint256 tokenId,
        uint256 currentSpeed,
        uint256 currentLap,
        uint256 position,
        uint256 lapProgress
    ) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");
        require(currentSpeed <= 400, "Speed must be 0-400 km/h");
        require(lapProgress <= 100, "Lap progress must be 0-100");

        raceData[tokenId] = RaceData({
            currentSpeed: currentSpeed,
            currentLap: currentLap,
            position: position,
            lapProgress: lapProgress,
            raceStartTime: raceData[tokenId].raceStartTime == 0
                ? block.timestamp
                : raceData[tokenId].raceStartTime,
            isActive: true
        });

        emit RaceDataUpdated(
            tokenId,
            currentSpeed,
            currentLap,
            position,
            lapProgress
        );
    }

    // Start race (initialize race data)
    function startRace(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");
        raceData[tokenId].raceStartTime = block.timestamp;
        raceData[tokenId].isActive = true;
        racerStats[tokenId].isRacing = true;
        emit RacingStatusChanged(tokenId, true);
    }

    // End race (clear race data)
    function endRace(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");
        raceData[tokenId].isActive = false;
        racerStats[tokenId].isRacing = false;
        emit RacingStatusChanged(tokenId, false);
    }

    // Get race data for a racer
    function getRaceData(
        uint256 tokenId
    ) external view returns (RaceData memory) {
        require(_ownerOf(tokenId) != address(0), "Racer does not exist");
        return raceData[tokenId];
    }

    // Get total supply
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // Withdraw contract balance
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // Override to prevent transfers while racing
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        require(
            !racerStats[tokenId].isRacing,
            "Cannot transfer racer while racing"
        );
        return super._update(to, tokenId, auth);
    }
}
