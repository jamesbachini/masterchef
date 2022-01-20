const { expect } = require("chai");
const { ethers } = require("hardhat");

const mineBlocks = async (n) => {
  for (let index = 0; index < n; index++) {
    await ethers.provider.send('evm_mine');
  }
}

describe("MasterChef",  () => {
  let mytoken,masterchef,owner,developer,user1,user2;

  before(async () => {
    [owner,developer,user1,user2] = await ethers.getSigners();
    const MyToken = await ethers.getContractFactory("MyToken");
    mytoken = await MyToken.deploy(ethers.utils.parseEther('100'));
    await mytoken.deployed();
    const startBlock = await ethers.provider.getBlockNumber();
    const endBlock = startBlock + (50);
    const MasterChef = await ethers.getContractFactory("MasterChef");
    masterchef = await MasterChef.deploy(mytoken.address,ethers.utils.parseEther('100'),startBlock,endBlock);
    await masterchef.deployed();

  });

  it("Need to transfer ownership of token to masterchef contract", async () => {
    mytoken.transferOwnership(masterchef.address); // Important Ensure The MasterChef is Token Owner
  });

  it("Should add a staking pool", async () => {
    masterchef.add(1,mytoken.address,true);
  });

  it("Should try staking", async () => {
    await mytoken.transfer(user1.address,ethers.utils.parseEther('20'));
    await mytoken.connect(user1).approve(masterchef.address,ethers.utils.parseEther('10'));
    await masterchef.connect(user1).deposit(0,ethers.utils.parseEther('10'));
    let user1Balance = await mytoken.balanceOf(user1.address);
    await mineBlocks(10);
    await masterchef.connect(user1).withdraw(0,ethers.utils.parseEther('10'));
    user1Balance = await mytoken.balanceOf(user1.address);
    expect(await mytoken.totalSupply()).to.gt(20);
  });

  it("Should try to exploit with flash loan", async () => {
    await mytoken.transfer(user2.address,ethers.utils.parseEther('10'));
    await mytoken.connect(user2).approve(masterchef.address,ethers.utils.parseEther('10'));
    await masterchef.connect(user2).deposit(0,ethers.utils.parseEther('10'));
    await masterchef.connect(user2).updatePool(0);
    await masterchef.connect(user2).withdraw(0,ethers.utils.parseEther('10'));
    await ethers.provider.send('evm_mine');
    const user2Balance = await mytoken.balanceOf(user2.address);
    expect(user2Balance).to.gt(ethers.utils.parseEther('10'));
  });

  it("Should stop pumping out rewards", async () => {
    await mytoken.connect(user1).approve(masterchef.address,ethers.utils.parseEther('10'));
    await masterchef.connect(user1).deposit(0,ethers.utils.parseEther('10'));
    let user1Balance = await mytoken.balanceOf(user1.address);
    await mineBlocks(50);
    await masterchef.connect(user1).withdraw(0,ethers.utils.parseEther('10'));
    const finalUser1Balance = await mytoken.balanceOf(user1.address);
    await mytoken.connect(user1).approve(masterchef.address,ethers.utils.parseEther('10'));
    await masterchef.connect(user1).deposit(0,ethers.utils.parseEther('10'));
    await mineBlocks(50);
    await masterchef.connect(user1).withdraw(0,ethers.utils.parseEther('10'));
    user1Balance = await mytoken.balanceOf(user1.address);
    expect(finalUser1Balance).to.eq(user1Balance);
  });

});

