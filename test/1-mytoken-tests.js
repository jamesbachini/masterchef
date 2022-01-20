const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken",  () => {

  let owner,user1,user2,mytoken;

  before(async () => {
    [owner,user1,user2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    mytoken = await MyToken.deploy(100);
    await mytoken.deployed();
  });

  it("Should conform to ERC20 standards", async () => {
    // Check Total Supply
    expect(await mytoken.totalSupply()).to.equal(100);
    // Check Standard Transfer
    await mytoken.transfer(user1.address,20);
    expect(await mytoken.balanceOf(owner.address)).to.equal(80);
    expect(await mytoken.balanceOf(user1.address)).to.equal(20);
  });
  
  it("Should allow storage of cross-chain token contract addresses", async () => {
    // Add a cross chain address
    const arbitrumContract = '0xdEf165195Bc0d4727B66b4db67CCAa807EDF69d2';
    await mytoken.addCrossChainContract(69420,arbitrumContract);
    // Lookup cross chain address
    const arby = await mytoken.connect(user1).crossChainLookup(69420);
    expect(arbitrumContract).to.equal(arby);
  });
});
