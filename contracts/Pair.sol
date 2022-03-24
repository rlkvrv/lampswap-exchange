//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/PairInterface.sol";
import "./interfaces/FeeInterface.sol";
import "./libraries/SafeMath.sol";

contract Pair is PairInterface, ERC20, ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    address token0;
    address token1;
    address public router;
    address public fee;
    uint256[2] public reserves;

    constructor(
        address _token0,
        address _token1,
        address _router,
        address _fee
    ) ERC20("LPToken", "LPT") {
        token0 = _token0;
        token1 = _token1;
        router = _router;
        fee = _fee;
    }

    modifier onlyRouter() {
        require(router == msg.sender, "Ownable: caller is not the router");
        _;
    }

    modifier onlyToken(address tokenIn, address tokenOut) {
        require(
            tokenIn == token0 || tokenIn == token1,
            "This tokenIn is not found"
        );
        require(
            tokenOut == token0 || tokenOut == token1,
            "This tokenOut is not found"
        );
        _;
    }

    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amountLP);

    function setRouter(address _router) external override onlyOwner {
        router = _router;
    }

    function setFee(address _fee) external override onlyOwner {
        fee = _fee;
    }

    function getReserve(uint256 index)
        external
        view
        override
        returns (uint256)
    {
        return reserves[index];
    }

    function addLiquidity(
        address recipient,
        uint256 amount0,
        uint256 amount1
    ) external override nonReentrant onlyRouter {
        uint256 liquidity;
        if (reserves[0] == 0) {
            liquidity = amount0.add(amount1);
            _mint(recipient, liquidity);
            emit Mint(recipient, amount0, amount1);
            reserves[0] = reserves[0].add(amount0);
            reserves[1] = reserves[1].add(amount1);
        } else {
            uint256 _totalSupply = this.totalSupply();
            liquidity = (_totalSupply.mul(amount0)).div(reserves[0]);
            _mint(recipient, liquidity);
            emit Mint(recipient, amount0, amount1);
            reserves[0] = reserves[0].add(amount0);
            reserves[1] = reserves[1].add(amount1);
        }
    }

    function removeLiquidity(uint256 _amountLP, address recipient)
        external
        override
        nonReentrant
        onlyRouter
    {
        require(_amountLP > 0, "Invalid amount");
        ERC20 _token0 = ERC20(token0);
        ERC20 _token1 = ERC20(token1);
        uint256 _totalSupply = this.totalSupply();
        uint256 token0Amount = (reserves[0].mul(_amountLP)).div(_totalSupply);
        uint256 token1Amount = (reserves[1].mul(_amountLP)).div(_totalSupply);
        _burn(recipient, _amountLP);
        emit Burn(recipient, _amountLP);
        _token0.transfer(recipient, token0Amount);
        _token1.transfer(recipient, token1Amount);
        reserves[0] = reserves[0].sub(token0Amount);
        reserves[1] = reserves[1].sub(token1Amount);
    }

    function swapIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    )
        external
        override
        onlyToken(tokenIn, tokenOut)
        onlyRouter
        nonReentrant
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "amount too small");
        amountOut = this.getTokenPrice(tokenIn, amountIn);
    }

    function swapOut(
        address tokenIn,
        address tokenOut,
        uint256 amountOut
    )
        external
        override
        onlyToken(tokenIn, tokenOut)
        onlyRouter
        nonReentrant
        returns (uint256 amountIn)
    {
        require(amountOut > 0, "amount too small");
        FeeInterface _fee = FeeInterface(fee);
        uint256 _swapFee = _fee.getSwapFee();
        uint256 _feeDecimals = _fee.getFeeDecimals();
        uint256 _decimals = 10**_feeDecimals;

        if (tokenIn == token0) {
            amountIn =
                (reserves[0].mul(amountOut).mul(_decimals)) /
                ((reserves[1].sub(amountOut)).mul((_decimals).sub(_swapFee)));
        } else {
            amountIn =
                (reserves[1].mul(amountOut).mul(_decimals)) /
                ((reserves[0].sub(amountOut)).mul((_decimals).sub(_swapFee)));
        }
    }

    function getTokenPrice(address _token, uint256 _amount)
        external
        view
        override
        returns (uint256)
    {
        require(_amount > 0, "amount too small");
        FeeInterface _fee = FeeInterface(fee);
        uint256 _swapFee = _fee.getSwapFee();
        uint256 _feeDecimals = _fee.getFeeDecimals();
        uint256 _decimals = 10**_feeDecimals;

        if (_token == token0) {
            return
                (reserves[1].mul(_amount).mul((_decimals).sub(_swapFee))) /
                ((reserves[0].add(_amount)).mul(_decimals));
        } else {
            return
                (reserves[0].mul(_amount).mul((_decimals).sub(_swapFee))) /
                ((reserves[1].add(_amount)).mul(_decimals));
        }
    }

    function swap(
        address _token,
        uint256 _amountIn,
        uint256 _amoutOut,
        address recipient
    ) external override onlyRouter {
        require(_amountIn > 0, "amount too small");
        ERC20 _token0 = ERC20(token0);
        ERC20 _token1 = ERC20(token1);
        if (_token == token0) {
            _token1.transfer(recipient, _amoutOut);

            reserves[0] = reserves[0].add(_amountIn);
            reserves[1] = reserves[1].sub(_amoutOut);
        } else {
            _token0.transfer(recipient, _amoutOut);

            reserves[1] = reserves[1].add(_amountIn);
            reserves[0] = reserves[0].sub(_amoutOut);
        }
    }
}
