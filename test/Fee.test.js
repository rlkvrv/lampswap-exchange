const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fee", function () {
  let acc1;
  let acc2;
  let fee;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();
    const Fee = await ethers.getContractFactory("Fee", acc1);
    const swapFee = 1;
    const protocolPerformanceFee = 1;
    const feeDecimals = 2;
    fee = await Fee.deploy(swapFee, protocolPerformanceFee, feeDecimals);
    await fee.deployed();
  })

  it("should be deployed", async function () {
    expect(fee.address).to.be.properAddress;
  });

  it("setFeeParams should set new fee params", async function () {
    await fee.setFeeParams(2,3,4);
    expect(await fee.swapFee()).to.be.eq(2);
    expect(await fee.protocolPerformanceFee()).to.be.eq(3);
    expect(await fee.feeDecimals()).to.be.eq(4);
  });

  it("only owner may set params", async function () {
    await expect(fee.connect(acc2).setFeeParams(2, 3, 4)).to.be.revertedWith('Ownable: caller is not the owner');
  });
});