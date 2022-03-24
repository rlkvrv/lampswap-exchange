//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./libraries/SafeMath.sol";

contract WETH is ERC20 {
  constructor() ERC20("Wrapped ETH", "WETH") {}

  function wrapped() external payable {
    _mint(msg.sender, msg.value);
  }

  function currentBalance() external view returns (uint) {
    return address(this).balance;
  }

  function unwrapped(address payable _to, uint _amount) external {
    require(address(this).balance >= _amount, "incorrect amount");
    uint amount = address(this).balance - _amount;
    _burn(msg.sender, amount);
    _to.transfer(amount);
  }
}
