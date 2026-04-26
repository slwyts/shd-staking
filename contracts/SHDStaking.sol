// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SHDStaking is Ownable2Step {
    uint256 private constant BPS = 10_000;
    uint256 private constant DIRECT_REFERRAL_BPS = 500;
    uint256 private constant PROFIT_TAX_BPS = 5_000;
    uint256 private constant MAX_UPLINE_DEPTH = 256;
    address private constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    address private constant ROOT_REFERRER = 0x0000000000000000000000000000000000000001;

    uint8 private constant LEVEL_PROVINCE = 3;

    uint8 private constant TEAM_REWARD_OPERATION_CENTER = 4;

    IERC20 public immutable shd;
    uint256 private totalPrincipalLocked;
    uint256 private nextPositionId = 1;
    uint256 private nextTeamRewardId = 1;

    struct PoolInfo {
        uint256 totalStaked;
        uint256 dailyRate;
        bool isActive;
    }

    struct Position {
        uint256 id;
        uint256 amount;
        uint256 period;
        uint256 startTime;
        uint256 endTime;
        uint256 claimedReward;
        bool isUnstaked;
        address referrer;
        uint256 directReferralReward;
        uint256 directReferralRecovered;
        uint256 profitTaxBurned;
    }

    struct SettlementQuote {
        bool early;
        uint256 principal;
        uint256 grossReward;
        uint256 userReward;
        uint256 burnAmount;
        uint256 directReferralRecovery;
        uint256 payout;
    }

    struct TeamInfo {
        uint256 directCount;
        uint256 totalMembers;
        uint256 majorPerformance;
        uint256 minorPerformance;
        uint256 vLevel;
        bool operationCenter;
        uint256 referralReward;
        uint256 teamReward;
    }

    struct TeamRewardGrant {
        uint256 id;
        address recipient;
        address source;
        uint256 sourcePositionId;
        uint8 rewardType;
        uint256 amount;
        uint256 period;
        uint256 startTime;
        uint256 endTime;
        uint256 claimed;
    }

    struct RewardSummary {
        uint256 staticReward;
        uint256 referralReward;
        uint256 teamRewardClaimed;
        uint256 teamRewardPending;
        uint256 teamRewardAllocated;
        uint256 staticRewardBurned;
        uint256 totalReward;
    }

    mapping(uint256 => PoolInfo) private pools;
    mapping(uint256 => Position) private positions;
    mapping(uint256 => address) private positionOwner;
    mapping(address => uint256[]) private _userPositionIds;

    mapping(address => address) public referrerOf;
    mapping(address => uint8) private userLevel;
    mapping(address => bool) private isOperationCenter;
    mapping(address => uint256) private directCount;
    mapping(address => address[]) private _directReferrals;
    mapping(address => mapping(address => uint256)) private _directReferralIndexPlusOne;

    mapping(address => uint256) private totalActiveStaked;
    mapping(address => uint256) private staticRewardClaimed;
    mapping(address => uint256) private staticRewardBurned;
    mapping(address => uint256) private referralRewardPaid;
    mapping(address => uint256) private directReferralRewardRecovered;
    mapping(address => uint256) private teamRewardAllocated;
    mapping(address => uint256) private teamRewardClaimed;

    mapping(uint256 => TeamRewardGrant) private teamRewardGrants;
    mapping(address => uint256[]) private _userTeamRewardGrantIds;

    mapping(uint256 => bool) private packageActive;
    mapping(bytes32 => bool) private packageOrderUsed;

    event PoolUpdated(uint256 indexed period, uint256 dailyRate, bool isActive);
    event Staked(address indexed user, uint256 indexed positionId, uint256 amount, uint256 period, address indexed referrer);
    event Unstaked(address indexed user, uint256 indexed positionId, uint256 principal, uint256 reward, bool early);
    event ProfitTaxBurned(address indexed user, uint256 indexed positionId, uint256 amount);
    event ReferrerUpdated(address indexed user, address indexed oldReferrer, address indexed newReferrer);
    event UserLevelUpdated(address indexed user, uint8 oldLevel, uint8 newLevel);
    event OperationCenterUpdated(address indexed user, bool enabled);
    event DirectReferralRewardPaid(address indexed user, address indexed referrer, uint256 indexed positionId, uint256 amount);
    event DirectReferralRewardRecovered(address indexed user, address indexed referrer, uint256 indexed positionId, uint256 amount);
    event TeamRewardGranted(address indexed recipient, address indexed source, uint256 indexed grantId, uint8 rewardType, uint256 amount, uint256 period);
    event TeamRewardClaimed(address indexed user, uint256 amount);
    event PackagePurchased(address indexed buyer, uint256 packageAmount, uint256 paidAmount, bytes32 indexed orderRef);
    event PackageActiveUpdated(uint256 indexed packageAmount, bool isActive);
    event RewardsFunded(address indexed from, uint256 amount);
    event ShdWithdrawn(address indexed to, uint256 amount);

    constructor(address shdToken, address initialOwner) Ownable(initialOwner) {
        require(shdToken != address(0), "SHDStaking: zero token");

        shd = IERC20(shdToken);
        _setReferrer(initialOwner, ROOT_REFERRER);

        _setPool(90, 50, true);
        _setPool(180, 100, true);
        _setPool(360, 120, true);

        _setPackageActive(5_000 ether, true);
        _setPackageActive(10_000 ether, true);
        _setPackageActive(30_000 ether, true);
        _setPackageActive(50_000 ether, true);
        _setPackageActive(100_000 ether, true);
    }

    function setPool(uint256 period, uint256 dailyRate, bool isActive) external onlyOwner {
        require(period == 90 || period == 180 || period == 360, "SHDStaking: unsupported period");
        _setPool(period, dailyRate, isActive);
    }

    function stake(uint256 amount, uint256 period) external {
        PoolInfo storage pool = pools[period];
        require(pool.isActive, "SHDStaking: inactive pool");
        require(amount > 0, "SHDStaking: zero amount");

        address user = msg.sender;
        address directReferrer = referrerOf[user];
        require(directReferrer != address(0), "SHDStaking: referrer required");

        require(shd.transferFrom(user, address(this), amount), "SHDStaking: transfer failed");

        uint256 positionId = nextPositionId++;
        uint256 endTime = block.timestamp + period * 1 days;
        uint256 directReward = directReferrer == ROOT_REFERRER ? 0 : (amount * DIRECT_REFERRAL_BPS) / BPS;
        positions[positionId] = Position({
            id: positionId,
            amount: amount,
            period: period,
            startTime: block.timestamp,
            endTime: endTime,
            claimedReward: 0,
            isUnstaked: false,
            referrer: directReferrer,
            directReferralReward: directReward,
            directReferralRecovered: 0,
            profitTaxBurned: 0
        });
        positionOwner[positionId] = user;
        _userPositionIds[user].push(positionId);

        totalPrincipalLocked += amount;
        totalActiveStaked[user] += amount;
        pool.totalStaked += amount;

        if (directReward > 0) {
            _payReward(directReferrer, directReward);
            referralRewardPaid[directReferrer] += directReward;
            emit DirectReferralRewardPaid(user, directReferrer, positionId, directReward);
        }

        _grantTeamRewards(user, positionId, amount, period);
        emit Staked(user, positionId, amount, period, directReferrer);
    }

    function bindReferrer(address referrer) external {
        require(referrerOf[msg.sender] == address(0), "SHDStaking: referrer already bound");
        require(referrer != address(0), "SHDStaking: zero referrer");
        require(referrer != ROOT_REFERRER || msg.sender == owner(), "SHDStaking: root only owner");
        _setReferrer(msg.sender, referrer);
    }

    function unstake(uint256 positionId) external {
        require(positionOwner[positionId] == msg.sender, "SHDStaking: not position owner");

        Position storage position = positions[positionId];
        require(!position.isUnstaked, "SHDStaking: already unstaked");

        SettlementQuote memory quote = _settlementQuote(position);
        if (quote.grossReward > 0) require(_rewardPoolBalance() >= quote.grossReward, "SHDStaking: insufficient rewards");

        position.isUnstaked = true;
        position.claimedReward += quote.grossReward;
        position.directReferralRecovered = quote.directReferralRecovery;
        position.profitTaxBurned = quote.burnAmount;
        totalPrincipalLocked -= position.amount;
        totalActiveStaked[msg.sender] -= position.amount;
        pools[position.period].totalStaked -= position.amount;

        if (quote.userReward > 0) staticRewardClaimed[msg.sender] += quote.userReward;
        if (quote.burnAmount > 0) staticRewardBurned[msg.sender] += quote.burnAmount;
        if (quote.directReferralRecovery > 0) {
            directReferralRewardRecovered[position.referrer] += quote.directReferralRecovery;
            emit DirectReferralRewardRecovered(msg.sender, position.referrer, positionId, quote.directReferralRecovery);
        }

        if (quote.payout > 0) require(shd.transfer(msg.sender, quote.payout), "SHDStaking: transfer failed");
        if (quote.burnAmount > 0) {
            require(shd.transfer(DEAD_ADDRESS, quote.burnAmount), "SHDStaking: burn transfer failed");
            emit ProfitTaxBurned(msg.sender, positionId, quote.burnAmount);
        }

        emit Unstaked(msg.sender, positionId, quote.principal - quote.directReferralRecovery, quote.userReward, quote.early);
    }

    function claimTeamRewards(uint256[] calldata grantIds) external {
        uint256 total;
        for (uint256 i; i < grantIds.length; ++i) {
            TeamRewardGrant storage grant = teamRewardGrants[grantIds[i]];
            require(grant.recipient == msg.sender, "SHDStaking: not grant owner");
            uint256 pending = _pendingTeamReward(grant);
            if (pending > 0) {
                grant.claimed += pending;
                total += pending;
            }
        }

        require(total > 0, "SHDStaking: no team reward");
        require(_rewardPoolBalance() >= total, "SHDStaking: insufficient rewards");

        teamRewardClaimed[msg.sender] += total;
        require(shd.transfer(msg.sender, total), "SHDStaking: transfer failed");
        emit TeamRewardClaimed(msg.sender, total);
    }

    function purchasePackage(uint256 packageAmount, bytes32 orderRef) external {
        require(packageActive[packageAmount], "SHDStaking: inactive package");
        require(orderRef != bytes32(0), "SHDStaking: zero order ref");
        require(!packageOrderUsed[orderRef], "SHDStaking: order used");

        packageOrderUsed[orderRef] = true;
        require(shd.transferFrom(msg.sender, address(this), packageAmount), "SHDStaking: transfer failed");
        emit PackagePurchased(msg.sender, packageAmount, packageAmount, orderRef);
    }

    function fundRewards(uint256 amount) external {
        require(amount > 0, "SHDStaking: zero amount");
        require(shd.transferFrom(msg.sender, address(this), amount), "SHDStaking: transfer failed");
        emit RewardsFunded(msg.sender, amount);
    }

    function withdrawShd(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "SHDStaking: zero address");
        require(amount <= shd.balanceOf(address(this)), "SHDStaking: exceeds balance");
        require(shd.transfer(to, amount), "SHDStaking: transfer failed");
        emit ShdWithdrawn(to, amount);
    }

    function setPackageActive(uint256 packageAmount, bool isActive) external onlyOwner {
        require(packageAmount > 0, "SHDStaking: zero package");
        _setPackageActive(packageAmount, isActive);
    }

    function batchSetReferrers(address[] calldata users, address[] calldata referrers) external onlyOwner {
        require(users.length == referrers.length, "SHDStaking: length mismatch");
        for (uint256 i; i < users.length; ++i) {
            _setReferrer(users[i], referrers[i]);
        }
    }

    function batchSetUserLevels(address[] calldata users, uint8[] calldata levels) external onlyOwner {
        require(users.length == levels.length, "SHDStaking: length mismatch");
        for (uint256 i; i < users.length; ++i) {
            _setUserLevel(users[i], levels[i]);
        }
    }

    function batchSetOperationCenters(address[] calldata users, bool[] calldata enabled) external onlyOwner {
        require(users.length == enabled.length, "SHDStaking: length mismatch");
        for (uint256 i; i < users.length; ++i) {
            _setOperationCenter(users[i], enabled[i]);
        }
    }

    function getUserPositions(address user) external view returns (Position[] memory userPositions) {
        uint256[] storage ids = _userPositionIds[user];
        userPositions = new Position[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            userPositions[i] = positions[ids[i]];
        }
    }

    function getSettlementQuote(uint256 positionId) external view returns (SettlementQuote memory) {
        Position storage position = positions[positionId];
        require(position.id != 0, "SHDStaking: position not found");
        return _settlementQuote(position);
    }

    function getPoolInfo(uint256 period) external view returns (PoolInfo memory) {
        return pools[period];
    }

    function getTeamInfo(address user) external view returns (TeamInfo memory) {
        (uint256 totalMembers, uint256 majorPerformance, uint256 minorPerformance) = _teamStats(user);
        return TeamInfo({
            directCount: directCount[user],
            totalMembers: totalMembers,
            majorPerformance: majorPerformance,
            minorPerformance: minorPerformance,
            vLevel: userLevel[user],
            operationCenter: isOperationCenter[user],
            referralReward: referralRewardPaid[user],
            teamReward: teamRewardAllocated[user]
        });
    }

    function getDirectReferrals(address user) external view returns (address[] memory) {
        return _directReferrals[user];
    }

    function getRewardSummary(address user) external view returns (RewardSummary memory summary) {
        uint256 teamPending = _pendingTeamRewards(user);
        summary = RewardSummary({
            staticReward: staticRewardClaimed[user],
            referralReward: referralRewardPaid[user],
            teamRewardClaimed: teamRewardClaimed[user],
            teamRewardPending: teamPending,
            teamRewardAllocated: teamRewardAllocated[user],
            staticRewardBurned: staticRewardBurned[user],
            totalReward: staticRewardClaimed[user] + referralRewardPaid[user] + teamRewardClaimed[user] + teamPending
        });
    }

    function getTeamRewardGrants(address user) external view returns (TeamRewardGrant[] memory grants) {
        uint256[] storage ids = _userTeamRewardGrantIds[user];
        grants = new TeamRewardGrant[](ids.length);
        for (uint256 i; i < ids.length; ++i) {
            grants[i] = teamRewardGrants[ids[i]];
        }
    }

    function _pendingTeamRewards(address user) private view returns (uint256 total) {
        uint256[] storage ids = _userTeamRewardGrantIds[user];
        for (uint256 i; i < ids.length; ++i) {
            total += _pendingTeamReward(teamRewardGrants[ids[i]]);
        }
    }

    function _rewardPoolBalance() private view returns (uint256) {
        uint256 balance = shd.balanceOf(address(this));
        return balance > totalPrincipalLocked ? balance - totalPrincipalLocked : 0;
    }

    function _setPool(uint256 period, uint256 dailyRate, bool isActive) private {
        pools[period].dailyRate = dailyRate;
        pools[period].isActive = isActive;
        emit PoolUpdated(period, dailyRate, isActive);
    }

    function _setPackageActive(uint256 packageAmount, bool isActive) private {
        packageActive[packageAmount] = isActive;
        emit PackageActiveUpdated(packageAmount, isActive);
    }

    function _setReferrer(address user, address referrer) private {
        require(user != address(0), "SHDStaking: zero user");
        require(referrer != user, "SHDStaking: self referrer");
        require(referrer == address(0) || referrer == ROOT_REFERRER || !_createsCycle(user, referrer), "SHDStaking: referrer cycle");

        address oldReferrer = referrerOf[user];
        if (oldReferrer == referrer) return;

        if (oldReferrer != address(0) && oldReferrer != ROOT_REFERRER) {
            directCount[oldReferrer] -= 1;
            _removeDirectReferral(oldReferrer, user);
        }
        if (referrer != address(0) && referrer != ROOT_REFERRER) {
            directCount[referrer] += 1;
            _addDirectReferral(referrer, user);
        }

        referrerOf[user] = referrer;
        emit ReferrerUpdated(user, oldReferrer, referrer);
    }

    function _addDirectReferral(address referrer, address user) private {
        if (_directReferralIndexPlusOne[referrer][user] != 0) return;
        _directReferrals[referrer].push(user);
        _directReferralIndexPlusOne[referrer][user] = _directReferrals[referrer].length;
    }

    function _removeDirectReferral(address referrer, address user) private {
        uint256 indexPlusOne = _directReferralIndexPlusOne[referrer][user];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = _directReferrals[referrer].length - 1;
        if (index != lastIndex) {
            address lastUser = _directReferrals[referrer][lastIndex];
            _directReferrals[referrer][index] = lastUser;
            _directReferralIndexPlusOne[referrer][lastUser] = indexPlusOne;
        }

        _directReferrals[referrer].pop();
        delete _directReferralIndexPlusOne[referrer][user];
    }

    function _teamStats(address user) private view returns (uint256 totalMembers, uint256 majorPerformance, uint256 minorPerformance) {
        address[] storage referrals = _directReferrals[user];
        uint256 totalPerformance;

        for (uint256 i; i < referrals.length; ++i) {
            (uint256 branchMembers, uint256 branchPerformance) = _subtreeStats(referrals[i], 1);
            totalMembers += branchMembers;
            totalPerformance += branchPerformance;
            if (branchPerformance > majorPerformance) majorPerformance = branchPerformance;
        }

        minorPerformance = totalPerformance - majorPerformance;
    }

    function _subtreeStats(address user, uint256 depth) private view returns (uint256 members, uint256 performance) {
        members = 1;
        performance = totalActiveStaked[user];

        if (depth >= MAX_UPLINE_DEPTH) return (members, performance);

        address[] storage referrals = _directReferrals[user];
        for (uint256 i; i < referrals.length; ++i) {
            (uint256 childMembers, uint256 childPerformance) = _subtreeStats(referrals[i], depth + 1);
            members += childMembers;
            performance += childPerformance;
        }
    }

    function _setUserLevel(address user, uint8 level) private {
        require(user != address(0), "SHDStaking: zero user");
        require(level <= LEVEL_PROVINCE, "SHDStaking: invalid level");
        uint8 oldLevel = userLevel[user];
        if (oldLevel == level) return;
        userLevel[user] = level;
        emit UserLevelUpdated(user, oldLevel, level);
    }

    function _setOperationCenter(address user, bool enabled) private {
        require(user != address(0), "SHDStaking: zero user");
        if (isOperationCenter[user] == enabled) return;
        isOperationCenter[user] = enabled;
        emit OperationCenterUpdated(user, enabled);
    }

    function _grantTeamRewards(address source, uint256 sourcePositionId, uint256 amount, uint256 period) private {
        uint256 rewardRate = _teamRewardRate(period);
        if (rewardRate == 0) return;

        uint8 highestRegionalLevel;
        bool operationCenterFound;

        address current = referrerOf[source];
        for (uint256 depth; current != address(0) && current != ROOT_REFERRER && depth < MAX_UPLINE_DEPTH; ++depth) {
            uint8 level = userLevel[current];
            if (level > highestRegionalLevel) {
                highestRegionalLevel = level;
                _createTeamReward(current, source, sourcePositionId, level, amount, period, rewardRate);
            }

            if (!operationCenterFound && isOperationCenter[current]) {
                operationCenterFound = true;
                _createTeamReward(current, source, sourcePositionId, TEAM_REWARD_OPERATION_CENTER, amount, period, rewardRate);
            }

            if (highestRegionalLevel == LEVEL_PROVINCE && operationCenterFound) break;
            current = referrerOf[current];
        }
    }

    function _settlementQuote(Position storage position) private view returns (SettlementQuote memory quote) {
        if (position.id == 0 || position.isUnstaked) return quote;

        quote.early = block.timestamp < position.endTime;
        quote.principal = position.amount;
        if (quote.early) {
            quote.directReferralRecovery = position.directReferralReward;
            quote.payout = position.amount - quote.directReferralRecovery;
            return quote;
        }

        quote.grossReward = _pendingStaticReward(position);
        quote.userReward = (quote.grossReward * (BPS - PROFIT_TAX_BPS)) / BPS;
        quote.burnAmount = quote.grossReward - quote.userReward;
        quote.payout = position.amount + quote.userReward;
    }

    function _createTeamReward(
        address recipient,
        address source,
        uint256 sourcePositionId,
        uint8 rewardType,
        uint256 amount,
        uint256 period,
        uint256 rewardRate
    ) private {
        uint256 rewardAmount = (amount * rewardRate) / BPS;
        if (rewardAmount == 0) return;

        uint256 grantId = nextTeamRewardId++;
        teamRewardGrants[grantId] = TeamRewardGrant({
            id: grantId,
            recipient: recipient,
            source: source,
            sourcePositionId: sourcePositionId,
            rewardType: rewardType,
            amount: rewardAmount,
            period: period,
            startTime: block.timestamp,
            endTime: block.timestamp + period * 1 days,
            claimed: 0
        });
        _userTeamRewardGrantIds[recipient].push(grantId);
        teamRewardAllocated[recipient] += rewardAmount;

        emit TeamRewardGranted(recipient, source, grantId, rewardType, rewardAmount, period);
    }

    function _pendingStaticReward(Position storage position) private view returns (uint256) {
        if (position.id == 0 || position.isUnstaked || block.timestamp < position.endTime) return 0;
        uint256 totalReward = (position.amount * pools[position.period].dailyRate * position.period) / BPS;
        return totalReward > position.claimedReward ? totalReward - position.claimedReward : 0;
    }

    function _pendingTeamReward(TeamRewardGrant storage grant) private view returns (uint256) {
        if (grant.id == 0 || grant.claimed >= grant.amount) return 0;

        uint256 vested;
        if (block.timestamp >= grant.endTime) {
            vested = grant.amount;
        } else {
            uint256 elapsed = block.timestamp - grant.startTime;
            uint256 duration = grant.endTime - grant.startTime;
            vested = (grant.amount * elapsed) / duration;
        }

        return vested > grant.claimed ? vested - grant.claimed : 0;
    }

    function _payReward(address to, uint256 amount) private {
        require(amount > 0, "SHDStaking: zero reward");
        require(_rewardPoolBalance() >= amount, "SHDStaking: insufficient rewards");
        require(shd.transfer(to, amount), "SHDStaking: transfer failed");
    }

    function _teamRewardRate(uint256 period) private pure returns (uint256) {
        if (period == 90) return 300;
        if (period == 180) return 500;
        if (period == 360) return 600;
        return 0;
    }

    function _createsCycle(address user, address referrer) private view returns (bool) {
        address current = referrer;
        for (uint256 depth; current != address(0) && current != ROOT_REFERRER && depth < MAX_UPLINE_DEPTH; ++depth) {
            if (current == user) return true;
            current = referrerOf[current];
        }
        return false;
    }
}