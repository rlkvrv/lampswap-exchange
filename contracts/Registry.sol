//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/RegistryInterface.sol";

contract Registry is RegistryInterface, Ownable {
    using Address for address;

    address public factory;
    address[] public allPairs;

    mapping(address => mapping(address => address)) public getPairAddress;

    modifier onlyFactory() {
        require(msg.sender == address(factory), "Only factory");
        _;
    }

    event SetFactory(address factory);
    event SetPair(address token0, address token1, address pair);

    function setFactory(address _factory) external override onlyOwner {
        require(_factory.isContract(), "Invalid factory address");
        factory = _factory;

        emit SetFactory(_factory);
    }

    function setPair(
        address token0,
        address token1,
        address pairAddress
    ) external override onlyFactory {
        getPairAddress[token0][token1] = pairAddress;
        getPairAddress[token1][token0] = pairAddress;
        allPairs.push(pairAddress);

        emit SetPair(token0, token1, pairAddress);
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
