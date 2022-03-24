const { ethers } = require("hardhat");

const DECIMALS = BigInt(10 ** 18);

const routerAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

const tokenA_address = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'
const tokenB_address = '0x610178dA211FEF7D417bC0e6FeD39F05609AD788'

// тут мы свопаем tokenA на tokenB

async function main() {
  const [signer] = await ethers.getSigners();

  const Token = require("../artifacts/contracts/ERC20Token.sol/ERC20Token.json");
  const tokenA = new ethers.Contract(tokenA_address, Token.abi, signer);
  const tokenB = new ethers.Contract(tokenB_address, Token.abi, signer);

  const Router = require("../artifacts/contracts/Router.sol/Router.json");
  const router = new ethers.Contract(routerAddress, Router.abi, signer);

  await tokenA.approve(router.address, 100n * DECIMALS);
  await tokenB.approve(router.address, 200n * DECIMALS);

  console.log('\nstart BALANCE tokenA: ', await tokenA.balanceOf(signer.address));
  console.log('start BALANCE tokenB: ', await tokenB.balanceOf(signer.address));

  await router.swapIn(tokenA.address, tokenB.address, 10n * DECIMALS, 18n * DECIMALS);

  console.log('\n...token SWAP');

  console.log('\nBALANCE tokenA: ', await tokenA.balanceOf(signer.address));
  console.log('BALANCE tokenB: ', await tokenB.balanceOf(signer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




