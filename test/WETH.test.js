const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WETH", function () {
  let acc1;
  let acc2;
  let weth;

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();
    const WETH = await ethers.getContractFactory("WETH", acc1);
    weth = await WETH.deploy();
    await weth.deployed();
  })

  it("should be deployed", async function () {
    expect(weth.address).to.be.properAddress;
  });

  it("name should be equal Wrapped ETH", async function () {
    expect(await weth.name()).to.be.eq('Wrapped ETH')
  });

  it("symbol should be equal WETH", async function () {
    expect(await weth.symbol()).to.be.eq('WETH')
  });

  it("decimals should be equal 18", async function () {
    expect(await weth.decimals()).to.be.eq(18)
  });

  it("totalSupply should be equal 0", async function () {
    expect(await weth.totalSupply()).to.be.eq(0)
  });

  it("should have 0 ethers by default", async function () {
    expect(await weth.currentBalance()).to.be.eq(0)
  });

  it("should be possible to send funds", async function () {
    const sum = 100;
    const tx = await weth.wrapped({ value: sum });
    await tx.wait();

    await expect(() => tx).to.changeEtherBalance(acc1, -sum);
    await expect(() => tx).to.changeEtherBalances([acc1, weth], [-sum, sum]);
    expect(await weth.currentBalance()).to.be.eq(sum)
    expect(await weth.totalSupply()).to.be.eq(sum);
    expect(await weth.balanceOf(acc1.address)).to.be.eq(sum);
  });

  it("should be able to withdraw funds", async function () {
    const sum = 100;
    const tx = await weth.wrapped({ value: sum });
    await tx.wait();

    const sumOut = 50;
    await weth.unwrapped(acc1.address, sumOut);
    expect(await weth.currentBalance()).to.be.eq(sumOut)
    expect(await weth.totalSupply()).to.be.eq(sumOut);
    expect(await weth.balanceOf(acc1.address)).to.be.eq(sumOut);
  });

  it("another account cannot withdraw funds", async function () {
    const sum = 100;
    const tx = await weth.wrapped({ value: sum });
    await tx.wait();

    const sumOut = 50;
    await expect(weth.connect(acc2).unwrapped(acc2.address, sumOut)).to.be.revertedWith('ERC20: burn amount exceeds balance');
  });
});