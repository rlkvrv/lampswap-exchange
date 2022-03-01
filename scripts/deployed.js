const { ethers } = require("hardhat");
const hre = require("hardhat");
const factoryContract = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';


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

  await factory.createPair(coins[0].address, coins[1].address);

  // Проверяем что в массиве есть пара
  const pairs = await factory.allPairs(0);

  // получаем первую пару
  const pair1 = await factory.getPair(coins[0].address, coins[1].address);


  // даем разрешение от себя на списание с нас 100 токенов паре 1
  // в качестве депозита

  await coins[0].approve(pair1, 100);

  // проверяем, что разрешение получено и пара 1 может списать с нас 
  // 100 токенов
  const allowance = await coins[0].allowance(factoryContract, pair1);
  console.log('allowance: ', allowance);
  


  // т.к через transferFrom пока не получается списать делаем в тупую трансфер
  // const transfer = await coins[0].transfer(pair1, 100);

  // для взаимодействия с контрактом пары получаем его abi
  const { abi } = require("../artifacts/contracts/Pair.sol/Pair.json");
  const providerURL = 'http://127.0.0.1:8545/';
  let provider = new ethers.providers.JsonRpcProvider(providerURL);
  const pairContract = new ethers.Contract(pair1, abi, provider);

  // взаимодействуем с контрактом пары
  const data = await pairContract.token0();
  const data2 = await pairContract.token1();
  console.log('data \n', data, '\n', data2);

  // проверяем что у нас стало на 100 коинов меньше, а у пары прибавилось

  const balancePair = await coins[0].balanceOf(pair1);
  const balanceFactory = await coins[0].balanceOf(factoryContract);

  console.log('BALANCE Pair: ', balancePair);
  console.log('BALANCE Factory: ', balanceFactory);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });