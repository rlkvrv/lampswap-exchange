const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Registry", function () {
  let acc1;
  let factory;
  let registry;
  let token0;
  let token1;
  let pair;
  let router;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();

    token0 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(10000))
      .deployed();
    token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(20000))
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
    await factory.setFee(fee.address);
    await registry.setFactory(factory.address);
    await factory.createPair(token0.address, token1.address);

    pair = await registry.getPair(token0.address, token1.address)
  })

  it("should be deployed", async function () {
    expect(registry.address).to.be.properAddress;
  });

  it("setFactory should be only work with owner", async function () {
    await expect(registry.connect(acc2).setFactory(factory.address)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("should be set factory address", async function () {
    expect(await registry.factory()).to.be.eq(factory.address);
  });

  it("should be reject the transaction if it is not called by the factory", async function () {
    await expect(registry.connect(acc1).setPair(token0.address, token1.address, pair)).to.be.revertedWith('Only factory');
  });

  it("should be added pair", async function () {
    expect(await registry.getPair(token0.address, token1.address)).to.be.eq(pair);
    expect(await registry.getPair(token1.address, token0.address)).to.be.eq(pair);
  });
});