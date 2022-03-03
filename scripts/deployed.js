const { ethers } = require("hardhat");

async function createTokens(amount, signer) {
  const LampCoin = await ethers.getContractFactory('LampCoin', signer);

  const ERC20Tokens = [];
  for (let i = 0; i < amount; i++) {
    const token = await LampCoin.deploy(10000 * (i + 1));
    await token.deployed();
    ERC20Tokens.push(token);
  }

  return ERC20Tokens;
}

async function deployFactory() {
  const Factory = await ethers.getContractFactory('Factory');
  const factory = await Factory.deploy();
  await factory.deployed();
  return factory;
}

async function main() {
  const [signer] = await ethers.getSigners();

  // создаем массив токенов
  // сохраняем нужные нам для тестов токены
  const [token0, token1] = await createTokens(2, signer);

  // Деплоим фабрику
  const factory = await deployFactory();

  //  Создаем пару через фабрику
  await factory.createPair(token0.address, token1.address);

  // получаем адрес контракта Pair, тут пока порядок адресов не важен
  const pair1 = await factory.getPair(token0.address, token1.address);
  console.log('Pair contract address: ', pair1);

  // проверяем количество token0 и token1 на балансах кошелька и Pair
  console.log('\nstart BALANCE Pair token0: ', await token0.balanceOf(pair1));
  console.log('start BALANCE Pair token1: ', await token1.balanceOf(pair1));

  // Делаем проверку, что средства списались с кошелька
  console.log('\nstart BALANCE myWallet token0: ', await token0.balanceOf(signer.address));
  console.log('start BALANCE myWallet1 token1: ', await token1.balanceOf(signer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });