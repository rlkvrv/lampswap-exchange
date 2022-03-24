const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);

const routerAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const registryAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'

const tokenA_address = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'
const tokenB_address = '0x610178dA211FEF7D417bC0e6FeD39F05609AD788'

// удаляем ликвидность

async function main() {
  const [signer] = await ethers.getSigners();

  const Token = require("../artifacts/contracts/ERC20Token.sol/ERC20Token.json");
  const tokenA = new ethers.Contract(tokenA_address, Token.abi, signer);
  const tokenB = new ethers.Contract(tokenB_address, Token.abi, signer);

  const Router = require("../artifacts/contracts/Router.sol/Router.json");
  const router = new ethers.Contract(routerAddress, Router.abi, signer);

  //===========================
  await router.removeLiquidity(tokenA.address, tokenB.address, 300n * DECIMALS);
  //===========================

  const Registry = require("../artifacts/contracts/Registry.sol/Registry.json");
  const registry = new ethers.Contract(registryAddress, Registry.abi, signer);

  const pairAddress = await registry.getPair(tokenA.address, tokenB.address);
  const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
  const pair = new ethers.Contract(pairAddress, Pair.abi, signer);

  console.log('\nBALANCE tokenA: ', await tokenA.balanceOf(signer.address));
  console.log('BALANCE tokenB: ', await tokenB.balanceOf(signer.address));

  console.log('\nBALANCE Pair tokenA: ', await tokenA.balanceOf(pairAddress));
  console.log('BALANCE Pair tokenB: ', await tokenB.balanceOf(pairAddress));

  console.log('\n Total supply: ', await pair.totalSupply());
  console.log('\nBALANCE myWallet LP: ', await pair.balanceOf(signer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




