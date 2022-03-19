//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LampTokenB is ERC20 {
  constructor(uint amount) ERC20("LampTokenB", "LTB") {
    _mint(msg.sender, amount);
  }
}