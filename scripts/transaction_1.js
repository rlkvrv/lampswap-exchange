const { ethers } = require("hardhat");
const pairAddress = '0x465Df401621060aE6330C13cA7A0baa2B0a9d66D';

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

  // даем разрешение на списание токенов контракту пары
  // в качестве депозита
  console.group('\n TRANSACTION APPROVED');
  await token0Contract.approve(pairAddress, 100);
  await token1Contract.approve(pairAddress, 200);

  // проверяем, что разрешение получено и пара 1 может списать с нас 
  // 100 token0 и 200 token1
  console.log('\nALLOWANCE for token0: ', await token0Contract.allowance(signer.address, pairAddress));
  console.log('ALLOWANCE for token1: ', await token1Contract.allowance(signer.address, pairAddress));
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
  console.log('\nBALANCE myWallet token0: ', await token0Contract.balanceOf(signer.address));
  console.log('BALANCE myWallet1 token1: ', await token1Contract.balanceOf(signer.address));

  // проверяем резервы Pair
  console.log('\n RESERVES: ', await pairContract.getReserves());
  console.log('\n Total supply to be equal 300: ', await pairContract.totalSupply());
  console.log('\nBALANCE myWallet LP: ', await pairContract.balanceOf(signer.address));
  console.groupEnd();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




