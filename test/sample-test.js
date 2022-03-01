const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LampCoin", function () {
  it("Should return nothing", async function () {
    const LampCoin = await ethers.getContractFactory("LampCoin");
    const lampCoin = await LampCoin.deploy(10000);
    await lampCoin.deployed();

  });
});