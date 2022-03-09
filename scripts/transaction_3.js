const { ethers } = require("hardhat");
const pairAddress = '0x553BED26A78b94862e53945941e4ad6E4F2497da';

// тут мы проверям цену и свопаем token0 на token1

async function main() {
  const [signer] = await ethers.getSigners();
  // для взаимодействия с контрактом пары получаем его abi
  const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
  const pairContract = new ethers.Contract(pairAddress, Pair.abi, signer);

  // получаем адреса контрактов token0 и token1 для взаимодействия с ними
  // но уже из контракта пары, потому что токены могли поменяться местами
  const token0TrueAddress = await pairContract.token0();
  const token1TrueAddress = await pairContract.token1();

  // Получаем нужный abi
  const Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json");

  // подключаемся к этим контрактам
  const token0Contract = new ethers.Contract(token0TrueAddress, Token.abi, signer);
  const token1Contract = new ethers.Contract(token1TrueAddress, Token.abi, signer);

  console.log('\n TRANSACTION 3: SWAP of token0 for token1')
  console.log(
    '\n PRICE of token0 for 10 tokens1: ', await pairContract.getTokenPrice(token1Contract.address, 10)
  );

  // разрешаем списать 10 token1 для обмена на token0
  await token1Contract.approve(pairAddress, 10);

  console.log('...token SWAP');
  await pairContract.swap(token1Contract.address, 10);

  console.log('\nBALANCE Pair token0: ', await token0Contract.balanceOf(pairAddress));
  console.log('BALANCE Pair token1: ', await token1Contract.balanceOf(pairAddress));
  console.log('\nBALANCE myWallet token0: ', await token0Contract.balanceOf(signer.address));
  console.log('BALANCE myWallet token1: ', await token1Contract.balanceOf(signer.address));
  console.log('\n RESERVES: ', await pairContract.getReserves());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




