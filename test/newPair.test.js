const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("newPair", function () {
  let acc1;
  let acc2;
  let pair;
  let acc1Token0;
  let acc1Token1;
  let acc2Token0;
  let acc2Token1;

  beforeEach(async function () {
    [acc1, acc2, router] = await ethers.getSigners();
    acc1Token0 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(10000))
      .deployed();
    acc1Token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(20000))
      .deployed();

    const Pair = await ethers.getContractFactory("newPair", acc1);
    pair = await (
      await Pair.deploy(acc1Token0.address, acc1Token1.address, router.address)
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


  describe("addLiquidity", async () => {
    beforeEach(async () => {
      await acc1Token0.connect(acc1).approve(pair.address, 100);
      await acc1Token1.connect(acc1).approve(pair.address, 200);
    });

    it("should be approval transfer funds from tokens to pair", async function () {
      expect(await acc1Token0.allowance(acc1.address, pair.address)).to.be.eq(100);
      expect(await acc1Token1.allowance(acc1.address, pair.address)).to.be.eq(200);
    });

    it("token contracts balance in acc1 should decrease", async function () {
      await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9900);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19800);
    });

    it("pair balance should increase", async function () {
      await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await acc1Token0.balanceOf(pair.address)).to.be.eq(100);
      expect(await acc1Token1.balanceOf(pair.address)).to.be.eq(200);
    });

    it("acc1 LPToken balance should increase", async function () {
      await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await pair.balanceOf(acc1.address)).to.be.eq(300);
    });

    it("pair totalSupply should increase", async function () {
      await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await pair.totalSupply()).to.be.eq(300);
    });
  });

  describe("acc2 addLiquidity", async () => {
    beforeEach(async () => {
      acc2Token0 = await (await (await ethers.getContractFactory('LampCoin', acc2))
        .deploy(30000))
        .deployed();
      acc2Token1 = await (await (await ethers.getContractFactory('LampCoin', acc2))
        .deploy(40000))
        .deployed();
      await acc1Token0.connect(acc1).approve(pair.address, 100);
      await acc1Token1.connect(acc1).approve(pair.address, 200);

      await acc2Token0.connect(acc2).approve(pair.address, 200);
      await acc2Token1.connect(acc2).approve(pair.address, 400);

      await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
    });

    it("token contracts balance in acc2 should decrease", async function () {
      await pair.connect(acc2).addLiquidity(acc2Token0.address, acc2Token1.address, 200, 400);
      expect(await acc2Token0.balanceOf(acc2.address)).to.be.eq(29800);
      expect(await acc2Token1.balanceOf(acc2.address)).to.be.eq(39600);
    });

    it("pair balance acc2 should increase", async function () {
      await pair.connect(acc2).addLiquidity(acc2Token0.address, acc2Token1.address, 200, 400);
      expect(await acc2Token0.balanceOf(pair.address)).to.be.eq(200);
      expect(await acc2Token1.balanceOf(pair.address)).to.be.eq(400);
    });

    it("acc2 LPToken balance should increase", async function () {
      await pair.connect(acc2).addLiquidity(acc2Token0.address, acc2Token1.address, 200, 400);
      expect(await pair.balanceOf(acc2.address)).to.be.eq(600);
    });

    it("pair totalSupply should increase", async function () {
      await pair.connect(acc2).addLiquidity(acc2Token0.address, acc2Token1.address, 200, 400);
      expect(await pair.totalSupply()).to.be.eq(900);
    });

    it("should return error message when added incorrect liquidity", async function () {
      await expect(pair.connect(acc2).addLiquidity(acc2Token0.address, acc2Token1.address, 199, 400)).to.be.revertedWith('Insufficient token0 amount');
      await expect(pair.connect(acc2).addLiquidity(acc2Token0.address, acc2Token1.address, 200, 399)).to.be.revertedWith('Insufficient token1 amount');
    });
  });


  describe("Removed liquidity", async () => {

  });
});