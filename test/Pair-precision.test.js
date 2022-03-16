const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const decimals = BigInt(10**18);
const token0Amount = BigInt(10000n * decimals);
const token1Amount = BigInt(20000n * decimals);

describe("getTokenPrice", function () {
  let acc1;
  let acc2;
  let router;
  let registry;
  let factory;
  let acc1Token0;
  let acc1Token1;
  let pair;
  let fee;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();

    acc1Token0 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(token0Amount))
      .deployed();
    acc1Token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(token1Amount))
      .deployed();

    const Router = await ethers.getContractFactory('Router', acc1);
    router = await (await Router.deploy()).deployed();

    const Factory = await ethers.getContractFactory('Factory', acc1);
    factory = await (await Factory.deploy()).deployed();

    const Registry = await ethers.getContractFactory("Registry", acc1);
    registry = await (await Registry.deploy()).deployed();

    const Fee = await ethers.getContractFactory("Fee", acc1);
    fee = await (await Fee.deploy(1, 1, 2)).deployed();

    await router.setRegistry(registry.address);
    await factory.setRouter(router.address);
    await factory.setRegistry(registry.address);
    await registry.setFactory(factory.address);
    await factory.createPair(acc1Token0.address, acc1Token1.address);

    const pairAddress = await registry.getPair(acc1Token0.address, acc1Token1.address)
    const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
    pair = new ethers.Contract(pairAddress, Pair.abi, acc1);

    await pair.setFee(fee.address);

    const txToken0 = 100n * decimals;
    const txToken1 = 200n * decimals;

    await acc1Token0.connect(acc1).approve(pair.address, txToken0);
    await acc1Token1.connect(acc1).approve(pair.address, txToken1);
    await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, txToken0, txToken1);
  })

  it("should return correct prices", async function () {
    const value0 = await pair.getTokenPrice(acc1Token0.address, 1n * decimals)
    const value1 = await pair.getTokenPrice(acc1Token1.address, 1n * decimals)

    expect((value0 / BigNumber.from(decimals)).toString()).to.be.eq('1.960590157441331');
    expect((value1 / BigNumber.from(decimals)).toString()).to.be.eq('0.4925618189959699');
  });

});