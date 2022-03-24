// SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "./interfaces/LampCoinInterface.sol";

contract LampCoin is LampCoinInterface {
    constructor (uint256 _amount) {
        mint(msg.sender, _amount);
    }

    bytes32 private _name = "LampCoin";
    bytes16 private _symbol  = "LCT";
    uint8 private _decimals = 18;

    uint256 coinTotalSupply;
    mapping (address => uint256) coinBalances;
    mapping (address => mapping (address => uint256)) allowed;
    
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    modifier receiverOverflow(address _to, uint _value) {
        require(_to != address(0), "Invalid recipient address");
        require(coinBalances[_to] + _value >= coinBalances[_to], "Recipient's wallet overflow");
        _;
    }

    modifier checkBalance(address _sender, uint _value) {
        require(_sender != address(0), "Invalid sender address");
        require(coinBalances[_sender] >= _value, "Insufficient funds from the sender");
        _;
    }

    function mint(address _to, uint256 _amount) private {
        require(coinTotalSupply + _amount >= coinTotalSupply);
        require(coinBalances[_to] + _amount >= coinBalances[_to]);

        coinBalances[_to] += _amount;
        coinTotalSupply += _amount;
    }
    
    function name() public override view returns (bytes32) { return _name; }

    function symbol() public override view returns (bytes16) { return _symbol; }

    function decimals() public override view returns (uint8) { return _decimals; }

    function totalSupply() public override view returns (uint) {
        return coinTotalSupply;
    }

    function balanceOf(address _owner) public override view returns (uint256 balance) {
        return coinBalances[_owner];
    }

    function allowance(address _owner, address _spender) public override view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    function transfer(
        address _to,
        uint256 _value
    ) 
        public
        override
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
        public
        override
        receiverOverflow(_to, _value)
        checkBalance(_from, _value)
        returns (bool success)
    {
        require(allowed[_from][msg.sender] >= _value, "Ask for permission to transfer the required number of LCT");

        coinBalances[_from] -= _value;
        coinBalances[_to] += _value;
        allowed[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public override returns (bool success) {
        allowed[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }
}
