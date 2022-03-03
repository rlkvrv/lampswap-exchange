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

  // сохраняем нужные нам для тестов токены
  const [token0, token1] = coins;

  // Деплоим фабрику и создаем пару

  const Factory = await ethers.getContractFactory('Factory');
  const factory = await Factory.deploy();
  await factory.deployed();
  
  // создаем пару через фабрику
  await factory.createPair(token0.address, token1.address);
  
  // получаем адрес контракта Pair, тут пока порядок адресов не важен
  const pair1 = await factory.getPair(token0.address, token1.address);

  // проверяем количество token0 и token1 на балансах кошелька и Pair
  console.log('\nstart BALANCE Pair token0: ', await token0.balanceOf(pair1));
  console.log('start BALANCE Pair token1: ', await token1.balanceOf(pair1));
  // Делаем проверку, что средства списались с кошелька
  console.log('\nstart BALANCE myWallet token0: ', await token0.balanceOf(signer.address));
  console.log('start BALANCE myWallet1 token1: ', await token1.balanceOf(signer.address));

  // для взаимодействия с контрактом пары получаем его abi
  const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
  const pairContract = new ethers.Contract(pair1, Pair.abi, signer);

  // получаем адреса контрактов token0 и token1 для взаимодействия с ними
  // но уже из контракта пары, потому что токены могли поменяться местами
  const token0TrueAddress = await pairContract.token0();
  const token1TrueAddress = await pairContract.token1();

  // Получаем нужный abi
  const Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json");

  // подключаемся к этим контрактам
  const token0Contract = new ethers.Contract(token0TrueAddress, Token.abi, signer);
  const token1Contract = new ethers.Contract(token1TrueAddress, Token.abi, signer);

  // даем разрешение на списание токенов контракту пары
  // в качестве депозита
  console.group('\n TRANSACTION APPROVED');
  await token0Contract.approve(pair1, 100);
  await token1Contract.approve(pair1, 200);

  // проверяем, что разрешение получено и пара 1 может списать с нас 
  // 100 token0 и 200 token1
  console.log('\nALLOWANCE for token0: ', await token0Contract.allowance(signer.address, pair1));
  console.log('ALLOWANCE for token1: ', await token1Contract.allowance(signer.address, pair1));
  console.groupEnd();

  // списываем у пользователя от имени Pair на контракт Pair
  // 100 token0 и 200 token1
  // то есть создаем депозит (формируем ликвидность)
  console.group('\n CREATE DEPOSIT')
  await pairContract.createDeposit(100, 200);

  // Делаем проверку, что средства поступили на баланс Pair
  console.log('\nBALANCE Pair token0: ', await token0Contract.balanceOf(pair1));
  console.log('BALANCE Pair token1: ', await token1Contract.balanceOf(pair1));
  // Делаем проверку, что средства списались с кошелька
  console.log('\nBALANCE myWallet token0: ', await token0Contract.balanceOf(signer.address));
  console.log('BALANCE myWallet1 token1: ', await token1Contract.balanceOf(signer.address));

  // проверяем резервы Pair
  console.log('\n RESERVES: ', await pairContract.getReserves());
  console.groupEnd();

  // проверяем, что totalSupply увеличился
  // console.log('TOTAL_SUPPLY: ', await pairContract.totalSupply());

  
  // разрешаем списать еще 500 token0 для обмена на token1
  await token0Contract.approve(pair1, 500);

  console.log(
    '\n PRICE of token 1 for 500 tokens 0: ', await pairContract.getTokenPrice(token0Contract.address, 500)
  );

  // делам обмен 500 token0 на token1 по рассчитанному курсу
  console.log('\n ...token SWAP');
  await pairContract.swap(token0Contract.address, 500);

  console.log('\nBALANCE Pair token0: ', await token0Contract.balanceOf(pair1));
  console.log('BALANCE Pair token1: ', await token1Contract.balanceOf(pair1));
  console.log('\nBALANCE myWallet token0: ', await token0Contract.balanceOf(signer.address));
  console.log('BALANCE myWallet token1: ', await token1Contract.balanceOf(signer.address));
  // console.log('TOTAL_SUPPLY: ', await pairContract.totalSupply());
  console.log('\n RESERVES: ', await pairContract.getReserves());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });