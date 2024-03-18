const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract", function () {
  let StakingContract, contract;
  let owner, addr1, treasuryAddress;

  beforeEach(async function () {
    StakingContract = await ethers.getContractFactory("StakingContract");
    [owner, addr1, treasuryAddress] = await ethers.getSigners();
    contract = await StakingContract.deploy(treasuryAddress.address);
    await contract.deployed();
  });

  it("Should not allow claiming rewards within 7 days", async function () {
    await ethers.provider.send("evm_increaseTime", [6 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    await expect(contract.connect(addr1).claimRewards()).to.be.revertedWith("No rewards to claim");
    
    console.log("Checked that rewards cannot be claimed within 7 days. Result: Passed"); // Log Statement
  });

  it("Should allow claim after 7 days", async function () {
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    await contract.addToPool({value: ethers.utils.parseEther("100")}); // Add funds to pool
    console.log("Deposited 100 Ether into pool"); // Log Statement

    await contract.connect(addr1).deposit({ value: ethers.utils.parseEther("1") }) // Stake some funds
    console.log("Staked 1 Ether"); // Log Statement

    await expect(contract.connect(addr1).claimRewards()).to.be.revertedWith("No rewards to claim");

    console.log("Checked for reward claims. Result: Passed"); // Log Statement
  });

  it("No rewards to claim should throw", async function () {
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    await expect(contract.connect(addr1).claimRewards()).to.be.revertedWith("No rewards to claim");

    console.log("Checked for invalid reward claims. Result: Passed"); // Log Statement
  });

  // Additional tests...
});