//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./RegistryInterface.sol";
import "./PairInterface.sol";

contract Router is ReentrancyGuard, Ownable {
    address public registry;

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external {
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(token0, token1);
        PairInterface Pair = PairInterface(pair);
        Pair.addLiquidity(token0, token1, amount0, amount1, msg.sender);
    }

    function removeLiquidity(
        address token0,
        address token1,
        uint256 amountLP
    ) external {
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(token0, token1);
        PairInterface Pair = PairInterface(pair);
        Pair.removeLiquidity(amountLP, msg.sender);
    }

    function swapIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(tokenIn, tokenOut);
        PairInterface Pair = PairInterface(pair);
        amountOut = Pair.swapIn(
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut,
            msg.sender
        );
        // get fee
        require(amountOut >= minAmountOut);
        // send fee to pair and protocolPerformanceFeeRecipient
    }

    function swapOut(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 maxAmountIn
    ) external nonReentrant returns (uint256 amountIn) {
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(tokenIn, tokenOut);
        PairInterface Pair = PairInterface(pair);
        amountIn = Pair.swapOut(
            tokenIn,
            tokenOut,
            amountOut,
            maxAmountIn,
            msg.sender
        );
        // get fee
        require(maxAmountIn >= amountIn);
        // send fee to pair and protocolPerformanceFeeRecipient
    }
}
