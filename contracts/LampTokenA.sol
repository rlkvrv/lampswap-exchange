//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LampTokenA is ERC20 {
  constructor(uint amount) ERC20("LampTokenA", "LTA") {
    _mint(msg.sender, amount);
  }
}
