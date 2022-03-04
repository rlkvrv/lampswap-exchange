const { ethers } = require("hardhat");
const pairAddress = '0x8C8e61E4705D1dbEe6DeADb39E67AC77650b0704';

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

  console.log('\n TRANSACTION 2: SWAP of token1 for token0')

  // разрешаем списать еще 500 token0 для обмена на token1
  await token0Contract.approve(pairAddress, 500);

  console.log(
    '\n PRICE of token1 for 500 tokens0: ', await pairContract.getTokenPrice(token0Contract.address, 500)
  );

  // делам обмен 500 token0 на token1 по рассчитанному курсу
  console.log('...token SWAP');
  await pairContract.swap(token0Contract.address, 500);

  console.log('\nBALANCE Pair token0: ', await token0Contract.balanceOf(pairAddress));
  console.log('BALANCE Pair token1: ', await token1Contract.balanceOf(pairAddress));
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




