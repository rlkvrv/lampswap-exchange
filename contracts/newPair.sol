//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./libraries/SafeMath.sol";

contract newPair is ERC20, ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    address public router;
    uint256 public reserve0;
    uint256 public reserve1;

    constructor(
        address token0,
        address token1,
        address _router
    ) ERC20("LPToken", "LPT") {
        router = _router;
    }

    function setRouter(address _router) external onlyOwner {
        router = _router;
    }

    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external nonReentrant {
        ERC20 _token0 = ERC20(token0);
        ERC20 _token1 = ERC20(token1);
        uint256 liquidity;
        if (reserve0 == 0) {
            _token0.transferFrom(msg.sender, address(this), amount0);
            _token1.transferFrom(msg.sender, address(this), amount1);
            liquidity = amount0.add(amount1);
            _mint(msg.sender, liquidity);
            reserve0 = reserve0.add(amount0);
            reserve1 = reserve1.add(amount1);
        } else {
            uint256 token0Amount = (amount1.mul(reserve0)).div(reserve1);
            uint256 token1Amount = (amount0.mul(reserve1)).div(reserve0);
            require(amount0 >= token0Amount, "Insufficient token0 amount");
            require(amount1 >= token1Amount, "Insufficient token1 amount");
            _token0.transferFrom(msg.sender, address(this), amount0);
            _token1.transferFrom(msg.sender, address(this), amount1);
            uint256 _totalSupply = this.totalSupply();
            liquidity = (_totalSupply.mul(amount0)).div(reserve0);
            _mint(msg.sender, liquidity);
            reserve0 = reserve0.add(amount0);
            reserve1 = reserve1.add(amount1);
        }
    }
}
