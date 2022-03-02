const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  const LampCoin = await ethers.getContractFactory('LampCoin', signer);

  // создаем массив токенов

  const coins = [];
  for(let i = 0; i < 6; i++) {
    const coin = await LampCoin.deploy(10000 * (i + 1));
    await coin.deployed();
    coins.push(coin);
  }

  // проверяем адреса созданных токенов

  // coins.forEach(async (coin, index) => {
  //   console.log(`address coin ${index + 1}: `, coin.address);
  // });

  // Деплоим фабрику и создаем пару

  const Factory = await ethers.getContractFactory('Factory', signer);
  const factory = await Factory.deploy();
  await factory.deployed();
  
  //
  await factory.createPair(coins[0].address, coins[1].address);
  
  // получаем первую пару
  // даем разрешение от себя на списание с нас 100 токенов паре 1
  // в качестве депозита
  const pair1 = await factory.getPair(coins[0].address, coins[1].address);
  await coins[0].approve(pair1, 100);
  await coins[1].approve(pair1, 200);

  // Проверяем что в массиве есть пара
  // const pairs = await factory.allPairs(0);

  // проверяем, что разрешение получено и пара 1 может списать с нас 
  // 100 токенов
  const allowance = await coins[0].allowance(signer.address, pair1);
  const allowance1 = await coins[1].allowance(signer.address, pair1);
  console.log('allowance0: ', allowance);
  console.log('allowance1: ', allowance1);
  
  // т.к через transferFrom пока не получается списать делаем в тупую трансфер
  // const transfer = await coins[0].transfer(pair1, 100);

  // для взаимодействия с контрактом пары получаем его abi
  const { abi } = require("../artifacts/contracts/Pair.sol/Pair.json");
  const pairContract = new ethers.Contract(pair1, abi, signer);

  //забираем у пользователя от имени пары на контракт пары 100 коинов 
  await pairContract.createDeposit(signer.address, 100, 200);

  // проверяем что у нас стало на 100 и 200 коинов меньше, а у пары прибавилось

  const balancePair = await coins[0].balanceOf(pair1);
  const myWalletBalance = await coins[0].balanceOf(signer.address);
  const balancePair1 = await coins[1].balanceOf(pair1);
  const myWalletBalance1 = await coins[1].balanceOf(signer.address);

  console.log('\nBALANCE Pair: ', balancePair);
  console.log('BALANCE myWallet: ', myWalletBalance);
  console.log('BALANCE Pair1: ', balancePair1);
  console.log('BALANCE myWallet1: ', myWalletBalance1);

  // проверяем резервы пары
  const reserves = await pairContract.getReserves();
  console.log('\n RESERVES: ', reserves);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });