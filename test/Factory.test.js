const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  let acc1;
  let acc2;
  let factory;
  let token0;
  let token1;
  let pair;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('Factory', acc1);
    factory = await Factory.deploy();
    await factory.deployed();
    token0 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(10000))
      .deployed();
    token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(20000))
      .deployed();
      await factory.createPair(token0.address, token1.address);
      pair = await factory.getPair(token0.address, token1.address);
  })
  
  it("should be deployed", async function () {
    expect(factory.address).to.be.properAddress;
  });

  it("createPair: pair should be create contract", async function () {
    expect(pair).to.be.properAddress;
  });

  it("allPairs should be contain address of the contract", async function () {
    const pairInAllPairs = await factory.allPairs(0);
    expect(pair === pairInAllPairs).to.be.true;
  });

  it("Pair token balance is 0", async function () {
    expect(await token0.balanceOf(pair)).to.be.equal(0);
    expect(await token1.balanceOf(pair)).to.be.equal(0);
  });

  it("signer token0 balance is 10000 and token1 is 20000", async function () {
    expect(await token0.balanceOf(acc1.address)).to.be.equal(10000);
    expect(await token1.balanceOf(acc1.address)).to.be.equal(20000);
  });
});