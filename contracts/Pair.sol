//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/PairInterface.sol";
import "./Fee.sol";

contract Pair is PairInterface, ERC20, ReentrancyGuard, Ownable {
    using Address for address;
    using SafeERC20 for ERC20;

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
            tokenIn.isContract() &&
                tokenOut.isContract() &&
                tokenIn != tokenOut,
            "Invalid token address"
        );
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

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amountLP);
    event SetRouter(address router);
    event SetFee(address fee);

    function setRouter(address _router) external override onlyOwner {
        require(_router.isContract(), "Invalid router address");
        router = _router;

        emit SetRouter(_router);
    }

    function setFee(address _fee) external override onlyOwner {
        require(_fee.isContract(), "Invalid fee address");
        fee = _fee;

        emit SetFee(_fee);
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
        require(recipient != address(0), "Invalid recipient address");
        uint256 liquidity;
        if (reserves[0] == 0) {
            liquidity = amount0 + amount1;
            _mint(recipient, liquidity);
            emit Mint(recipient, amount0, amount1);
            reserves[0] = reserves[0] + amount0;
            reserves[1] = reserves[1] + amount1;
        } else {
            uint256 _totalSupply = this.totalSupply();
            liquidity = (_totalSupply * amount0) / reserves[0];
            _mint(recipient, liquidity);
            emit Mint(recipient, amount0, amount1);
            reserves[0] = reserves[0] + amount0;
            reserves[1] = reserves[1] + amount1;
        }
    }

    function removeLiquidity(uint256 _amountLP, address recipient)
        external
        override
        nonReentrant
        onlyRouter
    {
        require(recipient != address(0), "Invalid recipient address");
        require(_amountLP > 0, "Invalid amount");

        uint256 _totalSupply = this.totalSupply();
        uint256 token0Amount = (reserves[0] * _amountLP) / _totalSupply;
        uint256 token1Amount = (reserves[1] * _amountLP) / _totalSupply;
        _burn(recipient, _amountLP);
        emit Burn(recipient, _amountLP);
        ERC20(token0).safeTransfer(recipient, token0Amount);
        ERC20(token1).safeTransfer(recipient, token1Amount);
        reserves[0] = reserves[0] - token0Amount;
        reserves[1] = reserves[1] - token1Amount;
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
        uint256 _swapFee = Fee(fee).swapFee();
        uint256 _feeDecimals = Fee(fee).feeDecimals();
        uint256 _decimals = 10**_feeDecimals;

        if (tokenIn == token0) {
            amountIn =
                (reserves[0] * amountOut * _decimals) /
                ((reserves[1] - amountOut) * (_decimals - _swapFee));
        } else {
            amountIn =
                (reserves[1] * amountOut * _decimals) /
                ((reserves[0] - amountOut) * (_decimals - _swapFee));
        }
    }

    function getTokenPrice(address _token, uint256 _amount)
        external
        view
        override
        returns (uint256)
    {
        require(_amount > 0, "amount too small");
        uint256 _swapFee = Fee(fee).swapFee();
        uint256 _feeDecimals = Fee(fee).feeDecimals();
        uint256 _decimals = 10**_feeDecimals;

        if (_token == token0) {
            return
                (reserves[1] * _amount * (_decimals - _swapFee)) /
                ((reserves[0] + _amount) * _decimals);
        } else {
            return
                (reserves[0] * _amount * (_decimals - _swapFee)) /
                ((reserves[1] + _amount) * _decimals);
        }
    }

    function swap(
        address _token,
        uint256 _amountIn,
        uint256 _amoutOut,
        address recipient
    ) external override onlyRouter {
        require(
            _token != address(0) && recipient != address(0),
            "Invalid address"
        );
        require(_amountIn > 0, "amount too small");

        if (_token == token0) {
            ERC20(token1).safeTransfer(recipient, _amoutOut);

            reserves[0] = reserves[0] + _amountIn;
            reserves[1] = reserves[1] - _amoutOut;
        } else {
            ERC20(token0).safeTransfer(recipient, _amoutOut);

            reserves[1] = reserves[1] + _amountIn;
            reserves[0] = reserves[0] - _amoutOut;
        }
    }
}
