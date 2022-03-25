const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const decimals = BigInt(10 ** 18);
const token0Amount = BigInt(10000n * decimals);
const token1Amount = BigInt(20000n * decimals);

describe("Сhecking swaps on big numbers", function () {
  let acc1;
  let acc2;
  let router;
  let registry;
  let factory;
  let token0;
  let token1;
  let pair;
  let fee;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();

    token0 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenA", "LTA", token0Amount))
      .deployed();
    token1 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenB", "LTB", token1Amount))
      .deployed();

    const Router = await ethers.getContractFactory('Router', acc1);
    router = await (await Router.deploy()).deployed();

    const Factory = await ethers.getContractFactory('Factory', acc1);
    factory = await (await Factory.deploy()).deployed();

    const Registry = await ethers.getContractFactory("Registry", acc1);
    registry = await (await Registry.deploy()).deployed();

    const Fee = await ethers.getContractFactory("Fee", acc1);
    fee = await (await Fee.deploy(1, 20, 2)).deployed();

    await router.setRegistry(registry.address);
    await factory.setRouter(router.address);
    await factory.setRegistry(registry.address);
    await factory.setFee(fee.address);
    await registry.setFactory(factory.address);
    await factory.createPair(token0.address, token1.address);

    const pairAddress = await registry.getPair(token0.address, token1.address)
    const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
    pair = new ethers.Contract(pairAddress, Pair.abi, acc1);

    const txToken0 = 100n * decimals;
    const txToken1 = 100n * decimals;

    await token0.connect(acc1).approve(router.address, txToken0);
    await token1.connect(acc1).approve(router.address, txToken1);
    await router.addLiquidity(token0.address, token1.address, txToken0, txToken1);
  })

  it("swapIn", async function () {
    await token0.connect(acc1).approve(router.address, 1n * decimals);
    await router.swapIn(token0.address, token1.address, 1n * decimals, (98n * decimals / 100n))
    const performanceFee = await token1.balanceOf(fee.address);
    const token0Balance = await token0.balanceOf(pair.address);
    const token1Balance = await token1.balanceOf(pair.address);
    expect((performanceFee / BigNumber.from(decimals)).toString()).to.be.eq('0.00792079207920792');
    expect((token0Balance / BigNumber.from(decimals)).toString()).to.be.eq('101');
    expect((token1Balance / BigNumber.from(decimals)).toString()).to.be.eq('99.0118811881188');
  });

  it("swapOut", async function () {
    await token0.connect(acc1).approve(router.address, 2n * decimals);
    await router.swapOut(token0.address, token1.address, 1n * decimals, 1021n * decimals / 1000n);
    const performanceFee = await token1.balanceOf(fee.address);
    const token0Balance = await token0.balanceOf(pair.address);
    const token1Balance = await token1.balanceOf(pair.address);
    expect((performanceFee / BigNumber.from(decimals)).toString()).to.be.eq('0.008162432404856647');
    expect((token0Balance / BigNumber.from(decimals)).toString()).to.be.eq('101.02030405060708');
    expect((token1Balance / BigNumber.from(decimals)).toString()).to.be.eq('98.99183756759516');
  });

  
});