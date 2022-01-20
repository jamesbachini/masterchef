const { expect } = require("chai");
const { ethers } = require("hardhat");
const pairJson = require("@uniswap/v2-core/build/UniswapV2Pair.json");
const factoryJson = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerJson = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");

describe("MyToken-ETH Liquidity Pool",  () => {
  let mytoken,masterchef,owner,developer,user1,user2,deadline,uniswapPair;

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

    // Deploy WETH
    this.weth = await (await ethers.getContractFactory('WETH9', owner)).deploy();

    // Set Up Factory
    this.uniswapFactory = await (new ethers.ContractFactory(factoryJson.abi, factoryJson.bytecode, owner)).deploy(ethers.constants.AddressZero);
    this.uniswapRouter = await (new ethers.ContractFactory(routerJson.abi, routerJson.bytecode, owner)).deploy(this.uniswapFactory.address,this.weth.address);

    // Approve tokens, and then create Uniswap v2 pair against WETH and add liquidity
    // Note that the function takes care of deploying the pair automatically
    const initialTokenAmount = ethers.utils.parseEther('10');
    await mytoken.approve(this.uniswapRouter.address, initialTokenAmount);
    
    await this.uniswapRouter.addLiquidityETH(
      mytoken.address,                                                                       // token to be traded against WETH
      initialTokenAmount,                                                                  // amountTokenDesired
      1,                                                                                                   // amountTokenMin
      1,                                                                                                   // amountETHMin
      owner.address,                                                                          // to
      deadline,
      { value: 10 }
    );

    // Get a reference to the created Uniswap pair
    const UniswapPairFactory = new ethers.ContractFactory(pairJson.abi, pairJson.bytecode, owner);
    uniswapPair = await UniswapPairFactory.attach(
      await this.uniswapFactory.getPair(mytoken.address, this.weth.address)
    );
  });

  it("Check liquidity pool addresses", async () => {
    expect(await uniswapPair.token0()).to.be.oneOf([this.weth.address,mytoken.address]);
    expect(await uniswapPair.token1()).to.be.oneOf([this.weth.address,mytoken.address]);
    expect(await uniswapPair.balanceOf(owner.address)).to.be.gt('0');
  });

  it("Need to transfer ownership of token to masterchef contract", async () => {
    mytoken.transferOwnership(masterchef.address); // Important Ensure The MasterChef is Token Owner
  });

  it("Should add a staking pool", async () => {
    masterchef.add(1,mytoken.address,true);
  });

  it("Try providing liquidity", async () => {
    const amount = ethers.utils.parseEther('10');
    await mytoken.transfer(user1.address, amount);
    await mytoken.connect(user1).approve(this.uniswapRouter.address, amount);
    await this.uniswapRouter.connect(user1).addLiquidityETH(mytoken.address, amount, 0, 0, user1.address, deadline, { value: 3 });
    let user1Balance = await mytoken.balanceOf(user1.address);
    expect(user1Balance).to.lt(amount);
    const lpBalance = await uniswapPair.balanceOf(user1.address);
    expect(await uniswapPair.balanceOf(owner.address)).to.be.gt('0');
  });


});

