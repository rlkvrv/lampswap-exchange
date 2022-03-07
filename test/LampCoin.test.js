const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LampCoin", function () {
  let acc1;
  let acc2;
  let lampCoin;

  beforeEach(async function() {
    [acc1, acc2] = await ethers.getSigners();
    const LampCoin = await ethers.getContractFactory("LampCoin", acc1);
    lampCoin = await LampCoin.deploy(10000);
    await lampCoin.deployed();
  })

  it("should be deployed", async function() {
    expect(lampCoin.address).to.be.properAddress;
  });

  it("totalSupply should be equal 10000", async function() {
    const balance = await lampCoin.totalSupply();
    expect(balance).to.be.equal(10000);
  });

  it("balance acc1 should be equal 10000", async function() {
    const balance = await lampCoin.balanceOf(acc1.address);
    expect(balance).to.be.equal(10000);
  });

  it("decimals method should be return 18", async function() {
    expect(await lampCoin.decimals()).to.be.equal(18);
  });

  it("transfer method should be transfer 1000 tokens from acc1 to acc2", async function() {
    await lampCoin.transfer(acc2.address, 1000);
    const balance1 = await lampCoin.balanceOf(acc1.address);
    const balance2 = await lampCoin.balanceOf(acc2.address);
    expect(balance1).to.be.equal(9000);
    expect(balance2).to.be.equal(1000);
  });

  it("approve method should be approve 1000 tokens2", async function() {
    await lampCoin.approve(acc2.address, 1000);
    const allowance = await lampCoin.allowance(acc1.address, acc2.address);
    expect(allowance).to.be.equal(1000);
  });

  it("transferFrom method should be transfer 1000 tokens from acc1 to acc2", async function() {
    await lampCoin.approve(acc2.address, 1000);
    await lampCoin.connect(acc2).transferFrom(acc1.address, acc2.address, 1000);
    const balance1 = await lampCoin.balanceOf(acc1.address);
    const balance2 = await lampCoin.balanceOf(acc2.address);
    expect(balance1).to.be.equal(9000);
    expect(balance2).to.be.equal(1000);
  });

  it("transferFrom method should be return error string", async function() {
    await lampCoin.approve(acc2.address, 10);
    await expect(lampCoin.connect(acc2).transferFrom(acc1.address, acc2.address, 1000)).to.be.revertedWith('Ask for permission to transfer the required number of LCT')
  });

  it("transfer method should be return error string", async function() {
    await expect(lampCoin.transfer(acc1.address, 99999999)).to.be.revertedWith('Insufficient funds from the sender')
  });
});