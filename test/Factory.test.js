const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  let acc1;
  let acc2;
  let factory;
  let token0;
  let token1;

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
  })

  it("should be deployed", async function () {
    expect(factory.address).to.be.properAddress;
  });

  it("createPair: pair should be create contract", async function () {
    await factory.createPair(token0.address, token1.address);
    const pair = await factory.getPair(token0.address, token1.address);
    expect(pair).to.be.properAddress;
  });

  it("allPairs should be contain address of the contract", async function () {
    await factory.createPair(token0.address, token1.address);
    const pair = await factory.getPair(token0.address, token1.address);
    const pairInAllPairs = await factory.allPairs(0);
    expect(pair === pairInAllPairs).to.be.true;
  });
});