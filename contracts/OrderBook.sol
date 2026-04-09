// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrderBook
 * @notice 管理员拨币订单簿：管理员为用户添加/更新链上订单，用户可读取自己的订单。
 */
contract OrderBook {
    address public admin;

    struct Order {
        uint256 id;           // 订单编号（从1开始）
        uint256 principal;    // 质押本金（18位精度）
        uint256 totalReward;  // 总收益（18位精度）
        uint256 claimed;      // 已领取（18位精度）
        uint256 nextRelease;  // 下一次释放时间（Unix 时间戳）
        uint256 duration;     // 锁定天数
        uint8  status;        // 0=锁仓中 1=已解锁 2=已完成
        string remark;        // 备注
    }

    mapping(address => Order[]) private _orders;

    event OrderAdded(address indexed user, uint256 indexed id);
    event OrderUpdated(address indexed user, uint256 indexed index);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "OrderBook: not admin");
        _;
    }

    /// @notice 为用户添加一条订单
    function addOrder(
        address user,
        uint256 principal,
        uint256 totalReward,
        uint256 nextRelease,
        uint256 duration,
        uint8  status,
        string calldata remark
    ) external onlyAdmin {
        uint256 newId = _orders[user].length + 1;
        _orders[user].push(Order({
            id:          newId,
            principal:   principal,
            totalReward: totalReward,
            claimed:     0,
            nextRelease: nextRelease,
            duration:    duration,
            status:      status,
            remark:      remark
        }));
        emit OrderAdded(user, newId);
    }

    /// @notice 修改已有订单（按数组下标）
    function updateOrder(
        address user,
        uint256 index,
        uint256 principal,
        uint256 totalReward,
        uint256 claimed,
        uint256 nextRelease,
        uint256 duration,
        uint8  status,
        string calldata remark
    ) external onlyAdmin {
        require(index < _orders[user].length, "OrderBook: index out of bounds");
        Order storage o = _orders[user][index];
        o.principal   = principal;
        o.totalReward = totalReward;
        o.claimed     = claimed;
        o.nextRelease = nextRelease;
        o.duration    = duration;
        o.status      = status;
        o.remark      = remark;
        emit OrderUpdated(user, index);
    }

    /// @notice 读取某用户的全部订单
    function getOrders(address user) external view returns (Order[] memory) {
        return _orders[user];
    }

    /// @notice 转移管理员权限
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "OrderBook: zero address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }
}
