const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pair", function () {
  let acc1;
  let acc2;
  let pair;
  let acc1Token0;
  let acc1Token1;
  let fee;

  beforeEach(async function () {
    [acc1, acc2, router, fee] = await ethers.getSigners();
    acc1Token0 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(10000))
      .deployed();
    acc1Token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(20000))
      .deployed();

    const Pair = await ethers.getContractFactory("Pair", acc1);
    pair = await (
      await Pair.deploy(acc1Token0.address, acc1Token1.address, router.address, fee.address)
    ).deployed();
  })

  it("should be deployed", async function () {
    expect(pair.address).to.be.properAddress;
  });

  it("name should be LPToken", async function () {
    expect(await pair.name()).to.be.eq('LPToken');
  });

  it("decimals should be 18", async function () {
    expect(await pair.decimals()).to.be.eq(18);
  });

  it("should be correct router address", async function () {
    expect(await pair.router()).to.be.eq(router.address);
  });

  it("should be correct fee address", async function () {
    expect(await pair.fee()).to.be.eq(fee.address);
  });

  it("only router can make a swap transaction", async () => {
    await expect(
      pair.connect(acc1).swapIn(acc1Token0.address, acc1Token1.address, 10)
    ).to.be.revertedWith('Ownable: caller is not the router');
  });

  it("only router can make a addLiquidity transaction", async () => {
    await expect(
      pair.connect(acc1).addLiquidity(acc1.address, 100, 200)
    ).to.be.revertedWith('Ownable: caller is not the router');
  });

  it("only router can make a removeLiquidity transaction", async () => {
    await expect(
      pair.connect(acc1).removeLiquidity(300, acc1.address)
    ).to.be.revertedWith('Ownable: caller is not the router');
  });
});