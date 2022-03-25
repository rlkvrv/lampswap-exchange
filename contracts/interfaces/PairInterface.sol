// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

interface PairInterface {
    function setRouter(address _router) external;

    function setFee(address _fee) external;

    function getReserve(uint256 index) external view returns (uint256);

    function addLiquidity(
        address recipient,
        uint256 amount0,
        uint256 amount1
    ) external;

    function removeLiquidity(uint256 lpAmount, address recipient) external;

    function calculateAmoutOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut, uint256 tokenOutFee);

    function calculateAmoutIn(
        address tokenIn,
        address tokenOut,
        uint256 amountOut
    ) external view returns (uint256 amountIn, uint256 tokenInFee);

    function swap(
        address _token,
        uint256 _amountIn,
        uint256 _amoutOut,
        address recipient
    ) external;
}
