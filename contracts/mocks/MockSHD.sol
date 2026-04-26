// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockSHD is ERC20 {
    constructor(address initialHolder, uint256 initialSupply) ERC20("Mock SHD", "SHD") {
        _mint(initialHolder, initialSupply);
    }
}