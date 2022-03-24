// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

interface PairInterface {
    function setRouter(address _router) external;

    function setFee(address _fee) external;

    function getReserve(uint index) external view returns (uint256);

    function addLiquidity(
        address recipient,
        uint256 amount0,
        uint256 amount1
    ) external;

    function removeLiquidity(uint256 lpAmount, address recipient) external;

    function swapIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256 amountOut);

    function swapOut(
        address tokenIn,
        address tokenOut,
        uint256 amountOut
    ) external returns (uint256 amountIn);

    function getTokenPrice(address _token, uint256 _amount)
        external
        view
        returns (uint256);

    function swap(
        address _token,
        uint256 _amountIn,
        uint256 _amoutOut,
        address recipient
    ) external;
}
