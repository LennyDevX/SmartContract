const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("StakingContract", function() {
  let contract, owner, addr1;
  let totalCommission;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

    const StakingContract = await ethers.getContractFactory("StakingContract");
    contract = await StakingContract.deploy(owner.address);
    await contract.deployed();
    totalCommission = ethers.utils.parseEther("0");
  });
  
  it("Should deposit successfully and increase total pool balance", async function () {
    const depositAmount = ethers.utils.parseEther("1");
    const numOfDeposits = 3;

    // Contract should initially acknowledge 0 deposits
    expect(await contract.getTotalDeposited(addr1.address)).to.equal(0);

    // Make deposits from depositor account
    for(let i = 0; i < numOfDeposits; i++) {
        await contract.connect(addr1).deposit({ value: depositAmount });

        // Getting the commission percentage
        const COMMISSION_PERCENTAGE = await contract.COMMISSION_PERCENTAGE(); 
        let commission = depositAmount.mul(COMMISSION_PERCENTAGE).div(10000);
        totalCommission = totalCommission.add(commission);
        let depositAmountAfterCommission = depositAmount.sub(commission);

        // Check the total number of deposits
        const totalDeposited = await contract.getTotalDeposited(addr1.address);
        expect(totalDeposited).to.be.at.least(depositAmountAfterCommission.mul(i + 1)); // Due to Solidity rounding errors

        console.log(`Deposit ${i + 1} from addr1: ${ethers.utils.formatEther(depositAmountAfterCommission)} ETH, commission deducted: ${ethers.utils.formatEther(commission)} ETH`);
    }

    let totalDeposited = await contract.getTotalDeposited(addr1.address);  // Total deposited by the user after commission.
    let totalPoolBalance = await contract.totalPoolBalance();   // Total balance of the pool.

    console.log("Total deposited by addr1 (after commission): ", ethers.utils.formatEther(totalDeposited)); 
    console.log("Total commission deducted: ", ethers.utils.formatEther(totalCommission));
    console.log("Total balance of the pool: ", ethers.utils.formatEther(totalPoolBalance));
    console.log("Total contract balance: ", ethers.utils.formatEther(await ethers.provider.getBalance(contract.address)));
  });
});