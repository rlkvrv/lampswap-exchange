const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  let acc1;
  let acc2;
  let factory;
  let registry;

  beforeEach(async function () {
    [acc1, acc2, token0, token1, router] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('Factory', acc1);
    factory = await Factory.deploy();
    await factory.deployed();

    const Registry = await ethers.getContractFactory("Registry", acc1);
    registry = await Registry.deploy();
    await registry.deployed();
    await registry.setFactory(factory.address);
  })
  
  it("should be deployed", async function () {
    expect(factory.address).to.be.properAddress;
  });

  it("setRouter should set router address", async function () {
    await factory.setRouter(router.address);
    expect(await factory.router()).to.be.eq(router.address);
  });

  it("setRegistry should set registry address", async function () {
    await factory.setRegistry(registry.address);
    expect(await factory.registry()).to.be.eq(registry.address);
  });

  it("createPair should create pair and set pair in registry", async function () {
    await factory.setRegistry(registry.address);
    await factory.createPair(token0.address, token1.address);

    const pairAddress = await registry.getPair(token0.address, token1.address);
    expect(await registry.allPairs(0)).to.eq(pairAddress);
    expect(await registry.allPairsLength()).to.eq(1);
  });
});