const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Router", function () {
  let acc1;
  let acc2;
  let router;
  let registry;
  let factory;
  let acc1Token0;
  let acc1Token1;
  let fee;
  let pair;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();

    acc1Token0 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenA", "LTA", 10000))
      .deployed();
    acc1Token1 = await (await (await ethers.getContractFactory('ERC20Token', acc1))
      .deploy("LampTokenB", "LTB", 20000))
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
    await factory.createPair(acc1Token0.address, acc1Token1.address);

    const pairAddress = await registry.getPair(acc1Token0.address, acc1Token1.address)
    const Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
    pair = new ethers.Contract(pairAddress, Pair.abi, acc1);
  })

  it("should be deployed", async function () {
    expect(router.address).to.be.properAddress;
  });

  describe("addLiquidity", async () => {
    beforeEach(async () => {
      await acc1Token0.connect(acc1).approve(router.address, 100);
      await acc1Token1.connect(acc1).approve(router.address, 200);
    });

    it("should be approval transfer funds from tokens to pair", async function () {
      expect(await acc1Token0.allowance(acc1.address, router.address)).to.be.eq(100);
      expect(await acc1Token1.allowance(acc1.address, router.address)).to.be.eq(200);
    });

    it("token contracts balance in acc1 should decrease", async function () {
      await router.addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9900);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19800);
    });

    it("pair balance should increase", async function () {
      await router.addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await acc1Token0.balanceOf(pair.address)).to.be.eq(100);
      expect(await acc1Token1.balanceOf(pair.address)).to.be.eq(200);
    });

    it("acc1 LPToken balance should increase", async function () {
      await router.addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await pair.balanceOf(acc1.address)).to.be.eq(300);
    });

    it("pair totalSupply should increase", async function () {
      await router.addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
      expect(await pair.totalSupply()).to.be.eq(300);
    });
  });

  describe("acc2 addLiquidity", async () => {
    beforeEach(async () => {
      await acc1Token0.transfer(acc2.address, 5000);
      await acc1Token1.transfer(acc2.address, 5000);

      await acc1Token0.connect(acc1).approve(router.address, 100);
      await acc1Token1.connect(acc1).approve(router.address, 200);

      await acc1Token0.connect(acc2).approve(router.address, 200);
      await acc1Token1.connect(acc2).approve(router.address, 400);

      await router.connect(acc1).addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
    });

    it("token contracts balance in acc2 should decrease", async function () {
      await router.connect(acc2).addLiquidity(acc1Token0.address, acc1Token1.address, 200, 400);
      expect(await acc1Token0.balanceOf(acc2.address)).to.be.eq(4800);
      expect(await acc1Token1.balanceOf(acc2.address)).to.be.eq(4600);
    });

    it("pair balance acc2 should increase", async function () {
      await router.connect(acc2).addLiquidity(acc1Token0.address, acc1Token1.address, 200, 400);
      expect(await acc1Token0.balanceOf(pair.address)).to.be.eq(300);
      expect(await acc1Token1.balanceOf(pair.address)).to.be.eq(600);
    });

    it("acc2 LPToken balance should increase", async function () {
      await router.connect(acc2).addLiquidity(acc1Token0.address, acc1Token1.address, 200, 400);
      expect(await pair.balanceOf(acc2.address)).to.be.eq(600);
    });

    it("pair totalSupply should increase", async function () {
      await router.connect(acc2).addLiquidity(acc1Token0.address, acc1Token1.address, 200, 400);
      expect(await pair.totalSupply()).to.be.eq(900);
    });

    it("should return error message when added incorrect liquidity", async function () {
      await expect(router.connect(acc2).addLiquidity(acc1Token0.address, acc1Token1.address, 199, 400)).to.be.revertedWith('Insufficient token0 amount');
      await expect(router.connect(acc2).addLiquidity(acc1Token0.address, acc1Token1.address, 200, 399)).to.be.revertedWith('Insufficient token1 amount');
    });
  });

  describe("Removed liquidity", async () => {
    beforeEach(async () => {
      await acc1Token0.connect(acc1).approve(router.address, 100);
      await acc1Token1.connect(acc1).approve(router.address, 200);

      await router.addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
    });

    it("should be removed liquidity acc1", async function () {
      await router.connect(acc1).removeLiquidity(acc1Token0.address, acc1Token1.address, 300);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(10000);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(20000);
    });
  });

  describe("Tokens swap", async () => {
    beforeEach(async () => {
      await acc1Token0.connect(acc1).approve(router.address, 100);
      await acc1Token1.connect(acc1).approve(router.address, 200);

      await router.addLiquidity(acc1Token0.address, acc1Token1.address, 100, 200);
    });

    it("swapIn should be swap of token0 to token1 if amountOut >= minAmountOut", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await router.swapIn(acc1Token0.address, acc1Token1.address, 10, 18);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9890);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19818);
    });

    it("swapIn should be swap of token1 to token0 if amountOut >= minAmountOut", async () => {
      await acc1Token1.connect(acc1).approve(router.address, 18);
      await router.swapIn(acc1Token1.address, acc1Token0.address, 18, 8);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9908);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19782);
    });

    it("swapOut should be swap of token0 to token1 if maxAmountIn >= amountIn", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await router.swapOut(acc1Token0.address, acc1Token1.address, 18, 10);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9891);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19818);
    });

    it("swapOut should be swap of token1 to token0 if maxAmountIn >= amountIn", async () => {
      await acc1Token1.connect(acc1).approve(router.address, 22);
      await router.swapOut(acc1Token1.address, acc1Token0.address, 10, 22);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9910);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19778);
    });

    it("should be error if amountOut more than minAmountOut", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await expect(router.swapIn(acc1Token0.address, acc1Token1.address, 10, 20)).to.be.revertedWith('amountOut less than minAmountOut');
    });

    it("should be error if maxAmountIn more than amountIn", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await expect(router.swapOut(acc1Token0.address, acc1Token1.address, 20, 10)).to.be.revertedWith('maxAmountIn less than amountIn');
    });
  });

  describe("Tokens swap 2", async () => {
    beforeEach(async () => {
      await acc1Token0.connect(acc1).approve(router.address, 100);
      await acc1Token1.connect(acc1).approve(router.address, 100);

      await router.addLiquidity(acc1Token0.address, acc1Token1.address, 100, 100);
    });

    it("swapIn should be swap of token0 to token1 if amountOut >= minAmountOut", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await router.swapIn(acc1Token0.address, acc1Token1.address, 10, 9);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9890);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19909);
    });

    it("swapIn should be swap of token1 to token0 if amountOut >= minAmountOut", async () => {
      await acc1Token1.connect(acc1).approve(router.address, 10);
      await router.swapIn(acc1Token1.address, acc1Token0.address, 10, 9);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9909);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19890);
    });

    it("swapOut should be swap of token0 to token1 if maxAmountIn >= amountIn", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await router.swapOut(acc1Token0.address, acc1Token1.address, 9, 10);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9891);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19909);
    });

    it("swapOut should be swap of token1 to token0 if maxAmountIn >= amountIn", async () => {
      await acc1Token1.connect(acc1).approve(router.address, 10);
      await router.swapOut(acc1Token1.address, acc1Token0.address, 9, 10);
      expect(await acc1Token0.balanceOf(acc1.address)).to.be.eq(9909);
      expect(await acc1Token1.balanceOf(acc1.address)).to.be.eq(19891);
    });

    it("should be error if amountOut more than minAmountOut", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await expect(router.swapIn(acc1Token0.address, acc1Token1.address, 10, 20)).to.be.revertedWith('amountOut less than minAmountOut');
    });

    it("should be error if maxAmountIn more than amountIn", async () => {
      await acc1Token0.connect(acc1).approve(router.address, 10);
      await expect(router.swapOut(acc1Token0.address, acc1Token1.address, 20, 10)).to.be.revertedWith('maxAmountIn less than amountIn');
    });
  });
});