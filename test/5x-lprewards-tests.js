const { expect } = require("chai");
const { ethers } = require("hardhat");
const pairJson = require("@uniswap/v2-core/build/UniswapV2Pair.json");
const factoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

const mineBlocks = async (n) => {
  for (let index = 0; index < n; index++) {
    await ethers.provider.send('evm_mine');
  }
}

describe("Staking MyToken-USDT LP Tokens To Get Rewards",  () => {
  let mytoken,usdt,masterchef,owner,developer,user1,user2,deadline,uniswapPair;

  before(async () => {
    [owner,developer,user1,user2] = await ethers.getSigners();
    deadline = (await ethers.provider.getBlock('latest')).timestamp * 2;
    const MyToken = await ethers.getContractFactory("MyToken");
    mytoken = await MyToken.deploy(ethers.utils.parseEther('10000'));
    await mytoken.deployed();
    const startBlock = await ethers.provider.getBlockNumber();
    const endBlock = startBlock + (50);
    const MasterChef = await ethers.getContractFactory("MasterChef");
    masterchef = await MasterChef.deploy(mytoken.address,ethers.utils.parseEther('100'),startBlock,endBlock);
    await masterchef.deployed();

    // Deploy USDT but could be any ERC20
    const USDT = await ethers.getContractFactory("MyToken");
    usdt = await USDT.deploy(ethers.utils.parseEther('5000'));
    await usdt.deployed();

    // Set Up Factory
    this.uniswapFactory = await (new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode, owner)).deploy(ethers.constants.AddressZero);
    this.uniswapRouter = await (new ethers.ContractFactory(routerJson.abi, routerJson.bytecode, owner)).deploy(this.uniswapFactory.address,usdt.address);

    // Approve tokens, and then create Uniswap v2 pair against WETH and add liquidity
    // Note that the function takes care of deploying the pair automatically
    const initialTokenAmount = ethers.utils.parseEther('10');
    await mytoken.approve(this.uniswapRouter.address, initialTokenAmount);
    const initialUSDTAmount = ethers.utils.parseEther('500');
    await usdt.approve(this.uniswapRouter.address, initialUSDTAmount);
    
    await this.uniswapRouter.addLiquidity(
      mytoken.address,
      usdt.address,
      initialTokenAmount,
      initialUSDTAmount,
      1,
      1,
      owner.address,
      deadline,
    );

    // Get a reference to the created Uniswap pair
    const UniswapPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, owner);
    uniswapPair = await UniswapPairFactory.attach(
      await this.uniswapFactory.getPair(mytoken.address, usdt.address)
    );
  });

  it("Check liquidity pool addresses", async () => {
    expect(await uniswapPair.token0()).to.be.oneOf([usdt.address,mytoken.address]);
    expect(await uniswapPair.token1()).to.be.oneOf([usdt.address,mytoken.address]);
    expect(await uniswapPair.balanceOf(owner.address)).to.be.gt('0');
  });

  it("Need to transfer ownership of token to masterchef contract", async () => {
    mytoken.transferOwnership(masterchef.address); // Important Ensure The MasterChef is Token Owner
  });

  it("Should add a staking pool", async () => {
    masterchef.add(1,uniswapPair.address,true);
  });

  it("Try staking lp tokens", async () => {
    // Provide Liquidity
    const tokenAmount = ethers.utils.parseEther('10');
    await mytoken.transfer(user1.address, tokenAmount);
    const usdtAmount = ethers.utils.parseEther('500');
    await usdt.transfer(user1.address, usdtAmount);
    await mytoken.connect(user1).approve(this.uniswapRouter.address, tokenAmount);
    await usdt.connect(user1).approve(this.uniswapRouter.address, usdtAmount);
    await this.uniswapRouter.connect(user1).addLiquidity(mytoken.address, usdt.address, tokenAmount, usdtAmount, 0, 0, user1.address, deadline);
    let user1Balance = await mytoken.balanceOf(user1.address);
    expect(user1Balance).to.lt(tokenAmount);
    const lpBalance = await uniswapPair.balanceOf(user1.address);
    expect(await uniswapPair.balanceOf(owner.address)).to.be.gt('0');
    // Stake LP Tokens
    await uniswapPair.connect(user1).approve(masterchef.address,lpBalance);
    await masterchef.connect(user1).deposit(0,lpBalance);
    user1Balance = await mytoken.balanceOf(user1.address);
    await mineBlocks(50);
    await masterchef.connect(user1).withdraw(0,lpBalance);
    user1Balance = await mytoken.balanceOf(user1.address);
    expect(await mytoken.totalSupply()).to.gt(20);
  });


});

