const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Router", function () {
  let acc1;
  let acc2;
  let router;
  let registry;
  let factory;
  let acc1Token0;
  let acc1Token1;
  let fee;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();

    acc1Token0 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(10000))
      .deployed();
    acc1Token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(20000))
      .deployed();

    const Router = await ethers.getContractFactory('Router', acc1);
    router = await (await Router.deploy()).deployed();

    const Factory = await ethers.getContractFactory('Factory', acc1);
    factory = await (await Factory.deploy()).deployed();

    const Registry = await ethers.getContractFactory("Registry", acc1);
    registry = await (await Registry.deploy()).deployed();

    await router.setRegistry(registry.address);
    await factory.setRouter(router.address);
    await factory.setRegistry(registry.address);
    await registry.setFactory(factory.address);
    await factory.createPair(acc1Token0.address, acc1Token1.address);

    const pairAddress = await registry.getPair(acc1Token0.address, acc1Token1.address)
    const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
    const pair = new ethers.Contract(pairAddress, Pair.abi, acc1);
    await acc1Token0.connect(acc1).approve(pair.address, 1000);
    await acc1Token1.connect(acc1).approve(pair.address, 2000);
    await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);

    const Fee = await ethers.getContractFactory("Fee", acc1);
    fee = await (await Fee.deploy(1, 1, 2)).deployed();
    await pair.setFee(fee.address);
  })

  it("should be deployed", async function () {
    expect(router.address).to.be.properAddress;
  });

  it("swapIn", async function () {
    await router.swapIn(acc1Token0.address, acc1Token1.address, 10, 18);
  });

  // it("setRegistry should set registry address", async function () {
  //   await factory.setRegistry(registry.address);
  //   expect(await factory.registry()).to.be.eq(registry.address);
  // });
});