// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface PairInterface {
    function setRouter(address _router) external;

    function setFee(address _fee) external;

    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1,
        address recipient
    ) external;

    function removeLiquidity(uint256 lpAmount, address recipient) external;

    function swapIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut);

    function swapOut(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 maxAmountIn,
        address recipient
    ) external returns (uint256 amountIn);

    function getTokenPrice(address _token, uint256 _amount)
        external
        view
        returns (uint256);
}
