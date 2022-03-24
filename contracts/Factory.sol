//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/RegistryInterface.sol";
import "./Pair.sol";

contract Factory is Ownable {
    address public router;
    address public registry;
    address public fee;

    function setRouter(address _router) external onlyOwner {
        router = _router;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = _registry;
    }

    function setFee(address _fee) external onlyOwner {
        fee = _fee;
    }

    function createPair(address token0, address token1) external {
        Pair pair = new Pair(token0, token1, router, fee);
        RegistryInterface _registry = RegistryInterface(registry);
        pair.transferOwnership(msg.sender);
        _registry.setPair(token0, token1, address(pair));
    }
}
