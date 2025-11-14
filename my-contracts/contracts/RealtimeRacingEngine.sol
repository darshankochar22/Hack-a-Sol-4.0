// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RaceNFT.sol";

/**
 * @title RealtimeRacingEngine
 * @notice On-chain racing engine with AI bots, real-time telemetry tracking, and betting
 */
contract RealtimeRacingEngine is Ownable, ReentrancyGuard {
    RacerNFT public racerNFT;

    // ========== STRUCTS ==========

    struct BotConfig {
        uint256 tokenId;
        uint256 aggressiveness; // 0-100 (affects speed/risk)
        uint256 consistency; // 0-100 (affects lap time variance)
        bool isActive;
    }

    struct TelemetrySnapshot {
        uint256 timestamp;
        int256 positionX; // Track position (scaled for gas efficiency)
        int256 positionY;
        uint256 speed; // Speed in km/h (0-400)
        uint256 currentLap;
        uint256 lapProgress; // 0-100
        uint256 acceleration; // Scaled acceleration
        bool isBot; // True if this is an AI bot
    }

    struct Race {
        uint256 raceId;
        uint256[] participantTokenIds; // All cars (players + bots)
        uint256[] botTokenIds; // Only AI bots
        uint256 totalLaps;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isFinished;
        uint256 winnerTokenId;
        uint256 totalDistance; // Track length in meters
    }

    struct RaceTelemetry {
        uint256 raceId;
        mapping(uint256 => TelemetrySnapshot[]) snapshots; // tokenId => telemetry history
        mapping(uint256 => uint256) lastSnapshotIndex; // tokenId => last snapshot index
        uint256 snapshotCount; // Total snapshots across all cars
    }

    struct Bet {
        address bettor;
        uint256 tokenId;
        uint256 amount;
        uint256 timestamp;
        bool claimed;
    }

    struct BettingPool {
        uint256 raceId;
        uint256 totalPool;
        mapping(uint256 => uint256) tokenBets; // tokenId => total bet amount
        mapping(address => Bet[]) userBets; // user => their bets
        bool isSettled;
    }

    // ========== STATE VARIABLES ==========

    mapping(uint256 => Race) public races;
    mapping(uint256 => RaceTelemetry) public raceTelemetry;
    mapping(uint256 => BotConfig) public botConfigs; // tokenId => bot config
    mapping(uint256 => BettingPool) public bettingPools; // raceId => betting pool

    uint256 private _raceIdCounter;
    uint256 private _botTokenIdCounter = 10000; // Start bot IDs at 10000 to avoid conflicts

    // Platform fee: 2.5% (250 basis points)
    uint256 public platformFeePercent = 250;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // Minimum bet amount
    uint256 public constant MIN_BET = 0.001 ether;

    // Maximum telemetry snapshots per car per race (to prevent gas issues)
    uint256 public constant MAX_SNAPSHOTS_PER_CAR = 500;

    // ========== EVENTS ==========

    event RaceCreated(
        uint256 indexed raceId,
        uint256[] participantTokenIds,
        uint256[] botTokenIds,
        uint256 totalLaps,
        uint256 startTime
    );

    event BotCreated(
        uint256 indexed tokenId,
        uint256 aggressiveness,
        uint256 consistency
    );

    event TelemetryUpdated(
        uint256 indexed raceId,
        uint256 indexed tokenId,
        uint256 speed,
        uint256 currentLap,
        uint256 timestamp
    );

    event RaceFinished(
        uint256 indexed raceId,
        uint256 indexed winnerTokenId,
        uint256 finishTime
    );

    event BetPlaced(
        uint256 indexed raceId,
        address indexed bettor,
        uint256 indexed tokenId,
        uint256 amount
    );

    event BettingPoolSettled(
        uint256 indexed raceId,
        uint256 indexed winnerTokenId,
        uint256 totalPayout
    );

    event WinningsClaimed(
        uint256 indexed raceId,
        address indexed bettor,
        uint256 amount
    );

    // ========== CONSTRUCTOR ==========

    constructor(address _racerNFTAddress) Ownable(msg.sender) {
        require(_racerNFTAddress != address(0), "Invalid NFT contract address");
        racerNFT = RacerNFT(_racerNFTAddress);
    }

    // ========== BOT MANAGEMENT ==========

    /**
     * @notice Create an AI bot racer
     * @param aggressiveness 0-100 (higher = faster but riskier)
     * @param consistency 0-100 (higher = more consistent lap times)
     * @return botTokenId The token ID assigned to the bot
     */
    function createBot(
        uint256 aggressiveness,
        uint256 consistency
    ) external onlyOwner returns (uint256) {
        require(aggressiveness <= 100, "Aggressiveness must be 0-100");
        require(consistency <= 100, "Consistency must be 0-100");

        _botTokenIdCounter++;
        uint256 botTokenId = _botTokenIdCounter;

        botConfigs[botTokenId] = BotConfig({
            tokenId: botTokenId,
            aggressiveness: aggressiveness,
            consistency: consistency,
            isActive: true
        });

        emit BotCreated(botTokenId, aggressiveness, consistency);
        return botTokenId;
    }

    /**
     * @notice Create multiple bots at once
     */
    function createBotsBatch(
        uint256[] memory aggressiveness,
        uint256[] memory consistency
    ) external onlyOwner returns (uint256[] memory) {
        require(
            aggressiveness.length == consistency.length,
            "Arrays must have same length"
        );

        uint256[] memory botTokenIds = new uint256[](aggressiveness.length);

        for (uint256 i = 0; i < aggressiveness.length; i++) {
            require(aggressiveness[i] <= 100, "Aggressiveness must be 0-100");
            require(consistency[i] <= 100, "Consistency must be 0-100");

            _botTokenIdCounter++;
            uint256 botTokenId = _botTokenIdCounter;

            botConfigs[botTokenId] = BotConfig({
                tokenId: botTokenId,
                aggressiveness: aggressiveness[i],
                consistency: consistency[i],
                isActive: true
            });

            emit BotCreated(botTokenId, aggressiveness[i], consistency[i]);
            botTokenIds[i] = botTokenId;
        }

        return botTokenIds;
    }

    /**
     * @notice Update bot configuration
     */
    function updateBotConfig(
        uint256 botTokenId,
        uint256 aggressiveness,
        uint256 consistency
    ) external onlyOwner {
        require(botConfigs[botTokenId].isActive, "Bot does not exist");
        require(aggressiveness <= 100, "Aggressiveness must be 0-100");
        require(consistency <= 100, "Consistency must be 0-100");

        botConfigs[botTokenId].aggressiveness = aggressiveness;
        botConfigs[botTokenId].consistency = consistency;
    }

    /**
     * @notice Deactivate a bot
     */
    function deactivateBot(uint256 botTokenId) external onlyOwner {
        require(botConfigs[botTokenId].isActive, "Bot does not exist");
        botConfigs[botTokenId].isActive = false;
    }

    // ========== RACE MANAGEMENT ==========

    /**
     * @notice Create a new race with players and bots
     * @param playerTokenIds Array of player-owned NFT token IDs
     * @param botTokenIds Array of bot token IDs to include
     * @param totalLaps Number of laps in the race
     * @param totalDistance Track length in meters
     */
    function createRace(
        uint256[] memory playerTokenIds,
        uint256[] memory botTokenIds,
        uint256 totalLaps,
        uint256 totalDistance
    ) external onlyOwner returns (uint256) {
        require(
            playerTokenIds.length + botTokenIds.length >= 2,
            "Need at least 2 participants"
        );
        require(totalLaps > 0, "Total laps must be greater than 0");
        require(totalDistance > 0, "Total distance must be greater than 0");

        // Verify all bots exist and are active
        for (uint256 i = 0; i < botTokenIds.length; i++) {
            require(
                botConfigs[botTokenIds[i]].isActive,
                "Bot not active or does not exist"
            );
        }

        // Verify all player tokens exist
        for (uint256 i = 0; i < playerTokenIds.length; i++) {
            require(
                racerNFT.ownerOf(playerTokenIds[i]) != address(0),
                "Player token does not exist"
            );
        }

        _raceIdCounter++;
        uint256 newRaceId = _raceIdCounter;

        // Combine player and bot token IDs
        uint256[] memory allParticipants = new uint256[](
            playerTokenIds.length + botTokenIds.length
        );
        for (uint256 i = 0; i < playerTokenIds.length; i++) {
            allParticipants[i] = playerTokenIds[i];
        }
        for (uint256 i = 0; i < botTokenIds.length; i++) {
            allParticipants[playerTokenIds.length + i] = botTokenIds[i];
        }

        races[newRaceId] = Race({
            raceId: newRaceId,
            participantTokenIds: allParticipants,
            botTokenIds: botTokenIds,
            totalLaps: totalLaps,
            startTime: block.timestamp,
            endTime: 0,
            isActive: true,
            isFinished: false,
            winnerTokenId: 0,
            totalDistance: totalDistance
        });

        // Initialize telemetry storage
        RaceTelemetry storage telemetry = raceTelemetry[newRaceId];
        telemetry.raceId = newRaceId;

        // Set racing status for all participants
        racerNFT.batchSetRacingStatus(allParticipants, true);

        emit RaceCreated(
            newRaceId,
            allParticipants,
            botTokenIds,
            totalLaps,
            block.timestamp
        );

        return newRaceId;
    }

    /**
     * @notice Update telemetry for a car during race
     * @param raceId The race ID
     * @param tokenId The car token ID
     * @param positionX Scaled X position
     * @param positionY Scaled Y position
     * @param speed Current speed in km/h
     * @param currentLap Current lap number
     * @param lapProgress Lap progress 0-100
     * @param acceleration Scaled acceleration
     */
    function updateTelemetry(
        uint256 raceId,
        uint256 tokenId,
        int256 positionX,
        int256 positionY,
        uint256 speed,
        uint256 currentLap,
        uint256 lapProgress,
        uint256 acceleration
    ) external onlyOwner {
        Race storage race = races[raceId];
        require(race.isActive && !race.isFinished, "Race not active");
        require(speed <= 400, "Speed must be 0-400 km/h");
        require(lapProgress <= 100, "Lap progress must be 0-100");

        RaceTelemetry storage telemetry = raceTelemetry[raceId];
        uint256 snapshotIndex = telemetry.lastSnapshotIndex[tokenId];

        // Prevent excessive snapshots (gas optimization)
        if (snapshotIndex >= MAX_SNAPSHOTS_PER_CAR) {
            // Overwrite oldest snapshot (circular buffer)
            uint256 overwriteIndex = snapshotIndex % MAX_SNAPSHOTS_PER_CAR;
            telemetry.snapshots[tokenId][overwriteIndex] = TelemetrySnapshot({
                timestamp: block.timestamp,
                positionX: positionX,
                positionY: positionY,
                speed: speed,
                currentLap: currentLap,
                lapProgress: lapProgress,
                acceleration: acceleration,
                isBot: botConfigs[tokenId].isActive
            });
        } else {
            telemetry.snapshots[tokenId].push(
                TelemetrySnapshot({
                    timestamp: block.timestamp,
                    positionX: positionX,
                    positionY: positionY,
                    speed: speed,
                    currentLap: currentLap,
                    lapProgress: lapProgress,
                    acceleration: acceleration,
                    isBot: botConfigs[tokenId].isActive
                })
            );
        }

        telemetry.lastSnapshotIndex[tokenId] = snapshotIndex + 1;
        telemetry.snapshotCount++;

        // Update RaceNFT race data
        racerNFT.updateRaceData(
            tokenId,
            speed,
            currentLap,
            0, // position calculated off-chain
            lapProgress
        );

        emit TelemetryUpdated(
            raceId,
            tokenId,
            speed,
            currentLap,
            block.timestamp
        );
    }

    /**
     * @notice Finish a race and determine winner
     * @param raceId The race ID
     * @param winnerTokenId The winning car's token ID
     */
    function finishRace(
        uint256 raceId,
        uint256 winnerTokenId
    ) external onlyOwner {
        Race storage race = races[raceId];
        require(
            race.isActive && !race.isFinished,
            "Race not active or already finished"
        );

        // Verify winner is a participant
        bool isValidWinner = false;
        for (uint256 i = 0; i < race.participantTokenIds.length; i++) {
            if (race.participantTokenIds[i] == winnerTokenId) {
                isValidWinner = true;
                break;
            }
        }
        require(isValidWinner, "Winner not in race");

        race.isFinished = true;
        race.isActive = false;
        race.winnerTokenId = winnerTokenId;
        race.endTime = block.timestamp;

        // Update racing status
        racerNFT.batchSetRacingStatus(race.participantTokenIds, false);

        // Update winner stats
        racerNFT.updateRaceStats(winnerTokenId, true, false);

        // Update other participants stats
        for (uint256 i = 0; i < race.participantTokenIds.length; i++) {
            if (race.participantTokenIds[i] != winnerTokenId) {
                racerNFT.updateRaceStats(
                    race.participantTokenIds[i],
                    false,
                    false
                );
            }
        }

        emit RaceFinished(raceId, winnerTokenId, block.timestamp);
    }

    // ========== BETTING FUNCTIONS ==========

    /**
     * @notice Place a bet on a car in a race
     * @param raceId The race ID
     * @param tokenId The car token ID to bet on
     */
    function placeBet(
        uint256 raceId,
        uint256 tokenId
    ) external payable nonReentrant {
        Race storage race = races[raceId];
        require(race.isActive && !race.isFinished, "Race not active");
        require(msg.value >= MIN_BET, "Bet amount too low");

        // Verify token is in race
        bool isValidParticipant = false;
        for (uint256 i = 0; i < race.participantTokenIds.length; i++) {
            if (race.participantTokenIds[i] == tokenId) {
                isValidParticipant = true;
                break;
            }
        }
        require(isValidParticipant, "Token not in race");

        BettingPool storage pool = bettingPools[raceId];
        if (pool.raceId == 0) {
            // Initialize betting pool
            pool.raceId = raceId;
        }

        // Create bet
        Bet memory newBet = Bet({
            bettor: msg.sender,
            tokenId: tokenId,
            amount: msg.value,
            timestamp: block.timestamp,
            claimed: false
        });

        pool.userBets[msg.sender].push(newBet);
        pool.totalPool += msg.value;
        pool.tokenBets[tokenId] += msg.value;

        emit BetPlaced(raceId, msg.sender, tokenId, msg.value);
    }

    /**
     * @notice Settle betting pool after race ends
     * @param raceId The race ID
     */
    function settleBettingPool(uint256 raceId) external onlyOwner {
        Race storage race = races[raceId];
        require(race.isFinished, "Race not finished");
        require(race.winnerTokenId > 0, "No winner determined");

        BettingPool storage pool = bettingPools[raceId];
        require(!pool.isSettled, "Pool already settled");

        pool.isSettled = true;

        emit BettingPoolSettled(raceId, race.winnerTokenId, pool.totalPool);
    }

    /**
     * @notice Claim winnings for a bet
     * @param raceId The race ID
     */
    function claimWinnings(uint256 raceId) external nonReentrant {
        Race storage race = races[raceId];
        require(race.isFinished, "Race not finished");

        BettingPool storage pool = bettingPools[raceId];
        require(pool.isSettled, "Pool not settled");

        uint256 totalWinnings = 0;
        uint256 winningTokenTotal = pool.tokenBets[race.winnerTokenId];

        if (winningTokenTotal == 0) {
            revert("No bets on winner");
        }

        // Calculate user's share of winnings
        Bet[] storage userBetsList = pool.userBets[msg.sender];
        for (uint256 i = 0; i < userBetsList.length; i++) {
            if (
                userBetsList[i].tokenId == race.winnerTokenId &&
                !userBetsList[i].claimed
            ) {
                // Proportional payout
                uint256 betShare = (userBetsList[i].amount * pool.totalPool) /
                    winningTokenTotal;
                uint256 fee = (betShare * platformFeePercent) / FEE_DENOMINATOR;
                uint256 payout = betShare - fee;

                totalWinnings += payout;
                userBetsList[i].claimed = true;
            }
        }

        require(totalWinnings > 0, "No winnings to claim");

        (bool success, ) = payable(msg.sender).call{value: totalWinnings}("");
        require(success, "Payout failed");

        emit WinningsClaimed(raceId, msg.sender, totalWinnings);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Get race details
     */
    function getRace(
        uint256 raceId
    )
        external
        view
        returns (
            uint256 raceId_,
            uint256[] memory participantTokenIds,
            uint256[] memory botTokenIds,
            uint256 totalLaps,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            bool isFinished,
            uint256 winnerTokenId,
            uint256 totalDistance
        )
    {
        Race storage race = races[raceId];
        return (
            race.raceId,
            race.participantTokenIds,
            race.botTokenIds,
            race.totalLaps,
            race.startTime,
            race.endTime,
            race.isActive,
            race.isFinished,
            race.winnerTokenId,
            race.totalDistance
        );
    }

    /**
     * @notice Get telemetry snapshots for a car in a race
     * @param raceId The race ID
     * @param tokenId The car token ID
     * @param limit Maximum number of snapshots to return
     */
    function getTelemetrySnapshots(
        uint256 raceId,
        uint256 tokenId,
        uint256 limit
    ) external view returns (TelemetrySnapshot[] memory) {
        RaceTelemetry storage telemetry = raceTelemetry[raceId];
        TelemetrySnapshot[] storage snapshots = telemetry.snapshots[tokenId];

        uint256 snapshotCount = snapshots.length;
        if (snapshotCount == 0) {
            return new TelemetrySnapshot[](0);
        }

        uint256 returnCount = snapshotCount < limit ? snapshotCount : limit;
        TelemetrySnapshot[] memory result = new TelemetrySnapshot[](
            returnCount
        );

        // Return most recent snapshots
        uint256 startIndex = snapshotCount > returnCount
            ? snapshotCount - returnCount
            : 0;

        for (uint256 i = 0; i < returnCount; i++) {
            result[i] = snapshots[startIndex + i];
        }

        return result;
    }

    /**
     * @notice Get latest telemetry for a car
     */
    function getLatestTelemetry(
        uint256 raceId,
        uint256 tokenId
    ) external view returns (TelemetrySnapshot memory) {
        RaceTelemetry storage telemetry = raceTelemetry[raceId];
        TelemetrySnapshot[] storage snapshots = telemetry.snapshots[tokenId];
        require(snapshots.length > 0, "No telemetry data");
        return snapshots[snapshots.length - 1];
    }

    /**
     * @notice Get betting pool details
     */
    function getBettingPool(
        uint256 raceId
    )
        external
        view
        returns (
            uint256 totalPool,
            bool isSettled,
            uint256[] memory tokenIds,
            uint256[] memory betAmounts
        )
    {
        BettingPool storage pool = bettingPools[raceId];
        Race storage race = races[raceId];

        uint256[] memory tokenIdArray = new uint256[](
            race.participantTokenIds.length
        );
        uint256[] memory betAmountArray = new uint256[](
            race.participantTokenIds.length
        );

        for (uint256 i = 0; i < race.participantTokenIds.length; i++) {
            tokenIdArray[i] = race.participantTokenIds[i];
            betAmountArray[i] = pool.tokenBets[race.participantTokenIds[i]];
        }

        return (pool.totalPool, pool.isSettled, tokenIdArray, betAmountArray);
    }

    /**
     * @notice Get user's bets for a race
     */
    function getUserBets(
        uint256 raceId,
        address user
    ) external view returns (Bet[] memory) {
        return bettingPools[raceId].userBets[user];
    }

    /**
     * @notice Get odds for a car (returns basis points, e.g., 2500 = 25%)
     */
    function getOdds(
        uint256 raceId,
        uint256 tokenId
    ) external view returns (uint256) {
        BettingPool storage pool = bettingPools[raceId];
        if (pool.totalPool == 0) return 10000; // 100% if no bets

        uint256 tokenBetAmount = pool.tokenBets[tokenId];
        if (tokenBetAmount == 0) return 10000; // 100% if no bets on this car

        return (tokenBetAmount * 10000) / pool.totalPool;
    }

    /**
     * @notice Get bot configuration
     */
    function getBotConfig(
        uint256 botTokenId
    ) external view returns (BotConfig memory) {
        return botConfigs[botTokenId];
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Update platform fee (max 5%)
     */
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 500, "Fee cannot exceed 5%");
        platformFeePercent = newFeePercent;
    }

    /**
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // ========== FALLBACK ==========

    receive() external payable {}
}
