# shd-staking

SHD 生态 DApp，包含 `SHDStaking` 智能合约与 Next.js 前端。本仓库只负责项目方 DApp 侧的 SHD 生态功能：认购/质押、推荐关系、代理等级、运营中心、产品包扣款与商城回调。

SCNY、SHD、DHC 都是已经存在的普通代币；Swap 由公链 DEX 负责，不属于本 DApp。

## 业务口径

### 经济模型

- SHD：发行总量 2 亿个，商合道酒类交易平台数据资产
- DHC：发行总量 10 亿个，帝皇池酱酒数据资产
- SCNY：发行总量 100 亿个，酒类交易平台稳定数据资产，`1 SCNY = 1 CNY`

### SHD 认购/质押

用户质押 SHD 参与子生态模式，支持 90 / 180 / 360 天周期。

静态收益：

- 90 天：日补贴 0.5%
- 180 天：日补贴 1%
- 360 天：日补贴 1.2%
- 订单到期前不能单独领取静态收益，只能提前结算
- 提前结算：静态收益全无，并从本单本金中追扣本单已释放给直接上级的 5% 直推奖励
- 到期结算：返还本金，并结算静态盈利；盈利部分 50% 给用户，另外 50% 转入 `0x000000000000000000000000000000000000dEaD` 销毁

动态收益：

- 直接推荐人获得下级质押数量 5% 的 SHD，一次性释放
- 下级用户提前结算时，合约从该订单本金中追扣本单产生的直推 5%，回补 DApp 资金池

团队极差：

- 根据下级质押数量、质押周期和代理身份计算补贴，并按对应质押天数线性释放
- 90 天订单：命中的区县 / 市 / 省 / 运营中心各按订单金额 3% 生成补贴
- 180 天订单：命中的区县 / 市 / 省 / 运营中心各按订单金额 5% 生成补贴
- 360 天订单：命中的区县 / 市 / 省 / 运营中心各按订单金额 6% 生成补贴
- 区域身份为 `0/1/2/3`：0 普通、1 区县、2 市、3 省
- 运营中心身份为独立布尔值；同一地址可以同时是区域代理和运营中心，因此可以获得两类补贴
- 区域极差从下级的直接上级开始向上追溯，只奖励比已命中区域等级更高的地址；同级和平级以下烧伤，最高追到省级
- 运营中心不参与区域等级比较，独立向上取就近一个运营中心；如果同一地址既是区域代理又是运营中心，可以同时拿区域补贴和运营中心补贴

其他业务口径：

- “盈利的 50% 销毁通缩”发生在订单到期结算时，不是普通交易税；当前 DApp 合约在结算静态盈利时把盈利的 50% 转入 dead 地址
- 原始业务文档里的用户报单换币路径只作为业务背景，DApp 不处理 SCNY 兑换、DOR 数据流通平台或 Swap 交易

### 产品包购买

首页提供 5 个报单数据资产产品包：

- 5000 数据资产产品包
- 1W 数据资产产品包
- 3W 数据资产产品包
- 5W 数据资产产品包
- 10W 数据资产产品包

用户点击产品包后输入手机号和 SN 号，前端发起 DApp 合约调用扣除 SHD。链上扣款成功后，服务端代理把交易哈希、钱包地址、手机号、SN、产品包数量等信息回调给商城 APP，由商城 APP 发放对应权益。

当前合约实现按产品包面额直接扣除对应数量的 SHD。如果后续必须严格按 SHD-SCNY 实时价格换算扣款，需要增加可信价格来源或后端签名报价，避免前端伪造价格。

## 当前实现

核心合约为 [contracts/SHDStaking.sol](contracts/SHDStaking.sol)：

- `shd()` 返回 SHD ERC20 代币地址
- `stake(amount, period)` 认购/质押 SHD，周期为 90 / 180 / 360 天
- `unstake(positionId)` 结算订单；提前结算追扣直推 5%，到期结算执行盈利 50% 销毁
- `getSettlementQuote(positionId)` 查询提前/到期结算预估
- `bindReferrer(referrer)` 用户在个人中心独立绑定上级
- `batchImportUsers(users, referrers, levels, operationCenters)` 管理员后台导入推荐关系、区域等级、运营中心身份
- `purchasePackage(packageAmount, orderRef)` 产品包扣款进 DApp 合约资金池
- `fundRewards(amount)` 管理员授权转账充入收益资金池
- `recoverExcessToken(to, amount)` 管理员提取未锁定余额

资金池模式：

- DApp 合约自身持有 SHD
- 用户认购本金计入 `totalPrincipalLocked`
- 奖励从合约未锁定余额支付
- 管理员可以通过 `fundRewards` 充入奖励，也可以直接向合约地址转账 SHD

前端边界：

- 只配置 DApp 合约地址，不配置 SHD / DHC / SCNY / OrderBook 地址
- SHD 代币地址通过 DApp 合约 `shd()` 读取
- 个人中心负责绑定上级，并展示 DApp 合约持仓记录
- 认购页只检查链上是否已绑定上级，不在认购时传推荐人
- 管理后台只保留 DApp 合约信息、资金池管理、用户关系导入
- OrderBook 是早期临时预购功能，前端不再接入

## 技术栈

- Next.js 16.2 / React 19.2
- Wagmi 3.6 / Viem 2.47
- Hardhat 3.4 / Solidity 0.8.34
- OpenZeppelin Contracts 5.6

## 网络配置

项目运行在 DOR Network：

- RPC URL: `https://rpc.bjwmls.com`
- Chain ID: `6860686`
- Native Token: `DOR`
- Explorer: `https://block.bjwmls.com`

合约编译配置固定为 Solidity `0.8.34`，EVM `cancun`。

## 环境变量

前端只需要配置 DApp 合约地址：

```bash
NEXT_PUBLIC_DAPP_ADDRESS=0xYourDeployedSHDStakingAddress
```

产品包购买成功后的商城回调由服务端代理执行，可选配置：

```bash
MALL_CALLBACK_URL=https://your-mall.example/callback
MALL_CALLBACK_SECRET=optional-shared-secret
```

## ABI 同步

不要手写前端 ABI。执行以下命令会从 artifacts 自动生成 [src/constants/abis/generated.ts](src/constants/abis/generated.ts)：

```bash
pnpm sync:abi
```

常用命令：

```bash
pnpm compile      # hardhat compile + sync:abi
pnpm build        # compile + next build
pnpm exec tsc --noEmit
```

前端合约读写统一使用：

- `DAPP_CONTRACT_ADDRESS` from [src/constants/contracts.ts](src/constants/contracts.ts)
- `DAPP_ABI` / `ERC20_ABI` from [src/constants/abis/generated.ts](src/constants/abis/generated.ts)