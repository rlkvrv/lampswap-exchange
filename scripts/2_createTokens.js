const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);
const AMOUNT_0 = BigInt(1000000n * DECIMALS);
const AMOUNT_1 = BigInt(2000000n * DECIMALS);

const factoryAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

// Эта транзакция создает должна создать два токена для тестов
// и добавить пару через фабрику

async function main() {
  const [signer] = await ethers.getSigners();

  // создаем два токена от имени signer2
  const TokenA = await ethers.getContractFactory('ERC20Token', signer);
  const tokenA = await (await TokenA.deploy("LampTokenA", "LTA", AMOUNT_0)).deployed();
  const TokenB = await ethers.getContractFactory('ERC20Token', signer);
  const tokenB = await (await TokenB.deploy("LampTokenB", "LTB", AMOUNT_1)).deployed();

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




