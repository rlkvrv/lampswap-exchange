const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);

const routerAddress = '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0'

const tokenA_address = '0x59b670e9fA9D0A427751Af201D676719a970857b'
const tokenB_address = '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1'

// тут мы свопаем tokenA на tokenB

async function main() {
  const [signer] = await ethers.getSigners();

  const Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json");
  const tokenA = new ethers.Contract(tokenA_address, Token.abi, signer);
  const tokenB = new ethers.Contract(tokenB_address, Token.abi, signer);

  const Router = require("../artifacts/contracts/Router.sol/Router.json");
  const router = new ethers.Contract(routerAddress, Router.abi, signer);

  await tokenA.approve(router.address, 100n * DECIMALS);
  await tokenB.approve(router.address, 200n * DECIMALS);

  console.log('\nstart BALANCE tokenA: ', await tokenA.balanceOf(signer.address));
  console.log('start BALANCE tokenB: ', await tokenB.balanceOf(signer.address));

  await router.swapIn(tokenA.address, tokenB.address, 10n * DECIMALS, 18n * DECIMALS);

  console.log('\n...token SWAP');

  console.log('\nBALANCE tokenA: ', await tokenA.balanceOf(signer.address));
  console.log('BALANCE tokenB: ', await tokenB.balanceOf(signer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




