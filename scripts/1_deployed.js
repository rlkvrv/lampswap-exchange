const { ethers } = require("hardhat");

// - Contract deployment: Router
// - Contract deployment: Factory
// - Contract deployment: Registry
// - Contract deployment: Fee
// =======================================
// - Contract call:       Router#setRegistry
// - Contract call:       Factory#setRouter
// - Contract call:       Factory#setRegistry
// - Contract call:       Factory#setFee
// - Contract call:       Registry#setFactory

async function main() {
  const [acc1] = await ethers.getSigners();

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
  console.log('Fee contract address: ', router.address);

  //Шаг второй:
  //  - устанавливаем на роутере адрес регистри
  await router.setRegistry(registry.address);
  //  - устанавливаем на фабрике адреса регистри, роутера и контракта комиссий
  await factory.setRouter(router.address);
  await factory.setRegistry(registry.address);
  await factory.setFee(fee.address);
  //  - устанавливаем на регистри адрес фабрики
  await registry.setFactory(factory.address);

  // получаем адрес контрактов Registry и токенов
  console.log('Registry contract address: ', registry.address);
  console.log('Factory contract address: ', factory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });