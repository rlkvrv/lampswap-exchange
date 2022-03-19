const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);
const AMOUNT_0 = BigInt(1000000n * DECIMALS);
const AMOUNT_1 = BigInt(2000000n * DECIMALS);

// Эта транзакция создает должна создать два токена для тестов

async function main() {
  const [signer] = await ethers.getSigners();

  // создаем два токена от имени signer2
  const LampTokenA = await ethers.getContractFactory('LampTokenA', signer);
  const tokenA = await (await LampTokenA.deploy(AMOUNT_0)).deployed();
  const LampTokenB = await ethers.getContractFactory('LampTokenB', signer);
  const tokenB = await (await LampTokenB.deploy(AMOUNT_1)).deployed();

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