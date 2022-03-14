//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./libraries/SafeMath.sol";

contract Pair is ERC20, ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    address token0;
    address token1;
    address public router;
    uint256 public reserve0;
    uint256 public reserve1;

    constructor(
        address _token0,
        address _token1,
        address _router
    ) ERC20("LPToken", "LPT") {
        token0 = _token0;
        token1 = _token1;
        router = _router;
    }

    modifier onlyRouter() {
        require(router == msg.sender, "Ownable: caller is not the router");
        _;
    }

    function setRouter(address _router) external onlyOwner {
        router = _router;
    }

    function addLiquidity(
        address coin0,
        address coin1,
        uint256 amount0,
        uint256 amount1
    ) external nonReentrant {
        ERC20 _token0 = ERC20(coin0);
        ERC20 _token1 = ERC20(coin1);
        uint256 liquidity;
        if (reserve0 == 0) {
            _token0.transferFrom(msg.sender, address(this), amount0);
            _token1.transferFrom(msg.sender, address(this), amount1);
            liquidity = amount0.add(amount1);
            _mint(msg.sender, liquidity);
            reserve0 = reserve0.add(amount0);
            reserve1 = reserve1.add(amount1);
        } else {
            uint256 token0Amount = (amount1.mul(reserve0)).div(reserve1);
            uint256 token1Amount = (amount0.mul(reserve1)).div(reserve0);
            require(amount0 >= token0Amount, "Insufficient token0 amount");
            require(amount1 >= token1Amount, "Insufficient token1 amount");
            _token0.transferFrom(msg.sender, address(this), amount0);
            _token1.transferFrom(msg.sender, address(this), amount1);
            uint256 _totalSupply = this.totalSupply();
            liquidity = (_totalSupply.mul(amount0)).div(reserve0);
            _mint(msg.sender, liquidity);
            reserve0 = reserve0.add(amount0);
            reserve1 = reserve1.add(amount1);
        }
    }

    function removeLiquidity(uint256 _amountLP) external nonReentrant {
        require(_amountLP > 0, "Invalid amount");
        ERC20 _token0 = ERC20(token0);
        ERC20 _token1 = ERC20(token1);
        uint256 _totalSupply = this.totalSupply();
        uint256 token0Amount = (reserve0.mul(_amountLP)).div(_totalSupply);
        uint256 token1Amount = (reserve1.mul(_amountLP)).div(_totalSupply);
        _burn(msg.sender, _amountLP);
        _token0.transfer(msg.sender, token0Amount);
        _token1.transfer(msg.sender, token1Amount);
        reserve0 = reserve0.sub(token0Amount);
        reserve1 = reserve1.sub(token1Amount);
    }

    function swapIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external onlyRouter nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "amount too small");
        require(
            tokenIn == token0 || tokenIn == token1,
            "This tokenIn is not found"
        );
        require(
            tokenOut == token0 || tokenOut == token1,
            "This tokenOut is not found"
        );
        amountOut = this.getTokenPrice(tokenIn, amountIn);
    }

    function swapOut(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        address recipient
    ) external onlyRouter nonReentrant returns (uint256 amountIn) {
        amountIn = 0;
    }

    function getTokenPrice(address _token, uint256 _amount)
        external
        view
        returns (uint256)
    {
        require(_amount > 0, "amount too small");
        require(
            _token == token0 || _token == token1,
            "This token is not found"
        );
        if (_token == token0) {
            return _getAmount(_amount, reserve0, reserve1);
        }
        return _getAmount(_amount, reserve1, reserve0);
    }

    function _getAmount(
        uint256 inputAmount,
        uint256 inputReserve,
        uint256 outputReserve
    ) private pure returns (uint256) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");
        uint256 fee = 1;
        uint256 feeDecimals = 2;
        uint256 inputAmountWithFee = inputAmount -
            (inputAmount * fee) /
            10**feeDecimals;
        uint256 numerator = outputReserve * inputAmountWithFee;
        uint256 denominator = inputReserve + inputAmountWithFee;
        return numerator / denominator;
    }
}
