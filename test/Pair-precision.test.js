const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

const decimals = BigInt(10**18);
const token0Amount = BigInt(10000n * decimals);
const token1Amount = BigInt(20000n * decimals);

describe("getTokenPrice", function () {
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
      .deploy(token0Amount))
      .deployed();
    token1 = await (await (await ethers.getContractFactory('LampCoin', acc1))
      .deploy(token1Amount))
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

  it("возвращает правильные цены", async function () {
    const txToken0 = 100n * decimals;
    const txToken1 = 200n * decimals;

    await token0Contract.connect(acc1).approve(pairContract.address, txToken0);
    await token1Contract.connect(acc1).approve(pairContract.address, txToken1);
    await pairContract.connect(acc1).createDeposit(txToken0, txToken1);

    const value0 = await pairContract.getTokenPrice(token0Contract.address, 1n * decimals)
    const value1 = await pairContract.getTokenPrice(token1Contract.address, 1n * decimals)

    expect((value0 / BigNumber.from(decimals)).toString()).to.be.eq('1.960590157441331');
    expect((value1 / BigNumber.from(decimals)).toString()).to.be.eq('0.4925618189959699');
  });

});