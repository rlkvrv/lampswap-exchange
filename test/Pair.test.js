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
    acc1Token0 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenA", "LTA", 10000))
      .deployed();
    acc1Token1 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenB", "LTB", 20000))
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

  it("setRouter should be revert error string", async function () {
    await expect(
      pair.setRouter(acc1.address)
    ).to.be.revertedWith('Invalid router address');
  });

  it("setFee should be revert error string", async function () {
    await expect(
      pair.setFee(acc1.address)
    ).to.be.revertedWith('Invalid fee address');
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