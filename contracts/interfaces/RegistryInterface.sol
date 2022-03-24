//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

interface RegistryInterface {
    function setFactory(address _factory) external;

    function setPair(
        address token0,
        address token1,
        address pairAddress
    ) external;

    function getPair(address token0, address token1)
        external
        returns (address pairAddress);

    function allPairsLength() external view returns (uint256);
}
