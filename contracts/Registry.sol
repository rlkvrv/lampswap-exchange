//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RegistryInterface.sol";

contract Registry is RegistryInterface, Ownable {
    address public fabric;
    address[] public allPairs;

    mapping(address => mapping(address => address)) public getPairAddress;

    modifier onlyFabric() {
        require(msg.sender == address(fabric), "Only fabric");
        _;
    }

    function setFabric(address _fabric) external override onlyOwner {
        fabric = _fabric;
    }

    function setPair(
        address token0,
        address token1,
        address pairAddress
    ) external override onlyFabric {
        getPairAddress[token0][token1] = pairAddress;
        getPairAddress[token1][token0] = pairAddress;
    }

    function getPair(address token0, address token1)
        external
        view
        override
        returns (address pairAddress)
    {
        pairAddress = getPairAddress[token0][token1];
    }
}
