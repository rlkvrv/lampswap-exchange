const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pair", function () {
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

    const Pair = await ethers.getContractFactory("Pair", acc1);
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
    beforeEach(async () => {
      await acc1Token0.connect(acc1).approve(pair.address, 100);
      await acc1Token1.connect(acc1).approve(pair.address, 200);

      await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
    });

    it("should be removed liquidity acc1", async function () {
      await pair.connect(acc1).removeLiquidity(300);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(10000);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(20000);
    });
  });

  describe("Tokens swap", async () => {
    beforeEach(async () => {
      await acc1Token0.connect(acc1).approve(pair.address, 100);
      await acc1Token1.connect(acc1).approve(pair.address, 200);

      await pair.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
    });


    it("price of token1 for 10 tokens0 must be 18 token1", async () => {
      expect(await pair.getTokenPrice(acc1Token0.address, 10)).to.be.eq(18);
    });

    it("only router can make a swap transaction", async () => {
      await expect(
        pair.connect(acc1).swapIn(acc1Token0.address, acc1Token1.address, 10, 10, acc1.address)
      ).to.be.revertedWith('Ownable: caller is not the router');
    });

    it("swapIn should be swap of token0 to token1 if amountOut >= minAmountOut", async () => {
      await acc1Token0.connect(acc1).approve(pair.address, 10);
      await pair.connect(router).swapIn(acc1Token0.address, acc1Token1.address, 10, 18, acc1.address);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9890);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19818);
    });

    it("swapOut should be swap of token0 to token1 if maxAmountIn >= amountIn", async () => {
      await acc1Token0.connect(acc1).approve(pair.address, 10);
      await pair.connect(router).swapOut(acc1Token0.address, acc1Token1.address, 18, 10, acc1.address); // amountIn == 9.99
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9891);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19818);
    });

    it("should be error if amountOut more than minAmountOut", async () => {
      await acc1Token0.connect(acc1).approve(pair.address, 10);
      await expect(pair.connect(router).swapIn(acc1Token0.address, acc1Token1.address, 10, 20, acc1.address)).to.be.revertedWith('amountOut less than minAmountOut');
    });

    it("should be error if maxAmountIn more than amountIn", async () => {
      await acc1Token0.connect(acc1).approve(pair.address, 10);
      await expect(pair.connect(router).swapOut(acc1Token0.address, acc1Token1.address, 20, 10, acc1.address)).to.be.revertedWith('maxAmountIn less than amountIn');
    });
  });
});