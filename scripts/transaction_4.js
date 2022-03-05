const { ethers } = require("hardhat");
const pairAddress = '0xe3686721b062Da0B181140362A1ca5f2d3E43fBA';

// тут обмениваем наши LP токены на token0 и token1, удаляем ликвидность

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

  console.log('\n TRANSACTION 4: removed liquidity')
  await pairContract.removeLiquidity(300);

  console.log('\nBALANCE Pair token0: ', await token0Contract.balanceOf(pairAddress));
  console.log('BALANCE Pair token1: ', await token1Contract.balanceOf(pairAddress));
  console.log('\nBALANCE myWallet token0: ', await token0Contract.balanceOf(signer.address));
  console.log('BALANCE myWallet token1: ', await token1Contract.balanceOf(signer.address));
  console.log('\n RESERVES: ', await pairContract.getReserves());
  console.log('\n Total Supply: ', await pairContract.totalSupply());
  console.log('\nBALANCE myWallet LP: ', await pairContract.balanceOf(signer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




