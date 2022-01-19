const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken",  () => {
  it("Should conform to ERC20 standards", async () => {
    const [owner,user1,user2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    const mytoken = await MyToken.deploy(100);
    await mytoken.deployed();
    // Check Total Supply
    expect(await mytoken.totalSupply()).to.equal(100);
    // Check Standard Transfer
    await mytoken.transfer(user1.address,20);
    expect(await mytoken.balanceOf(owner.address)).to.equal(80);
    expect(await mytoken.balanceOf(user1.address)).to.equal(20);
  });
});
