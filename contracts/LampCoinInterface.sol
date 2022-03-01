// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface LampCoinInterface {
    function name() external view returns(bytes32);
    function symbol() external view returns (bytes16);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);

    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
}