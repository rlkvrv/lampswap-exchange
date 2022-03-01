const { ethers } = require("hardhat");
const hre = require("hardhat");
const factoryContract = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';


async function main() {
  const [signer] = await hre.ethers.getSigners();

  const LampCoin = await ethers.getContractFactory('LampCoin', signer);
  const coins = [];
  for(let i = 0; i < 6; i++) {
    const coin = await LampCoin.deploy(10000 * (i + 1));
    await coin.deployed();
    coins.push(coin);
  }

  // coins.forEach(async (coin, index) => {
  //   console.log(`address coin ${index + 1}: `, coin.address);
  // });

  const Factory = await ethers.getContractFactory('Factory', signer);
  const factory = await Factory.deploy();
  await factory.deployed();
  await factory.createPair(coins[0].address, coins[1].address);
  await factory.createPair(coins[2].address, coins[3].address);
  const pair1 = await factory.getPair(coins[0].address, coins[1].address);
  // const pair2 = await factory.getPair(coins[2].address, coins[3].address);
  const pairs = await factory.allPairs(0);
  await coins[0].approve(pair1, 100);
  // await coins[1].approve(pair2, 200);
  const allowance = await coins[0].allowance(factoryContract, pair1);
  const transfer = await coins[0].transfer(pair1, 100);


  const { abi } = require("../artifacts/contracts/Pair.sol/Pair.json");
  const providerURL = 'http://127.0.0.1:8545/';
  let provider = new ethers.providers.JsonRpcProvider(providerURL);

  const pairContract = new ethers.Contract(pair1, abi, provider);

  const data = await pairContract.token0();
  console.log('data', pairContract);

  const balancePair = await coins[0].balanceOf(pair1);
  const balanceFactory = await coins[0].balanceOf(factoryContract);

  // const pairName = pairContract.name();

  // await pair1.approve(factoryContract, 100);
  // const allowancePair1 = pair1.allowance()
  
  
  console.log('allowance: ', allowance);
  // console.log('Pair1: ', pairContract, 'Coin1', coins[0]);
  console.log('BALANCE Pair: ', balancePair);
  console.log('BALANCE Factory: ', balanceFactory);
  // const pairs2 = await factory.allPairs(1);
  // console.log('Pair: ', pair);
  // console.log('Pairs: ', pairs);
  // const feeToSetter = await factory.feeToSetter();
  // const feeTo = await factory.feeTo();

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });