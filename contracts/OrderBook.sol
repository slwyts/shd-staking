// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrderBook
 * @notice Mini 版拨币订单簿：管理员录入（用户地址、SHD 数量、锁仓天数），
 *         合约自动记录创建时间，到期后一次性释放。
 */
contract OrderBook {
    address public admin;
    uint8 public constant ORDER_TYPE_PRIVATE_PLACEMENT = 0;

    struct Order {
        uint256 id;          // 订单编号（从1开始）
        uint8 orderType;     // 订单类型：0=私募锁仓
        uint256 amount;      // SHD 数量（18位精度）
        uint256 lockDays;    // 锁仓天数
        uint256 createdAt;   // 创建时间（Unix 时间戳，合约自动填写）
    }

    mapping(address => Order[]) private _orders;

    event OrderAdded(address indexed user, uint256 indexed id);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "OrderBook: not admin");
        _;
    }

    /// @notice 为用户添加一条锁仓订单
    function addOrder(
        address user,
        uint8 orderType,
        uint256 amount,
        uint256 lockDays
    ) external onlyAdmin {
        require(orderType == ORDER_TYPE_PRIVATE_PLACEMENT, "OrderBook: unsupported order type");
        require(amount > 0, "OrderBook: zero amount");
        require(lockDays > 0, "OrderBook: zero lock days");
        uint256 newId = _orders[user].length + 1;
        _orders[user].push(Order({
            id:        newId,
            orderType: orderType,
            amount:    amount,
            lockDays:  lockDays,
            createdAt: block.timestamp
        }));
        emit OrderAdded(user, newId);
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
