// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SHDStaking is Ownable2Step {
    uint256 public constant BPS = 10_000;
    uint256 public constant DIRECT_REFERRAL_BPS = 500;
    uint256 public constant PROFIT_TAX_BPS = 5_000;
    uint256 public constant MAX_UPLINE_DEPTH = 256;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint8 public constant LEVEL_NORMAL = 0;
    uint8 public constant LEVEL_COUNTY = 1;
    uint8 public constant LEVEL_CITY = 2;
    uint8 public constant LEVEL_PROVINCE = 3;

    uint8 public constant TEAM_REWARD_COUNTY = 1;
    uint8 public constant TEAM_REWARD_CITY = 2;
    uint8 public constant TEAM_REWARD_PROVINCE = 3;
    uint8 public constant TEAM_REWARD_OPERATION_CENTER = 4;

    IERC20 public immutable shd;
    uint256 public totalPrincipalLocked;
    uint256 public nextPositionId = 1;
    uint256 public nextTeamRewardId = 1;

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

    mapping(uint256 => PoolInfo) public pools;
    mapping(uint256 => Position) public positions;
    mapping(uint256 => address) public positionOwner;
    mapping(address => uint256[]) private _userPositionIds;

    mapping(address => address) public referrerOf;
    mapping(address => uint8) public userLevel;
    mapping(address => bool) public isOperationCenter;
    mapping(address => uint256) public directCount;

    mapping(address => uint256) public totalActiveStaked;
    mapping(address => uint256) public staticRewardClaimed;
    mapping(address => uint256) public staticRewardBurned;
    mapping(address => uint256) public referralRewardPaid;
    mapping(address => uint256) public directReferralRewardRecovered;
    mapping(address => uint256) public teamRewardAllocated;
    mapping(address => uint256) public teamRewardClaimed;

    mapping(uint256 => TeamRewardGrant) public teamRewardGrants;
    mapping(address => uint256[]) private _userTeamRewardGrantIds;

    mapping(uint256 => bool) public packageActive;
    mapping(bytes32 => bool) public packageOrderUsed;
    mapping(uint256 => bool) private _packageKnown;
    uint256[] private _packages;

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
    event ExcessRecovered(address indexed to, uint256 amount);

    constructor(address shdToken, address initialOwner) Ownable(initialOwner) {
        require(shdToken != address(0), "SHDStaking: zero token");

        shd = IERC20(shdToken);

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
        uint256 directReward = (amount * DIRECT_REFERRAL_BPS) / BPS;
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

        _payReward(directReferrer, directReward);
        referralRewardPaid[directReferrer] += directReward;
        emit DirectReferralRewardPaid(user, directReferrer, positionId, directReward);

        _grantTeamRewards(user, positionId, amount, period);
        emit Staked(user, positionId, amount, period, directReferrer);
    }

    function bindReferrer(address referrer) external {
        require(referrerOf[msg.sender] == address(0), "SHDStaking: referrer already bound");
        require(referrer != address(0), "SHDStaking: zero referrer");
        _setReferrer(msg.sender, referrer);
    }

    function unstake(uint256 positionId) external {
        require(positionOwner[positionId] == msg.sender, "SHDStaking: not position owner");

        Position storage position = positions[positionId];
        require(!position.isUnstaked, "SHDStaking: already unstaked");

        SettlementQuote memory quote = _settlementQuote(position);
        if (quote.grossReward > 0) require(rewardPoolBalance() >= quote.grossReward, "SHDStaking: insufficient rewards");

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
        require(rewardPoolBalance() >= total, "SHDStaking: insufficient rewards");

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

    function recoverExcessToken(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "SHDStaking: zero address");
        require(amount <= rewardPoolBalance(), "SHDStaking: exceeds excess");
        require(shd.transfer(to, amount), "SHDStaking: transfer failed");
        emit ExcessRecovered(to, amount);
    }

    function setPackageActive(uint256 packageAmount, bool isActive) external onlyOwner {
        require(packageAmount > 0, "SHDStaking: zero package");
        _setPackageActive(packageAmount, isActive);
    }

    function setReferrer(address user, address referrer) external onlyOwner {
        _setReferrer(user, referrer);
    }

    function setUserLevel(address user, uint8 level) external onlyOwner {
        _setUserLevel(user, level);
    }

    function setOperationCenter(address user, bool enabled) external onlyOwner {
        _setOperationCenter(user, enabled);
    }

    function batchImportUsers(
        address[] calldata users,
        address[] calldata referrers,
        uint8[] calldata levels,
        bool[] calldata operationCenters
    ) external onlyOwner {
        uint256 length = users.length;
        require(length == referrers.length && length == levels.length && length == operationCenters.length, "SHDStaking: length mismatch");

        for (uint256 i; i < length; ++i) {
            _setReferrer(users[i], referrers[i]);
            _setUserLevel(users[i], levels[i]);
            _setOperationCenter(users[i], operationCenters[i]);
        }
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

    function getPendingReward(uint256 positionId) external view returns (uint256) {
        return _settlementQuote(positions[positionId]).userReward;
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
        return TeamInfo({
            directCount: directCount[user],
            totalMembers: directCount[user],
            majorPerformance: totalActiveStaked[user],
            minorPerformance: 0,
            vLevel: userLevel[user],
            referralReward: referralRewardPaid[user],
            teamReward: teamRewardAllocated[user]
        });
    }

    function getRewardSummary(address user) external view returns (RewardSummary memory summary) {
        uint256 teamPending = getPendingTeamRewards(user);
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

    function getPendingTeamReward(uint256 grantId) external view returns (uint256) {
        return _pendingTeamReward(teamRewardGrants[grantId]);
    }

    function getPendingTeamRewards(address user) public view returns (uint256 total) {
        uint256[] storage ids = _userTeamRewardGrantIds[user];
        for (uint256 i; i < ids.length; ++i) {
            total += _pendingTeamReward(teamRewardGrants[ids[i]]);
        }
    }

    function getPackages() external view returns (uint256[] memory) {
        return _packages;
    }

    function rewardPoolBalance() public view returns (uint256) {
        uint256 balance = shd.balanceOf(address(this));
        return balance > totalPrincipalLocked ? balance - totalPrincipalLocked : 0;
    }

    function _setPool(uint256 period, uint256 dailyRate, bool isActive) private {
        pools[period].dailyRate = dailyRate;
        pools[period].isActive = isActive;
        emit PoolUpdated(period, dailyRate, isActive);
    }

    function _setPackageActive(uint256 packageAmount, bool isActive) private {
        if (!_packageKnown[packageAmount]) {
            _packageKnown[packageAmount] = true;
            _packages.push(packageAmount);
        }
        packageActive[packageAmount] = isActive;
        emit PackageActiveUpdated(packageAmount, isActive);
    }

    function _setReferrer(address user, address referrer) private {
        require(user != address(0), "SHDStaking: zero user");
        require(referrer != user, "SHDStaking: self referrer");
        require(referrer == address(0) || !_createsCycle(user, referrer), "SHDStaking: referrer cycle");

        address oldReferrer = referrerOf[user];
        if (oldReferrer == referrer) return;

        if (oldReferrer != address(0)) {
            directCount[oldReferrer] -= 1;
        }
        if (referrer != address(0)) {
            directCount[referrer] += 1;
        }

        referrerOf[user] = referrer;
        emit ReferrerUpdated(user, oldReferrer, referrer);
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
        for (uint256 depth; current != address(0) && depth < MAX_UPLINE_DEPTH; ++depth) {
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
        require(rewardPoolBalance() >= amount, "SHDStaking: insufficient rewards");
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
        for (uint256 depth; current != address(0) && depth < MAX_UPLINE_DEPTH; ++depth) {
            if (current == user) return true;
            current = referrerOf[current];
        }
        return false;
    }
}