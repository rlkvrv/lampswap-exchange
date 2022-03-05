const { ethers } = require("hardhat");
const pairAddress = '0xaf4181d7208912b151d1BA11d22EA4e24FF500ce';

// Эта транзакция проверяет, что другой кошелек может
// добавить ликвидности

async function main() {
  const [signer, secondSigner] = await ethers.getSigners();
  // для взаимодействия с контрактом пары получаем его abi
  const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
  const pairContract = new ethers.Contract(pairAddress, Pair.abi, secondSigner);

  // получаем адреса контрактов token0 и token1 для взаимодействия с ними
  // но уже из контракта пары, потому что токены могли поменяться местами
  const token0TrueAddress = await pairContract.token0();
  const token1TrueAddress = await pairContract.token1();

  // Получаем нужный abi
  const Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json");

  // подключаемся к этим контрактам
  const token0Contract = new ethers.Contract(token0TrueAddress, Token.abi, secondSigner);
  const token1Contract = new ethers.Contract(token1TrueAddress, Token.abi, secondSigner);

  await token0Contract.connect(signer).transfer(secondSigner.address, 100);
  await token1Contract.connect(signer).transfer(secondSigner.address, 200);
  console.log('\nSecond Signer balance token0: ', await token0Contract.balanceOf(secondSigner.address));
  console.log('Second Signer balance token1: ', await token1Contract.balanceOf(secondSigner.address));


  // даем разрешение на списание токенов контракту пары
  // в качестве депозита
  console.group('\n TRANSACTION APPROVED');
  await token0Contract.approve(pairAddress, 100);
  await token1Contract.approve(pairAddress, 200);

  // проверяем, что разрешение получено и пара 1 может списать с нас 
  // 100 token0 и 200 token1
  console.log('\nALLOWANCE for token0: ', await token0Contract.allowance(secondSigner.address, pairAddress));
  console.log('ALLOWANCE for token1: ', await token1Contract.allowance(secondSigner.address, pairAddress));
  console.groupEnd();

  // списываем у пользователя от имени Pair на контракт Pair
  // 100 token0 и 200 token1
  // то есть создаем депозит (формируем ликвидность)
  console.group('\n TRANSACTION 1: CREATE DEPOSIT')
  await pairContract.createDeposit(100, 200);

  // Делаем проверку, что средства поступили на баланс Pair
  console.log('\nBALANCE Pair token0: ', await token0Contract.balanceOf(pairAddress));
  console.log('BALANCE Pair token1: ', await token1Contract.balanceOf(pairAddress));
  // Делаем проверку, что средства списались с кошелька
  console.log('\nBALANCE myWallet token0: ', await token0Contract.balanceOf(secondSigner.address));
  console.log('BALANCE myWallet1 token1: ', await token1Contract.balanceOf(secondSigner.address));

  // проверяем резервы Pair
  console.log('\n RESERVES: ', await pairContract.getReserves());
  console.log('\n Total supply: ', await pairContract.totalSupply());
  console.log('\nBALANCE myWallet LP: ', await pairContract.balanceOf(secondSigner.address));
  console.groupEnd();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




