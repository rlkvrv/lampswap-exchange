const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);

const routerAddress = '0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0'
const registryAddress = '0x9A676e781A523b5d0C0e43731313A708CB607508'

const tokenA_address = '0x59b670e9fA9D0A427751Af201D676719a970857b'
const tokenB_address = '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1'

// Здесь токены выдают апрувы роутеру на списание
// и  signer добавляет ликвидность

async function main() {
  const [signer] = await ethers.getSigners();
  
  // для взаимодействия с контрактами получаем abi
  const Registry = require("../artifacts/contracts/Registry.sol/Registry.json");
  const registry = new ethers.Contract(registryAddress, Registry.abi, signer);

  const Router = require("../artifacts/contracts/Router.sol/Router.json");
  const router = new ethers.Contract(routerAddress, Router.abi, signer);

  const Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json");
  const tokenA = new ethers.Contract(tokenA_address, Token.abi, signer);
  const tokenB = new ethers.Contract(tokenB_address, Token.abi, signer);

  // апрувим роутер на списание средств для дипозита
  await tokenA.approve(router.address, 100n * DECIMALS);
  await tokenB.approve(router.address, 200n * DECIMALS);

  // проверяем, что разрешение получено и роутер может списать с signer2 
  // 100 tokenA и 200 tokenB
  console.log('ALLOWANCE for tokenA: ', await tokenA.allowance(signer.address, router.address));
  console.log('ALLOWANCE for tokenB: ', await tokenB.allowance(signer.address, router.address));

  console.log('\nbalance wallet before: ', await tokenA.balanceOf(signer.address));
  console.log('balance wallet before: ', await tokenB.balanceOf(signer.address));

  const pairAddress = await registry.getPair(tokenA.address, tokenB.address);
  const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
  const pair = new ethers.Contract(pairAddress, Pair.abi, signer);
  
  // списываем у пользователя от имени signer2 на контракт Pair
  // 100 tokenA и 200 tokenB
  // то есть формируем ликвидность
  console.group('\n ADD LIQUIDITY')
  await router.addLiquidity(tokenA.address, tokenB.address, 100n * DECIMALS, 200n * DECIMALS);

  // Делаем проверку, что средства поступили на баланс Pair
  console.log('\nBALANCE Pair tokenA: ', await tokenA.balanceOf(pairAddress));
  console.log('BALANCE Pair tokenB: ', await tokenB.balanceOf(pairAddress));
  // Делаем проверку, что средства списались с кошелька
  console.log('\nBALANCE myWallet tokenA: ', await tokenA.balanceOf(signer.address));
  console.log('BALANCE myWallet1 tokenB: ', await tokenB.balanceOf(signer.address));

  // проверяем резервы Pair
  // console.log('\n RESERVES: ', await pairContract.getReserves());
  console.log('\n Total supply: ', await pair.totalSupply());
  console.log('\nBALANCE myWallet LP: ', await pair.balanceOf(signer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




