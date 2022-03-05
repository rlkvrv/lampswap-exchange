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
  uint public totalSupply;
  
  address public factory;
  address public token0;
  address public token1;

  uint private reserve0; 
  uint private reserve1;

  uint public constant MINIMUM_LIQUIDITY = 10**3;

  constructor(address _token0, address _token1) {
    require(_token0 != address(0) && _token1 != address(0), "INCORRECT ADDRESS");
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

  function createDeposit(uint _amount0, uint _amount1) external {
    LampCoinInterface _token0 = LampCoinInterface(token0);
    LampCoinInterface _token1 = LampCoinInterface(token1);
    uint liquidity;
    if (reserve0 == 0) {
      _token0.transferFrom(msg.sender, address(this), _amount0);
      _token1.transferFrom(msg.sender, address(this), _amount1);
      liquidity = _amount0 + _amount1;
      this.mint(msg.sender, liquidity);
      reserve0 = reserve0.add(_amount0);
      reserve1 = reserve1.add(_amount1);
    } else {
      uint token1Amount = (_amount0 * reserve1) / reserve0;
      require(_amount1 >= token1Amount, "Insufficient token1 amount");
      _token0.transferFrom(msg.sender, address(this), _amount0);
      _token1.transferFrom(msg.sender, address(this), _amount1);
      liquidity = (totalSupply * _amount0) / reserve0;
      this.mint(msg.sender, liquidity);
      reserve0 = reserve0.add(_amount0);
      reserve1 = reserve1.add(_amount1);
    }
  }

  function getReserves() public view returns (uint _reserve0, uint _reserve1) {
      _reserve0 = reserve0;
      _reserve1 = reserve1;
  }

  function getAmount(
    uint256 inputAmount,
    uint256 inputReserve,
    uint256 outputReserve
  ) private pure returns (uint256) {
      require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
      uint inputAmountWithFee = inputAmount * 99;
      uint numerator = inputAmountWithFee * outputReserve;
      uint denominator = (inputReserve * 100) + inputAmountWithFee;
      return numerator / denominator;
  }

  function getTokenPrice(address _token, uint _amount) public view returns (uint) {
    require(_amount > 0, "amount too small");
    require(_token == token0 || _token == token1, "This token is not found");
    if (_token == token0) {
      return getAmount(_amount, reserve0, reserve1);
    }
    return getAmount(_amount, reserve1, reserve0);
  }

  function swap(address _token, uint _amount) external {
    require(_amount > 0, "amount too small");
    require(_token == token0 || _token == token1, "This token is not found");
    LampCoinInterface _token0 = LampCoinInterface(token0);
    LampCoinInterface _token1 = LampCoinInterface(token1);
    if (_token == token0) {
      uint _token1Bought = getAmount(_amount, reserve0, reserve1);
      _token0.transferFrom(msg.sender, address(this), _amount);
      _token1.transfer(msg.sender, _token1Bought);

      reserve0 = reserve0.add(_amount);
      reserve1 = reserve1.sub(_token1Bought);
    } else {
      uint _token0Bought = getAmount(_amount, reserve1, reserve0);
      _token1.transferFrom(msg.sender, address(this), _amount);
      _token0.transfer(msg.sender, _token0Bought);

      reserve1 = reserve1.add(_amount);
      reserve0 = reserve0.sub(_token0Bought);
    }
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