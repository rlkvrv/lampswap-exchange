//SPDX-License-Identifier: MIT

pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/RegistryInterface.sol";
import "./interfaces/PairInterface.sol";

contract Router is ReentrancyGuard, Ownable {
    using Address for address;

    address public registry;

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

    function setRegistry(address _registry) external onlyOwner {
        require(_registry.isContract(), "Invalid registry address");
        registry = _registry;
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
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(token0, token1);
        PairInterface Pair = PairInterface(pair);

        uint256 _reserve0 = Pair.getReserve(0);
        uint256 _reserve1 = Pair.getReserve(1);
        ERC20 _token0 = ERC20(token0);
        ERC20 _token1 = ERC20(token1);
        if (_reserve0 == 0) {
            _token0.transferFrom(msg.sender, address(pair), amount0);
            _token1.transferFrom(msg.sender, address(pair), amount1);
            Pair.addLiquidity(msg.sender, amount0, amount1);
            emit AddLiquidity(msg.sender, amount0, amount1);
        } else {
            uint256 token0Amount = (amount1 * _reserve0) / _reserve1;
            uint256 token1Amount = (amount0 * _reserve1) / _reserve0;
            require(amount0 >= token0Amount, "Insufficient token0 amount");
            require(amount1 >= token1Amount, "Insufficient token1 amount");
            _token0.transferFrom(msg.sender, address(pair), amount0);
            _token1.transferFrom(msg.sender, address(pair), amount1);
            Pair.addLiquidity(msg.sender, amount0, amount1);
            emit AddLiquidity(msg.sender, amount0, amount1);
        }
    }

    function removeLiquidity(
        address token0,
        address token1,
        uint256 amountLP
    ) external onlyToken(token0, token1) {
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(token0, token1);
        PairInterface Pair = PairInterface(pair);
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
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(tokenIn, tokenOut);
        PairInterface Pair = PairInterface(pair);
        amountOut = Pair.swapIn(tokenIn, tokenOut, amountIn);

        require(amountOut >= minAmountOut, "amountOut less than minAmountOut");
        ERC20 _token0 = ERC20(tokenIn);

        _token0.transferFrom(msg.sender, address(pair), amountIn);
        Pair.swap(tokenIn, amountIn, amountOut, msg.sender);
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
        RegistryInterface Registry = RegistryInterface(registry);
        address pair = Registry.getPair(tokenIn, tokenOut);
        PairInterface Pair = PairInterface(pair);
        amountIn = Pair.swapOut(tokenIn, tokenOut, amountOut);

        require(maxAmountIn >= amountIn, "maxAmountIn less than amountIn");
        ERC20 _token0 = ERC20(tokenIn);

        _token0.transferFrom(msg.sender, address(pair), amountIn);
        Pair.swap(tokenIn, amountIn, amountOut, msg.sender);
        emit Swap(msg.sender, amountIn, amountOut);
    }
}
