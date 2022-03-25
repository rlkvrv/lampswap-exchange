//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/RegistryInterface.sol";
import "./interfaces/PairInterface.sol";

contract Router is ReentrancyGuard, Ownable {
    using Address for address;
    using SafeERC20 for ERC20;

    RegistryInterface registry;

    modifier onlyToken(address tokenIn, address tokenOut) {
        require(
            tokenIn.isContract() &&
                tokenOut.isContract() &&
                tokenIn != tokenOut,
            "Invalid token address"
        );
        _;
    }

    event Swap(address indexed sender, uint256 amountIn, uint256 amountOut);
    event AddLiquidity(
        address indexed sender,
        uint256 amount0,
        uint256 amount1
    );
    event RemoveLiquidity(address indexed sender, uint256 amountLP);
    event SetRegistry(address registry);

    function setRegistry(address _registry) external onlyOwner {
        require(_registry.isContract(), "Invalid registry address");
        registry = RegistryInterface(_registry);

        emit SetRegistry(_registry);
    }

    function addLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external {
        require(
            token0.isContract() && token1.isContract() && token0 != token1,
            "Invalid token address"
        );
        PairInterface Pair = PairInterface(registry.getPair(token0, token1));

        uint256 _reserve0 = Pair.getReserve(0);
        uint256 _reserve1 = Pair.getReserve(1);

        if (_reserve0 == 0) {
            ERC20(token0).safeTransferFrom(msg.sender, address(Pair), amount0);
            ERC20(token1).safeTransferFrom(msg.sender, address(Pair), amount1);
            Pair.addLiquidity(msg.sender, amount0, amount1);

            emit AddLiquidity(msg.sender, amount0, amount1);
        } else {
            uint256 token0Amount = (amount1 * _reserve0) / _reserve1;
            uint256 token1Amount = (amount0 * _reserve1) / _reserve0;
            require(amount0 >= token0Amount, "Insufficient token0 amount");
            require(amount1 >= token1Amount, "Insufficient token1 amount");
            ERC20(token0).safeTransferFrom(msg.sender, address(Pair), amount0);
            ERC20(token1).safeTransferFrom(msg.sender, address(Pair), amount1);
            Pair.addLiquidity(msg.sender, amount0, amount1);

            emit AddLiquidity(msg.sender, amount0, amount1);
        }
    }

    function removeLiquidity(
        address token0,
        address token1,
        uint256 amountLP
    ) external onlyToken(token0, token1) {
        PairInterface Pair = PairInterface(registry.getPair(token0, token1));
        Pair.removeLiquidity(amountLP, msg.sender);

        emit RemoveLiquidity(msg.sender, amountLP);
    }

    function swapIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    )
        external
        nonReentrant
        onlyToken(tokenIn, tokenOut)
        returns (uint256 amountOut)
    {
        PairInterface Pair = PairInterface(registry.getPair(tokenIn, tokenOut));
        uint256 tokenOutFee;
        (amountOut, tokenOutFee) = Pair.calculateAmoutOut(
            tokenIn,
            tokenOut,
            amountIn
        );

        require(
            (amountOut - tokenOutFee) >= minAmountOut,
            "amountOut less than minAmountOut"
        );
        ERC20(tokenIn).safeTransferFrom(msg.sender, address(Pair), amountIn);
        Pair.swap(
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            tokenOut,
            tokenOutFee,
            msg.sender
        );

        emit Swap(msg.sender, amountIn, amountOut);
    }

    function swapOut(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 maxAmountIn
    )
        external
        nonReentrant
        onlyToken(tokenIn, tokenOut)
        returns (uint256 amountIn)
    {
        PairInterface Pair = PairInterface(registry.getPair(tokenIn, tokenOut));
        uint256 tokenInFee;
        (amountIn, tokenInFee) = Pair.calculateAmoutIn(
            tokenIn,
            tokenOut,
            amountOut
        );

        require(
            maxAmountIn >= (amountIn + tokenInFee),
            "maxAmountIn less than amountIn"
        );
        ERC20(tokenIn).safeTransferFrom(
            msg.sender,
            address(Pair),
            (amountIn + tokenInFee)
        );
        Pair.swap(
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            tokenIn,
            tokenInFee,
            msg.sender
        );

        emit Swap(msg.sender, amountIn, amountOut);
    }
}
