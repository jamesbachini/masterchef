const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MasterChef",  () => {
  let mytoken,masterchef,owner,developer,user1,user2;

  before(async function () {
    [owner,developer,user1,user2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    mytoken = await MyToken.deploy(100);
    await mytoken.deployed();
    const startBlock = await ethers.provider.getBlockNumber();
    const endBlock = startBlock + 86400;
    console.log('      Start Block: ',startBlock);
    const MasterChef = await ethers.getContractFactory("MasterChef");
    masterchef = await MasterChef.deploy(mytoken.address,developer.address,user1.address,100,startBlock,endBlock);
    await masterchef.deployed();
  });

  it("Should add a staking pool", async () => {
    masterchef.add(1,mytoken.address,true);
  });

  it("Should try staking", async () => {
    await mytoken.transfer(user1.address,20);
    const pid = 1; // ?

    /*
    masterchef.connect(user1).deposit(pid,10);
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // 1 day
    const user1Balance = await mytoken.balanceOf(user1.address);
    console.log('      One Day Rewards: ',user1Balance - 20);
    expect(await mytoken.totalSupply()).to.gt(20); 
    */
  });

});

