const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);

const routerAddress = '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0'
const registryAddress = '0x9A676e781A523b5d0C0e43731313A708CB607508'

const tokenA_address = '0x59b670e9fA9D0A427751Af201D676719a970857b'
const tokenB_address = '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1'

// удаляем ликвидность

async function main() {
  const [signer] = await ethers.getSigners();

  const Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json");
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




