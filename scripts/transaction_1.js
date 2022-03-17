const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);

const routerAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const registryAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
const token0Address = '0x8464135c8F25Da09e49BC8782676a84730C318bC'
const token1Address = '0x71C95911E9a5D330f4D621842EC243EE1343292e'

// Эта транзакция создает пул ликвидности
// если вызвать несколько раз, то можно проверить
// как пополняется депозит и минтятся LP токены

async function main() {
  const [signer, signer2] = await ethers.getSigners();
  // для взаимодействия с контрактом пары получаем abi
  const Registry = require("../artifacts/contracts/Registry.sol/Registry.json");
  const registry = new ethers.Contract(registryAddress, Registry.abi, signer);

  const pairAddress = await registry.getPair(token0Address, token1Address);
  const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
  const pair = new ethers.Contract(pairAddress, Pair.abi, signer);

  const Router = require("../artifacts/contracts/Router.sol/Router.json");
  const router = new ethers.Contract(routerAddress, Router.abi, signer);

  const Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json")
  const token0 = new ethers.Contract(token0Address, Token.abi, signer2);
  const token1 = new ethers.Contract(token1Address, Token.abi, signer2);

  await token0.approve(router.address, 100n * DECIMALS);
  await token1.approve(router.address, 200n * DECIMALS);

  // проверяем, что разрешение получено и роутер может списать с signer2 
  // 100 token0 и 200 token1
  // console.log('ALLOWANCE for token0: ', await token0.allowance(signer2.address, router.address));
  // console.log('ALLOWANCE for token1: ', await token1.allowance(signer2.address, router.address));

  console.log('\nbalance wallet before: ', BigNumber.form(await token0.balanceOf(signer2.address)));
  console.log('balance wallet before: ', await token1.balanceOf(signer2.address));
  
  // списываем у пользователя от имени signer2 на контракт Pair
  // 100 token0 и 200 token1
  // то есть формируем ликвидность
  console.group('\n TRANSACTION 1: ADD LIQUIDITY')
  await router.connect(signer2).addLiquidity(token0.address, token1.address, 100n * DECIMALS, 200n * DECIMALS);

  // Делаем проверку, что средства поступили на баланс Pair
  console.log('\nBALANCE Pair token0: ', await token0.balanceOf(pairAddress));
  console.log('BALANCE Pair token1: ', await token1.balanceOf(pairAddress));
  // Делаем проверку, что средства списались с кошелька
  console.log('\nBALANCE myWallet token0: ', await token0.balanceOf(signer2.address));
  console.log('BALANCE myWallet1 token1: ', await token1.balanceOf(signer2.address));

  // проверяем резервы Pair
  // console.log('\n RESERVES: ', await pairContract.getReserves());
  console.log('\n Total supply: ', await pair.totalSupply());
  console.log('\nBALANCE myWallet LP: ', await pair.balanceOf(signer2.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




