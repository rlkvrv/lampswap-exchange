const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();

  const LampCoin = await ethers.getContractFactory('LampCoin', signer);
  const coins = [];
  for(let i = 0; i < 6; i++) {
    const coin = await LampCoin.deploy(10000 * (i + 1));
    await coin.deployed();
    coins.push(coin);
  }

  coins.forEach(async (coin, index) => {
    console.log(`address coin ${index + 1}: `, coin.address);
  });

  const Factory = await ethers.getContractFactory('Factory', signer);
  const factory = await Factory.deploy();
  await factory.deployed();
  await factory.createPair(coins[0].address, coins[1].address);
  await factory.createPair(coins[2].address, coins[3].address);
  const pair = await factory.getPair(coins[0].address, coins[1].address);
  // const pair2 = await factory.getPair(coins[2].address, coins[3].address);
  const pairs = await factory.allPairs(0);
  // const pairs2 = await factory.allPairs(1);
  console.log('Pair: ', pair);
  console.log('Pairs: ', pairs);
  // const feeToSetter = await factory.feeToSetter();
  // const feeTo = await factory.feeTo();

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });