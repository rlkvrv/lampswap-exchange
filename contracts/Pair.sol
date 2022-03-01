//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./libraries/SafeMath.sol";
import "./LampCoinInterface.sol";

contract Pair {
  using SafeMath for uint;

  string public constant name = "LPToken"; 
  string public constant symbol = "LPT";
  uint8 public constant decimals = 18;
  uint public totalSupply = 10 ** decimals;
  
  address public factory;
  address public token0;
  address public token1;

  uint112 private reserve0;         
  uint112 private reserve1;

  constructor(address _token0, address _token1) {
    factory = msg.sender;
    token0 = _token0;
    token1 = _token1;
  }

  mapping (address => mapping (address => uint256)) allowed;
  mapping (address => uint256) coinBalances;

  event Transfer(address indexed _from, address indexed _to, uint256 _value);
  event Approval(address indexed _owner, address indexed _spender, uint256 _value);
  event PairCreated(address indexed token0, address indexed token1, address pair, uint);
  event Mint(address indexed sender, uint amount0, uint amount1);

  modifier receiverOverflow(address _to, uint _value) {
    require(coinBalances[_to] + _value >= coinBalances[_to], "Recipient's wallet overflow");
    _;
  }

  modifier checkBalance(address _sender, uint _value) {
    require(coinBalances[_sender] >= _value, "Insufficient funds from the sender");
    _;
  }

  function create() external view returns (address){
    return address(this);
  }

  function createDeposit(address _owner, uint _amount0) external {
    LampCoinInterface _token = LampCoinInterface(token0);
    _token.transferFrom(_owner, address(this), _amount0);
  }

  function mint(address _to, uint256 _amount) external {
    coinBalances[_to] = coinBalances[_to].add(_amount);
    totalSupply = totalSupply.add(_amount);
    emit Transfer(msg.sender, _to, _amount);
  }

  function burn(address _from, uint256 _amount) private {
    coinBalances[_from] = coinBalances[_from].sub(_amount);
    totalSupply = totalSupply.sub(_amount);
    emit Transfer(msg.sender, _from, _amount);
  }

  function balanceOf(address _owner) external view returns (uint256 balance) {
      return coinBalances[_owner];
  }

  function allowance(address _owner, address _spender) external view returns (uint256 remaining) {
        return allowed[_owner][_spender];
  }

  function transfer(
    address _to,
    uint256 _value
  ) 
    external
    receiverOverflow(_to, _value)
    checkBalance(msg.sender, _value)
    returns (bool success)
  {
    coinBalances[msg.sender] -= _value;
    coinBalances[_to] += _value;

    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(
    address _from,
    address _to,
    uint256 _value
  )
    external
    receiverOverflow(_to, _value)
    checkBalance(_from, _value)
    returns (bool success)
  {
      require(allowed[_from][msg.sender] >= _value, "Ask for permission to transfer the required number of LPT");

      coinBalances[_from] -= _value;
      coinBalances[_to] += _value;
      allowed[_from][msg.sender] -= _value;

      emit Transfer(_from, _to, _value);
      return true;
  }

  function approve(address _spender, uint256 _value) external returns (bool success) {
      allowed[msg.sender][_spender] = _value;

      emit Approval(msg.sender, _spender, _value);
      return true;
  }
}