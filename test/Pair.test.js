const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pair", function () {
  let acc1;
  let acc2;
  let factory;
  let token0;
  let token1;
  let pair;
  let Pair;
  let pairContract;
  let Token;
  let token0Contract;
  let token1Contract;
  let token0TrueAddress;
  let token1TrueAddress;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('Factory', acc1);
    factory = await (await Factory.deploy()).deployed();
    token0 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(10000))
      .deployed();
    token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(20000))
      .deployed();
    await factory.createPair(token0.address, token1.address);
    pair = await factory.getPair(token0.address, token1.address);
    Pair = require("../artifacts/contracts/Pair.sol/Pair.json");
    pairContract = new ethers.Contract(pair, Pair.abi, acc1);
    Token = require("../artifacts/contracts/LampCoin.sol/LampCoin.json");
    token0TrueAddress = await pairContract.token0();
    token1TrueAddress = await pairContract.token1();
    token0Contract = new ethers.Contract(token0TrueAddress, Token.abi, acc1);
    token1Contract = new ethers.Contract(token1TrueAddress, Token.abi, acc2);
  })

  it("контракт пары должен быть задеплоен", async function () {
    expect(pairContract.address).to.be.properAddress;
  });

  it("totalSupply должен быть равен 0", async function () {
    const balance = await pairContract.totalSupply();
    expect(balance).to.be.equal(0);
  });

  describe("createDeposit", async () => {
    beforeEach(async () => {
      await token0Contract.connect(acc1).approve(pairContract.address, 100);
      await token1Contract.connect(acc1).approve(pairContract.address, 200);
    });

    it("должно быть выдано подтверждение для transferFrom", async () => {
      expect(await token0Contract.allowance(acc1.address, pairContract.address)).to.be.eq(100);
      expect(await token1Contract.allowance(acc1.address, pairContract.address)).to.be.eq(200);
    });

    it("ликвидность должна добавиться", async () => {
      await pairContract.connect(acc1).createDeposit(100, 200);
      expect(await token0Contract.balanceOf(pairContract.address)).to.be.eq(100);
      expect(await token1Contract.balanceOf(pairContract.address)).to.be.eq(200);
      
      const reserves = await pairContract.getReserves();
      expect(reserves[0]).to.be.eq(100);
      expect(reserves[1]).to.be.eq(200);
    });

    it("должен добавить нулевую ликвидность", async () => {
      await token0Contract.connect(acc1).approve(pairContract.address, 0);
      await token1Contract.connect(acc1).approve(pairContract.address, 0);
      await pairContract.connect(acc1).createDeposit(0, 0);

      const reserves = await pairContract.getReserves();
      expect(reserves[0]).to.be.eq(0);
      expect(reserves[1]).to.be.eq(0);
    });

    it("ликвидность должна добавляться в правильном соотношении, иначе ошибка", async () => {
      await token0Contract.connect(acc1).approve(pairContract.address, 100);
      await token1Contract.connect(acc1).approve(pairContract.address, 200);
      await pairContract.connect(acc1).createDeposit(10, 20)
      await expect(pairContract.connect(acc1).createDeposit(10, 40)).to.be.revertedWith('Insufficient token0 amount')
      await expect(pairContract.connect(acc1).createDeposit(20, 20)).to.be.revertedWith('Insufficient token1 amount')

      const reserves = await pairContract.connect(acc1).getReserves();
      expect(reserves[0]).to.be.eq(10);
      expect(reserves[1]).to.be.eq(20);
    });

    it("должен сминтить LP tokens (300LP)", async () => {
      await pairContract.connect(acc1).createDeposit(100, 200);
      expect(await pairContract.balanceOf(acc1.address)).to.be.eq(300);
    });

    it("totalSupply должен быть равен 300", async () => {
      await pairContract.connect(acc1).createDeposit(100, 200);
      expect(await pairContract.totalSupply()).to.be.eq(300);
    });
  });

  describe("Tokens swap", async () => {
    beforeEach(async () => {
      await token0Contract.connect(acc1).approve(pairContract.address, 100);
      await token1Contract.connect(acc1).approve(pairContract.address, 200);
      await pairContract.connect(acc1).createDeposit(100, 200);
    });
    
    
    it("цена token1 за 10 tokens0 должна равняться 18 token1", async () => {
      expect(await pairContract.getTokenPrice(token0Contract.address, 10)).to.be.eq(18);
    });
    
    it("должен обменять token0 на token1", async () => {
      await token0Contract.connect(acc1).approve(pairContract.address, 10);
      await pairContract.connect(acc1).swap(token0Contract.address, 10);
      
      expect(await token0Contract.balanceOf(pairContract.address)).to.be.eq(110);
      expect(await token1Contract.balanceOf(pairContract.address)).to.be.eq(182);

      expect(await token0Contract.balanceOf(acc1.address)).to.be.eq(9890);
      expect(await token1Contract.balanceOf(acc1.address)).to.be.eq(19818);
    });

  describe("Removed liquidity", async () => {
    beforeEach(async () => {
      await token0Contract.connect(acc1).approve(pairContract.address, 100);
      await token1Contract.connect(acc1).approve(pairContract.address, 200);
      await pairContract.connect(acc1).createDeposit(100, 200);
      await token0Contract.connect(acc1).approve(pairContract.address, 10);
      await pairContract.connect(acc1).swap(token0Contract.address, 10);
    });
    
    it("после удаления ликвидности средства должны вернуться на счет с комиссией, а LP должны быть сожжены", async () => {
      await pairContract.connect(acc1).removeLiquidity(300);
      expect(await pairContract.balanceOf(acc1.address)).to.be.eq(0);
      expect(await token0Contract.balanceOf(pairContract.address)).to.be.eq(0);
      expect(await token1Contract.balanceOf(pairContract.address)).to.be.eq(0);
      expect(await token0Contract.balanceOf(acc1.address)).to.be.eq(10000);
      expect(await token1Contract.balanceOf(acc1.address)).to.be.eq(20000);
    });
  });
});