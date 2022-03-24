//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/FeeInterface.sol";

contract Fee is FeeInterface, Ownable {
    uint256 private swapFee;
    uint256 private protocolPerformanceFee;
    uint256 private feeDecimals;

    constructor(
        uint256 _swapFee,
        uint256 _protocolPerformanceFee,
        uint256 _feeDecimals
    ) {
        swapFee = _swapFee;
        protocolPerformanceFee = _protocolPerformanceFee;
        feeDecimals = _feeDecimals;
    }

    function setFeeParams(
        uint256 _swapFee,
        uint256 _protocolPerformanceFee,
        uint256 _feeDecimals
    ) external override onlyOwner {
        swapFee = _swapFee;
        protocolPerformanceFee = _protocolPerformanceFee;
        feeDecimals = _feeDecimals;
    }

    function getSwapFee() external view override returns (uint256) {
        return swapFee;
    }

    function getProtocolPerformanceFee()
        external
        view
        override
        returns (uint256)
    {
        return protocolPerformanceFee;
    }

    function getFeeDecimals() external view override returns (uint256) {
        return feeDecimals;
    }
}
