//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface RegistryInterface {
    function setFabric(address _fabric) external;

    function setPair(
        address token0,
        address token1,
        address pairAddress
    ) external;

    function getPair(address token0, address token1)
        external
        returns (address pairAddress);
}