// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface PairInterface {
    function setRouter(address _router) external;

    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external;

    function removeLiquidity(uint256 lpAmount) external;

    function swapIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external returns (uint256 amountOut);

    function swapOut(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        address recipient
    ) external returns (uint256 amountIn);
}