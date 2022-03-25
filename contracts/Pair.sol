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
        _;
    }

    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amountLP);
    event SetRouter(address router);
    event SetFee(address fee);
    event UpdateReserves(uint256 reserve0, uint256 reserve1);

    function _updateReserves() private {
        reserves[0] = ERC20(token0).balanceOf(address(this));
        reserves[1] = ERC20(token1).balanceOf(address(this));

        emit UpdateReserves(reserves[0], reserves[1]);
    }

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
            _updateReserves();
        } else {
            uint256 _totalSupply = this.totalSupply();
            liquidity = (_totalSupply * amount0) / reserves[0];
            _mint(recipient, liquidity);
            emit Mint(recipient, amount0, amount1);
            _updateReserves();
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
        _updateReserves();
    }

    function calculateAmoutOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    )
        external
        view
        override
        onlyToken(tokenIn, tokenOut)
        returns (uint256 amountOut, uint256 tokenOutFee)
    {
        require(amountIn > 0, "Amount too small");
        uint256 amountOutWithFee;
        uint256 _swapFee = Fee(fee).swapFee();
        uint256 _feeDecimals = Fee(fee).feeDecimals();
        uint256 _decimals = 10**_feeDecimals;

        uint256 reserveIn = tokenIn == token0 ? reserves[0] : reserves[1];
        uint256 reserveOut = tokenIn == token0 ? reserves[1] : reserves[0];

        amountOut = (reserveOut * amountIn) / (reserveIn + amountIn);
        amountOutWithFee =
            (reserveOut * amountIn * (_decimals - _swapFee)) /
            ((reserveIn + amountIn) * _decimals);
        tokenOutFee = amountOut - amountOutWithFee;
    }

    function calculateAmoutIn(
        address tokenIn,
        address tokenOut,
        uint256 amountOut
    )
        external
        view
        override
        onlyToken(tokenIn, tokenOut)
        returns (uint256 amountIn, uint256 tokenInFee)
    {
        require(amountOut > 0, "Amount too small");
        uint256 amountInWithFee;
        uint256 _swapFee = Fee(fee).swapFee();
        uint256 _feeDecimals = Fee(fee).feeDecimals();
        uint256 _decimals = 10**_feeDecimals;

        uint256 reserveIn = tokenIn == token0 ? reserves[0] : reserves[1];
        uint256 reserveOut = tokenIn == token0 ? reserves[1] : reserves[0];

        amountIn = (reserveIn * amountOut) / (reserveOut - amountOut);
        amountInWithFee =
            (reserveIn * amountOut * _decimals) /
            ((reserveOut - amountOut) * (_decimals - _swapFee));
        tokenInFee = amountInWithFee - amountIn;
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address tokenFee,
        uint256 totalFee,
        address recipient
    ) external override onlyRouter onlyToken(tokenIn, tokenOut) {
        bool isToken0 = tokenIn == token0;
        uint256 reserveIn = isToken0 ? reserves[0] : reserves[1];
        address outputToken = isToken0 ? token1 : token0;

        uint256 performanceFee = (totalFee *
            (10**Fee(fee).feeDecimals() - Fee(fee).protocolPerformanceFee())) /
            10**Fee(fee).feeDecimals();

        if (tokenFee == tokenOut) {
            require(
                ERC20(tokenIn).balanceOf(address(this)) - reserveIn == amountIn
            );
            ERC20(outputToken).safeTransfer(recipient, amountOut - totalFee);
            ERC20(outputToken).safeTransfer(fee, performanceFee);

            _updateReserves();
        } else {
            require(
                ERC20(tokenIn).balanceOf(address(this)) - reserveIn ==
                    (amountIn + totalFee)
            );
            ERC20(outputToken).safeTransfer(recipient, amountOut);
            ERC20(outputToken).safeTransfer(fee, performanceFee);

            _updateReserves();
        }
    }
}
