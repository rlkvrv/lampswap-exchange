//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/RegistryInterface.sol";
import "./Pair.sol";

contract Factory is Ownable {
    using Address for address;

    address public router;
    address public registry;
    address public fee;

    function setRouter(address _router) external onlyOwner {
        require(_router.isContract(), "Invalid router address");
        router = _router;
    }

    function setRegistry(address _registry) external onlyOwner {
        require(_registry.isContract(), "Invalid registry address");
        registry = _registry;
    }

    function setFee(address _fee) external onlyOwner {
        require(_fee.isContract(), "Invalid fee address");
        fee = _fee;
    }

    function createPair(address token0, address token1) external {
        require(
            token0.isContract() && token1.isContract() && token0 != token1,
            "Invalid token address"
        );
        Pair pair = new Pair(token0, token1, router, fee);
        RegistryInterface _registry = RegistryInterface(registry);
        pair.transferOwnership(msg.sender);
        _registry.setPair(token0, token1, address(pair));
    }
}
