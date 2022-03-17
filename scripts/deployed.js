const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);
const AMOUNT_0 = BigInt(10000n * DECIMALS);
const AMOUNT_1 = BigInt(20000n * DECIMALS);

async function main() {
  const [acc1, acc2] = await ethers.getSigners();

  // создаем два токена
  const LampCoin = await ethers.getContractFactory('LampCoin', acc2);
  const token0 = await (await LampCoin.deploy(AMOUNT_0)).deployed();
  const token1 = await (await LampCoin.deploy(AMOUNT_1)).deployed();

  // Шаг первый:
  //  - деплой роутра
  //  - деплой фабрики
  //  - деплой регистри
  //  - деплой контракта с комиссиями

  const Router = await ethers.getContractFactory('Router', acc1);
  const router = await (await Router.deploy()).deployed();
  console.log('Router contract address: ', router.address);

  const Factory = await ethers.getContractFactory('Factory', acc1);
  const factory = await (await Factory.deploy()).deployed();

  const Registry = await ethers.getContractFactory("Registry", acc1);
  const registry = await (await Registry.deploy()).deployed();

  const Fee = await ethers.getContractFactory("Fee", acc1);
  const fee = await (await Fee.deploy(1, 1, 2)).deployed();

  //Шаг второй:
  //  - устанавливаем на роутере адрес регистри
  await router.setRegistry(registry.address);
  //  - устанавливаем на фабрике адреса регистри, роутера и контракта комиссий
  await factory.setRouter(router.address);
  await factory.setRegistry(registry.address);
  await factory.setFee(fee.address);
  //  - устанавливаем на регистри адрес фабрики
  await registry.setFactory(factory.address);

  //  Создаем пару через фабрику
  await factory.createPair(token0.address, token1.address);

  // получаем адрес контрактов Registry и токенов
  console.log('Registry contract address: ', registry.address);
  console.log('Token0 contract address: ', token0.address);
  console.log('Token1 contract address: ', token1.address);


  // Проверяем баланс токенов на acc1
  console.log('\nstart BALANCE myWallet token0: ', await token0.balanceOf(acc2.address));
  console.log('start BALANCE myWallet1 token1: ', await token1.balanceOf(acc2.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });