//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./RegistryInterface.sol";
import "./PairInterface.sol";

contract Router is ReentrancyGuard, Ownable {
    uint256 public swapFee;
    uint256 public protocolPerformanceFee;
    uint256 public feeDecimals;
    address public protocolPerformanceFeeRecipient;
    address public registry;

    constructor(
        uint256 _swapFee,
        uint256 _protocolPerformanceFee,
        address _protocolPerformanceFeeRecipient,
        uint256 _feeDecimals
    ) {
        swapFee = _swapFee;
        protocolPerformanceFee = _protocolPerformanceFee;
        protocolPerformanceFeeRecipient = _protocolPerformanceFeeRecipient;
        feeDecimals = _feeDecimals;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function setFeeParams(
        uint256 _swapFee,
        uint256 _protocolPerformanceFee,
        address _protocolPerformanceFeeRecipient,
        uint256 _feeDecimals
    ) external onlyOwner {
        swapFee = _swapFee;
        protocolPerformanceFee = _protocolPerformanceFee;
        protocolPerformanceFeeRecipient = _protocolPerformanceFeeRecipient;
        feeDecimals = _feeDecimals;
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
        amountOut = Pair.swapIn(tokenIn, tokenOut, amountIn, msg.sender);
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
        amountIn = Pair.swapOut(tokenIn, tokenOut, amountOut, msg.sender);
        // get fee
        require(maxAmountIn >= amountIn);
        // send fee to pair and protocolPerformanceFeeRecipient
    }
}
