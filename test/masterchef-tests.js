const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MasterChef",  () => {
  let mytoken,masterchef,owner,developer,user1,user2;

  before(async function () {
    [owner,developer,user1,user2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    mytoken = await MyToken.deploy(ethers.utils.parseEther('100'));
    await mytoken.deployed();
    const startBlock = await ethers.provider.getBlockNumber();
    const endBlock = startBlock + 86400;
    console.log('      Start Block: ',startBlock);
    const MasterChef = await ethers.getContractFactory("MasterChef");
    masterchef = await MasterChef.deploy(mytoken.address,developer.address,user1.address,ethers.utils.parseEther('100'),startBlock,endBlock);
    await masterchef.deployed();

  });

  it("Need to transfer ownership of token to masterchef contract", async () => {
    mytoken.transferOwnership(masterchef.address);
  });



  it("Should add a staking pool", async () => {
    masterchef.add(1,mytoken.address,true);
  });

  it("Should try staking", async () => {
    await mytoken.transfer(user1.address,ethers.utils.parseEther('20'));
    const pid = 0;
    await mytoken.connect(user1).approve(masterchef.address,ethers.utils.parseEther('10'));
    await masterchef.connect(user1).deposit(pid,ethers.utils.parseEther('10'));
    await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]); // ~1 days
    let user1Balance = await mytoken.balanceOf(user1.address);
    console.log('      User1 Balance: ',ethers.utils.formatEther(user1Balance).toString());
    await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]); // ~1 days
    await masterchef.connect(user1).withdraw(pid,ethers.utils.parseEther('10'));
    user1Balance = await mytoken.balanceOf(user1.address);
    console.log('      User1 Balance: ',ethers.utils.formatEther(user1Balance).toString());
    
    expect(await mytoken.totalSupply()).to.gt(20);
  });

});

