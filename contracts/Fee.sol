//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Fee is Ownable {
    uint256 public swapFee;
    uint256 public protocolPerformanceFee;
    uint256 public feeDecimals;

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
    ) external onlyOwner {
        swapFee = _swapFee;
        protocolPerformanceFee = _protocolPerformanceFee;
        feeDecimals = _feeDecimals;
    }
}
