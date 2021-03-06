const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  let acc1;
  let acc2;
  let factory;
  let registry;
  let fee;
  let router;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('Factory', acc1);
    factory = await Factory.deploy();
    await factory.deployed();

    const Router = await ethers.getContractFactory("Router", acc1);
    router = await Router.deploy();
    await router.deployed();

    const Registry = await ethers.getContractFactory("Registry", acc1);
    registry = await Registry.deploy();
    await registry.deployed();
    await registry.setFactory(factory.address);

    const Fee = await ethers.getContractFactory("Fee", acc1);
    fee = await (await Fee.deploy(1, 1, 2)).deployed();
  })

  it("should be deployed", async function () {
    expect(factory.address).to.be.properAddress;
  });

  it("setRouter should set router address", async function () {
    await factory.setRouter(router.address);
    expect(await factory.router()).to.be.eq(router.address);
  });

  it("setFee should set fee address", async function () {
    await factory.setFee(fee.address);
    expect(await factory.fee()).to.be.eq(fee.address);
  });

  it("createPair should create pair and set pair in registry", async function () {
    const token0 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenA", "LTA", 10000))
      .deployed();
    const token1 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenB", "LTB", 20000))
      .deployed();
  
    await factory.setRegistry(registry.address);
    await factory.createPair(token0.address, token1.address);

    const pairAddress = await registry.getPair(token0.address, token1.address);
    expect(await registry.allPairs(0)).to.eq(pairAddress);
    expect(await registry.allPairsLength()).to.eq(1);
  });
});