//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Pair.sol";

contract Factory {
  mapping (address => mapping(address => address)) public getPair;
  address[] public allPairs;

  function createPair(address tokenA, address tokenB) external returns (address) {
    require(tokenA != tokenB, "Identical addresses");
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), 'UniswapV2: ZERO_ADDRESS');

    Pair pair = new Pair(token0, token1);
    address pairContract = address(pair);

    getPair[token0][token1] = pairContract;
    getPair[token1][token0] = pairContract;
    allPairs.push(pairContract);
    return pairContract;
  }
}