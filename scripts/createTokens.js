const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);
const AMOUNT_0 = BigInt(10000n * DECIMALS);
const AMOUNT_1 = BigInt(20000n * DECIMALS);

const factoryAddress = '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c'

// - Contract deployment: LampCoin
// - Contract deployment: LampCoin
// - Transaction
// - Factory create Pair

// Эта транзакция создает должна создать два токена для тестов
// и добавить пару через фабрику

async function main() {
  const [signer] = await ethers.getSigners();

  // создаем два токена от имени signer2
  const LampCoin = await ethers.getContractFactory('LampCoin', signer);
  const tokenA = await (await LampCoin.deploy(AMOUNT_0)).deployed();
  const tokenB = await (await LampCoin.deploy(AMOUNT_1)).deployed();

  const Factory = require("../artifacts/contracts/Factory.sol/Factory.json");
  const factory = new ethers.Contract(factoryAddress, Factory.abi, signer);

  //  Создаем пару через фабрику
  await factory.createPair(tokenA.address, tokenB.address);

  // Проверяем баланс токенов на signer2
  console.log('\nADDRESS tokenA: ', tokenA.address);
  console.log('ADDRESS tokenB: ', tokenB.address);

  console.log('\nstart BALANCE myWallet tokenA: ', await tokenA.balanceOf(signer.address));
  console.log('start BALANCE myWallet1 tokenB: ', await tokenB.balanceOf(signer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




