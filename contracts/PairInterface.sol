// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface PairInterface {
    function createDeposit(uint256 _amount0, uint256 _amount1) external;

    function removeLiquidity(uint256 _amountLP) external;

    function getReserves()
        external
        view
        returns (uint256 _reserve0, uint256 _reserve1);

    function getTokenPrice(address _token, uint256 _amount)
        external
        view
        returns (uint256);

    function swap(address _token, uint256 _amount) external;

    function balanceOf(address _owner) external view returns (uint256 balance);

    function allowance(address _owner, address _spender)
        external
        view
        returns (uint256 remaining);

    function transfer(address _to, uint256 _value)
        external
        returns (bool success);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool success);

    function approve(address _spender, uint256 _value)
        external
        returns (bool success);
}
