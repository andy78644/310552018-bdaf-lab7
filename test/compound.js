const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    
    //Connect provider to local fork blocknumber
    const provider = new ethers.providers.Web3Provider(network.provider)

    //Interact with compound contract
    const CompoundAddress = "0xc3d688B66703497DAA19211EEdff47f25384cdc3";
    const contractabi = require("./contractabi.json");
    const compoundContract = new ethers.Contract(CompoundAddress, contractabi, provider);
    
    //Interact with USDC contract, USDC decimal is 6
    const USDCAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    const USDCabi = require("./USDCabi.json");
    const USDC = new ethers.Contract(USDCAddress, USDCabi, provider)

    //Show USDC in compound contract
    let  compoundUSDC = await USDC.balanceOf(CompoundAddress);
    compoundUSDC = await compoundUSDC.toString();
    console.log("compoundContract init USDC", compoundUSDC);

    //Impersonate to Alice account and show USDC in Alice account
    const AliceAddress = "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503"
    const AliceSigner = await ethers.getImpersonatedSigner(AliceAddress);
    let  AliceUSDC = await USDC.balanceOf(AliceSigner.address);
    AliceUSDC = await AliceUSDC.toString();

    //approve Alice's USDC to compound contract
    //Supply some USDC to compound
    await USDC.connect(AliceSigner).approve(CompoundAddress, ethers.constants.MaxUint256);
    await compoundContract.connect(AliceSigner).supply(USDCAddress, ethers.utils.parseUnits('1000', 6));

    //Show USDC in compound after Alice supply USDC
    compoundUSDC = await USDC.balanceOf(CompoundAddress);
    compoundUSDC = await compoundUSDC.toString();
    console.log("compoundContract's USDC after Alice provides", compoundUSDC);

    //Impersonate to Bob account and show Bob eth
    const BobAddress = "0x00000000219ab540356cBB839Cbe05303d7705Fa"
    const BobSigner = await ethers.getImpersonatedSigner(BobAddress);
    const BobBalance = await provider.getBalance(BobAddress)
    console.log("Bob eth ", BobBalance)

    //Interact with weth contract, weth decimal is 18
    const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const WETHabi = require("./WETHabi.json");
    const WETH = new ethers.Contract(WETHAddress, WETHabi, provider)
    
    //deposite a lot of weth
    await WETH.connect(BobSigner).deposit({ value: ethers.utils.parseEther('100000') });
    let BobWETH = await WETH.balanceOf(BobAddress);
    BobWETH = await BobWETH.toString();
    console.log("Bob WETH :", BobWETH)

    //approve Bob's WETH to compound contract
    //Supply amount of WETH to compound
    await WETH.connect(BobSigner).approve(CompoundAddress, ethers.constants.MaxUint256);
    await compoundContract.connect(BobSigner).supply(WETHAddress, ethers.utils.parseUnits('100000', 18));

    //Bob withdraw all USDC
    await compoundContract.connect(BobSigner).withdraw(USDCAddress, compoundUSDC);

    //Show USDC in compound after Alice supply USDC
    compoundUSDC = await USDC.balanceOf(CompoundAddress);
    compoundUSDC = await compoundUSDC.toString();
    console.log("compoundContract's USDC after Bob withdraw", compoundUSDC);
    
    //Alice withdraw 1000 USDC
    await compoundContract.connect(AliceSigner).withdraw(USDCAddress, ethers.utils.parseUnits('1000', 6));
  });
});

const numberWithCommas = async (val, decimal) => {
    const afterDecimal = await val.slice(-decimal, val.length)
    const beforeDecimal = await val.slice(0, -decimal)
    return beforeDecimal.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + "." + afterDecimal;
}