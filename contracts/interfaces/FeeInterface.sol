//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface FeeInterface {
    function setFeeParams(
        uint256 _swapFee,
        uint256 _protocolPerformanceFee,
        uint256 _feeDecimals
    ) external;

    function getSwapFee() external view returns (uint256);
    function getProtocolPerformanceFee() external view returns (uint256);
    function getFeeDecimals() external view returns (uint256);
}
