// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RaceNFT.sol";

// ============================================
// CONTRACT 2: TRADING & AUCTION ENGINE
// ============================================

contract TradingEngine is ReentrancyGuard, Ownable {
    RacerNFT public racerNFT;

    struct Listing {
        address seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    struct Auction {
        address seller;
        uint256 startPrice;
        uint256 currentBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Auction) public auctions;

    // Platform fee: 2.5% (250 basis points)
    uint256 public platformFeePercent = 250;
    uint256 public constant FEE_DENOMINATOR = 10000;

    // ========== BETTING POOL STRUCTURES ==========
    struct Bet {
        address bettor;
        uint256 tokenId; // Car being bet on
        uint256 amount; // Bet amount in wei
        uint256 timestamp;
        bool claimed;
    }

    struct RacePool {
        uint256 raceId; // Unique race identifier
        uint256[] participatingTokenIds; // Cars in the race
        uint256 totalPool; // Total ETH in betting pool
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isSettled;
        uint256 winnerTokenId; // Winning car tokenId
    }

    mapping(uint256 => RacePool) public racePools; // raceId => RacePool
    mapping(uint256 => Bet[]) public raceBets; // raceId => Bet[]
    mapping(uint256 => mapping(uint256 => uint256)) public raceTokenBets; // raceId => tokenId => total bet amount
    mapping(address => mapping(uint256 => uint256)) public userBets; // user => raceId => bet amount
    uint256 private _raceIdCounter;

    event RacerListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price
    );
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event RacerSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    event AuctionCreated(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startPrice,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );
    event AuctionEnded(
        uint256 indexed tokenId,
        address indexed winner,
        uint256 amount
    );
    event AuctionCancelled(uint256 indexed tokenId);
    event RacePoolCreated(
        uint256 indexed raceId,
        uint256[] tokenIds,
        uint256 startTime
    );
    event BetPlaced(
        uint256 indexed raceId,
        address indexed bettor,
        uint256 indexed tokenId,
        uint256 amount
    );
    event RaceSettled(
        uint256 indexed raceId,
        uint256 indexed winnerTokenId,
        uint256 totalPayout
    );
    event BetClaimed(
        uint256 indexed raceId,
        address indexed bettor,
        uint256 payout
    );

    constructor(address _racerNFTAddress) Ownable(msg.sender) {
        require(_racerNFTAddress != address(0), "Invalid NFT contract address");
        racerNFT = RacerNFT(_racerNFTAddress);
    }

    // ========== INSTANT SALE FUNCTIONS ==========

    // List racer for instant sale
    function listRacer(uint256 tokenId, uint256 price) external {
        require(racerNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].active, "Already listed");
        require(!auctions[tokenId].active, "Already in auction");

        // Check racer is not racing
        (, , , , , , , bool isRacing, ) = racerNFT.racerStats(tokenId);
        require(!isRacing, "Cannot list racer while racing");

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        emit RacerListed(tokenId, msg.sender, price);
    }

    // Cancel listing
    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not the seller");

        listing.active = false;
        emit ListingCancelled(tokenId, msg.sender);
    }

    // Buy racer instantly
    function buyRacer(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own racer");

        // Calculate platform fee
        uint256 fee = (listing.price * platformFeePercent) / FEE_DENOMINATOR;
        uint256 sellerAmount = listing.price - fee;

        // Transfer NFT to buyer
        racerNFT.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Transfer funds to seller
        (bool sellerSuccess, ) = payable(listing.seller).call{
            value: sellerAmount
        }("");
        require(sellerSuccess, "Seller payment failed");

        // Deactivate listing
        listings[tokenId].active = false;

        emit RacerSold(tokenId, listing.seller, msg.sender, listing.price);

        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - listing.price
            }("");
            require(refundSuccess, "Refund failed");
        }
    }

    // ========== AUCTION FUNCTIONS ==========

    // Create auction (duration in seconds)
    function createAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration
    ) external {
        require(racerNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(startPrice > 0, "Start price must be greater than 0");
        require(
            duration >= 300 && duration <= 86400,
            "Duration must be 5min-24hrs"
        );
        require(!listings[tokenId].active, "Already listed for sale");
        require(!auctions[tokenId].active, "Already in auction");

        // Check racer is not racing
        (, , , , , , , bool isRacing, ) = racerNFT.racerStats(tokenId);
        require(!isRacing, "Cannot auction racer while racing");

        uint256 endTime = block.timestamp + duration;

        auctions[tokenId] = Auction({
            seller: msg.sender,
            startPrice: startPrice,
            currentBid: 0,
            highestBidder: address(0),
            endTime: endTime,
            active: true
        });

        emit AuctionCreated(tokenId, msg.sender, startPrice, endTime);
    }

    // Place bid on auction
    function placeBid(uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Cannot bid on your own auction");

        uint256 minBid = auction.currentBid == 0
            ? auction.startPrice
            : auction.currentBid + (auction.currentBid / 20); // 5% increment
        require(msg.value >= minBid, "Bid too low");

        // Refund previous bidder
        if (auction.highestBidder != address(0)) {
            (bool refundSuccess, ) = payable(auction.highestBidder).call{
                value: auction.currentBid
            }("");
            require(refundSuccess, "Previous bidder refund failed");
        }

        auction.currentBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    // End auction and transfer NFT
    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction still ongoing");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // Calculate platform fee
            uint256 fee = (auction.currentBid * platformFeePercent) /
                FEE_DENOMINATOR;
            uint256 sellerAmount = auction.currentBid - fee;

            // Transfer NFT to winner
            racerNFT.safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                tokenId
            );

            // Transfer funds to seller
            (bool sellerSuccess, ) = payable(auction.seller).call{
                value: sellerAmount
            }("");
            require(sellerSuccess, "Seller payment failed");

            emit AuctionEnded(
                tokenId,
                auction.highestBidder,
                auction.currentBid
            );
        } else {
            // No bids, cancel auction
            emit AuctionCancelled(tokenId);
        }
    }

    // Cancel auction (only if no bids)
    function cancelAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(auction.seller == msg.sender, "Not the seller");
        require(
            auction.highestBidder == address(0),
            "Cannot cancel auction with bids"
        );

        auction.active = false;
        emit AuctionCancelled(tokenId);
    }

    // ========== ADMIN FUNCTIONS ==========

    // Update platform fee (max 5%)
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 500, "Fee cannot exceed 5%");
        platformFeePercent = newFeePercent;
    }

    // Withdraw accumulated fees
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // ========== VIEW FUNCTIONS ==========

    // Get all active listings
    function getActiveListings() external view returns (uint256[] memory) {
        uint256 totalSupply = racerNFT.totalSupply();
        uint256[] memory activeTokenIds = new uint256[](totalSupply);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalSupply; i++) {
            if (listings[i].active) {
                activeTokenIds[count] = i;
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeTokenIds[i];
        }

        return result;
    }

    // Get all active auctions
    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256 totalSupply = racerNFT.totalSupply();
        uint256[] memory activeTokenIds = new uint256[](totalSupply);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalSupply; i++) {
            if (auctions[i].active && block.timestamp < auctions[i].endTime) {
                activeTokenIds[count] = i;
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeTokenIds[i];
        }

        return result;
    }

    // ========== BETTING POOL FUNCTIONS ==========

    // Create a new race pool (only owner/backend)
    function createRacePool(
        uint256[] memory tokenIds,
        uint256 duration
    ) external onlyOwner returns (uint256) {
        require(tokenIds.length >= 2, "Need at least 2 racers");
        require(duration > 0, "Duration must be greater than 0");

        _raceIdCounter++;
        uint256 newRaceId = _raceIdCounter;

        racePools[newRaceId] = RacePool({
            raceId: newRaceId,
            participatingTokenIds: tokenIds,
            totalPool: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            isSettled: false,
            winnerTokenId: 0
        });

        emit RacePoolCreated(newRaceId, tokenIds, block.timestamp);
        return newRaceId;
    }

    // Place a bet on a specific car in a race
    function placeBet(
        uint256 raceId,
        uint256 tokenId
    ) external payable nonReentrant {
        RacePool storage pool = racePools[raceId];
        require(pool.isActive, "Race pool not active");
        require(block.timestamp < pool.endTime, "Betting period ended");
        require(msg.value >= 0.001 ether, "Minimum bet: 0.001 ETH");
        require(!pool.isSettled, "Race already settled");

        // Verify tokenId is in the race
        bool isValidRacer = false;
        for (uint256 i = 0; i < pool.participatingTokenIds.length; i++) {
            if (pool.participatingTokenIds[i] == tokenId) {
                isValidRacer = true;
                break;
            }
        }
        require(isValidRacer, "Token not in this race");

        // Check racer is actually racing
        (, , , , , , , bool isRacing, ) = racerNFT.racerStats(tokenId);
        require(isRacing, "Racer not currently racing");

        // Create bet
        raceBets[raceId].push(
            Bet({
                bettor: msg.sender,
                tokenId: tokenId,
                amount: msg.value,
                timestamp: block.timestamp,
                claimed: false
            })
        );

        // Update pool totals
        pool.totalPool += msg.value;
        raceTokenBets[raceId][tokenId] += msg.value;
        userBets[msg.sender][raceId] += msg.value;

        emit BetPlaced(raceId, msg.sender, tokenId, msg.value);
    }

    // Settle race and determine winner (only owner/backend)
    function settleRace(
        uint256 raceId,
        uint256 winnerTokenId
    ) external onlyOwner {
        RacePool storage pool = racePools[raceId];
        require(pool.isActive, "Race pool not active");
        require(!pool.isSettled, "Race already settled");
        require(block.timestamp >= pool.endTime, "Race still ongoing");

        // Verify winner is in the race
        bool isValidWinner = false;
        for (uint256 i = 0; i < pool.participatingTokenIds.length; i++) {
            if (pool.participatingTokenIds[i] == winnerTokenId) {
                isValidWinner = true;
                break;
            }
        }
        require(isValidWinner, "Winner not in this race");

        pool.isSettled = true;
        pool.isActive = false;
        pool.winnerTokenId = winnerTokenId;

        emit RaceSettled(raceId, winnerTokenId, pool.totalPool);
    }

    // Claim winnings for a bet
    function claimWinnings(uint256 raceId) external nonReentrant {
        RacePool storage pool = racePools[raceId];
        require(pool.isSettled, "Race not settled yet");
        require(pool.winnerTokenId > 0, "No winner determined");

        uint256 totalWinnings = 0;
        uint256 winningBets = 0;
        uint256 totalWinningPool = raceTokenBets[raceId][pool.winnerTokenId];

        // Calculate user's winnings
        for (uint256 i = 0; i < raceBets[raceId].length; i++) {
            Bet storage bet = raceBets[raceId][i];
            if (
                bet.bettor == msg.sender &&
                bet.tokenId == pool.winnerTokenId &&
                !bet.claimed
            ) {
                // Calculate proportional payout
                uint256 betShare = (bet.amount * pool.totalPool) /
                    totalWinningPool;
                uint256 fee = (betShare * platformFeePercent) / FEE_DENOMINATOR;
                uint256 payout = betShare - fee;

                totalWinnings += payout;
                winningBets++;
                bet.claimed = true;
            }
        }

        require(totalWinnings > 0, "No winnings to claim");

        // Transfer winnings
        (bool success, ) = payable(msg.sender).call{value: totalWinnings}("");
        require(success, "Payout failed");

        emit BetClaimed(raceId, msg.sender, totalWinnings);
    }

    // Get current odds for a car (returns basis points, e.g., 2500 = 25%)
    function getOdds(
        uint256 raceId,
        uint256 tokenId
    ) external view returns (uint256) {
        RacePool memory pool = racePools[raceId];
        if (pool.totalPool == 0) return 10000; // 100% if no bets yet

        uint256 tokenBetAmount = raceTokenBets[raceId][tokenId];
        if (tokenBetAmount == 0) return 10000; // 100% if no bets on this car

        // Calculate odds based on bet distribution
        // Higher bet amount = lower odds (more likely to win)
        return (tokenBetAmount * 10000) / pool.totalPool;
    }

    // Get race pool details
    function getRacePool(
        uint256 raceId
    ) external view returns (RacePool memory) {
        return racePools[raceId];
    }

    // Get all bets for a race
    function getRaceBets(uint256 raceId) external view returns (Bet[] memory) {
        return raceBets[raceId];
    }

    // Get user's bets for a race
    function getUserBets(
        uint256 raceId,
        address user
    ) external view returns (Bet[] memory) {
        Bet[] memory allBets = raceBets[raceId];
        uint256 count = 0;

        // Count user bets
        for (uint256 i = 0; i < allBets.length; i++) {
            if (allBets[i].bettor == user) {
                count++;
            }
        }

        // Build result array
        Bet[] memory userBetsList = new Bet[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allBets.length; i++) {
            if (allBets[i].bettor == user) {
                userBetsList[index] = allBets[i];
                index++;
            }
        }

        return userBetsList;
    }

    // Emergency: receive ETH
    receive() external payable {}
}
