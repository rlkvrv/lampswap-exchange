//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/RegistryInterface.sol";

contract Registry is RegistryInterface, Ownable {
    address public factory;
    address[] public allPairs;

    mapping(address => mapping(address => address)) public getPairAddress;

    modifier onlyFactory() {
        require(msg.sender == address(factory), "Only factory");
        _;
    }

    function setFactory(address _factory) external override onlyOwner {
        factory = _factory;
    }

    function setPair(
        address token0,
        address token1,
        address pairAddress
    ) external override onlyFactory {
        getPairAddress[token0][token1] = pairAddress;
        getPairAddress[token1][token0] = pairAddress;
        allPairs.push(pairAddress);
    }

    function getPair(address token0, address token1)
        external
        view
        override
        returns (address pairAddress)
    {
        pairAddress = getPairAddress[token0][token1];
    }

    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }
}
