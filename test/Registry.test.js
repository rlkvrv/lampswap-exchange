const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Registry", function () {
  let acc1;
  let acc2;
  let registry;
  let token0;
  let token1;
  let pair;

  beforeEach(async function () {
    [acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("Registry", acc1);
    registry = await Registry.deploy();
    await registry.deployed();
    await registry.setFactory(acc2.address);
    token0 = acc3.address;
    token1 = acc4.address;
    pair = acc5.address;
  })

  it("should be deployed", async function () {
    expect(registry.address).to.be.properAddress;
  });

  it("setFactory should be only work with owner", async function () {
    await expect(registry.connect(acc2).setFactory(acc3.address)).to.be.revertedWith('Ownable: caller is not the owner');
  });
  
  it("should be set factory address", async function () {
    expect(await registry.factory()).to.be.eq(acc2.address);
  });

  it("should be reject the transaction if it is not called by the factory", async function () {
    await expect(registry.connect(acc1).setPair(token0, token1, pair)).to.be.revertedWith('Only factory');
  });

  it("should be added pair", async function () {
    await registry.connect(acc2).setPair(token0, token1, pair);
    expect(await registry.getPair(token0, token1)).to.be.eq(pair);
  });

  it("getPair should return pair address", async function () {
    await registry.connect(acc2).setPair(token0, token1, pair);
    expect(await registry.getPair(token0, token1)).to.be.eq(pair);
    expect(await registry.getPair(token1, token0)).to.be.eq(pair);
  });
});