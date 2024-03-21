const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract", function () {
  let StakingContract, staking;
  let owner, addr1, addr2, addrs;
  let _treasury;

  beforeEach(async function () {
    StakingContract = await ethers.getContractFactory("StakingContract");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    _treasury = owner.address; // assuming owner is the treasury

    staking = await StakingContract.deploy(_treasury);
  });

  it("Should deposit successfully and increase the total pool balance", async function () {
    // Make deposits from the owner account
    const depositAmount = ethers.utils.parseEther("11");
    await staking.connect(owner).deposit({ value: depositAmount });

    const depositInContract = await staking.getTotalDeposit(owner.address);
    expect(ethers.utils.formatEther(depositInContract)).to.equal('10.45');  // 11 - 5%

    console.log(`Deposit amount (after commision): ${ethers.utils.formatEther(depositInContract)}`);
  });

  it("Simulates a user process: deposit, rewards accrual and withdrawal, with commissions and calculate ROI", async function() {
    // Create a deposit of 100 Matic
    const depositAmount = ethers.utils.parseEther("100");
    await staking.connect(owner).deposit({value: depositAmount});

    // Check deposited amount after commission
    let balanceAfterDeposit = await staking.getTotalDeposit(owner.address);
    console.log(`Deposited amount after commission: ${ethers.utils.formatEther(balanceAfterDeposit)}`);

    // Advance time by 7 days
    await ethers.provider.send("evm_increaseTime", [7 * 86400]); 
    await ethers.provider.send("evm_mine");  

    // View the rewards without withdrawing (coming from the contract so no commission)
    let rewards = await staking.calculateRewards(owner.address);
    console.log(`Accumulated rewards after 7 days (no withdrawal): ${ethers.utils.formatEther(rewards)}`);

    // Claim rewards (withdraw but hold in contract balance, take 5% commission)
    await staking.connect(owner).claimRewards();

    // Consider 5% commission on claimed rewards
    rewards = rewards.sub(rewards.mul(5).div(100)); 
    
    // View the balance in contract after withdrawal (and commission)
    let balanceContractAfterWithdraw = await staking.getTotalDeposit(owner.address);
    console.log(`Balance in contract after withdrawal: ${ethers.utils.formatEther(balanceContractAfterWithdraw)}`);

    // Calculate and print ROI (Return on Investment), in percentage
    const ROI = rewards.mul(100).div(balanceAfterDeposit); // Multiply by 100 to get percentage
    console.log(`ROI after 7 days: ${ROI.toString()}%`);

    // Actual withdrawal to the owner's wallet
    let balanceBefore = await ethers.provider.getBalance(owner.address);
    await staking.connect(owner).withdrawRewards();
    let balanceAfter = await ethers.provider.getBalance(owner.address);
    
    console.log(`Rewards withdrawn to the wallet: ${ethers.utils.formatEther(balanceAfter.sub(balanceBefore))}`);
});

  it("Should not allow deposit when contract is paused", async function () {
    // Pause the contract
    await staking.connect(owner).pause();

    // Try to deposit
    const depositAmount = ethers.utils.parseEther("11");
    await expect(staking.connect(addr1).deposit({value: depositAmount})).to.be.revertedWith("Pausable: paused");
    console.log(`Deposit failed when contract is paused`)
  });

  it("Should allow claim rewards when contract is not paused and there are rewards", async function () {
    const depositAmount = ethers.utils.parseEther("11");
    await staking.connect(owner).deposit({value: depositAmount});

    // Advance time by 3 days using the helper function
    await ethers.provider.send("evm_increaseTime", [3 * 86400]); // 86400 seconds in a day
    await ethers.provider.send("evm_mine");  // Mine the next block
    // Calculate rewards before claim
    const rewards = await staking.calculateRewards(owner.address); // Check how much rewards the user has
    
    // Now claim rewards (withdraw)
    await staking.connect(owner).claimRewards();
    console.log(`Rewards: ${ethers.utils.formatEther(rewards)}`);

});

  it("Should not allow claims (rewards) when contract is paused", async function () {
    const depositAmount = ethers.utils.parseEther("11");
    await staking.connect(owner).deposit({value: depositAmount});

    await staking.connect(owner).pause();

    await expect(staking.connect(owner).claimRewards()).to.be.revertedWith("Pausable: paused");
    console.log(`Claim rewards failed when contract is paused`)
    
  });

  it("Should allow to claim rewards and then withdraw them considering commission", async function () {
    // First deposit an amount
    const depositAmount = ethers.utils.parseEther("20");

    const depositResult = await staking.connect(owner).deposit({value: depositAmount});
    const depositResultData = await depositResult.wait();
    let commissionFee = depositResultData.events.pop().args.amount;
    let actualAmount = depositAmount.sub(commissionFee);

    // Advance time by 7 days using the helper function
    await ethers.provider.send("evm_increaseTime", [7 * 86400]); // 86400 seconds in a day
    await ethers.provider.send("evm_mine");  // Mine the next block

    // Calculate rewards before withdrawal (considering commission)
    let rewardsBeforeWithdraw = await staking.calculateRewards(owner.address); 
    rewardsBeforeWithdraw = rewardsBeforeWithdraw.sub(rewardsBeforeWithdraw.mul(5).div(100)); // Subtract the 5% commission

    // Now claim rewards (withdraw)
    await staking.connect(owner).claimRewards();

    let balanceBefore = await ethers.provider.getBalance(owner.address);
    await staking.connect(owner).withdrawRewards();
    let balanceAfter = await ethers.provider.getBalance(owner.address);

    // Check that the balance after withdrawing is greater than the balance before
    expect(balanceAfter).to.be.gt(balanceBefore);
    
    console.log(`Actual deposit: ${ethers.utils.formatEther(actualAmount)} | Rewards before withdrawal: ${ethers.utils.formatEther(rewardsBeforeWithdraw)}`);
    console.log(`Balance before: ${ethers.utils.formatEther(balanceBefore)} | Balance after: ${ethers.utils.formatEther(balanceAfter)}`);
    console.log(`Rewards withdrawn: ${ethers.utils.formatEther(balanceAfter.sub(balanceBefore))}`);
});

  it("Should show the accumulated rewards over 7 days", async function () {
    // First deposit an amount
    const depositAmount = ethers.utils.parseEther("20");
    await staking.connect(owner).deposit({value: depositAmount});

    let totalRewards = ethers.utils.parseEther("0");
  
    for (let i = 0; i < 7; i++) {
        // Advance time by 1 day
        await ethers.provider.send("evm_increaseTime", [86400]); // 86400 seconds in a day
        await ethers.provider.send("evm_mine");  // Mine the next block
  
        // Calculate rewards
        let rewardsEndOfDay = await staking.calculateRewards(owner.address);
        console.log(`Day ${i + 1}: ${ethers.utils.formatEther(rewardsEndOfDay)} rewards`);

        // Add to total
        totalRewards = totalRewards.add(rewardsEndOfDay);
    }

    console.log(`Total rewards after 7 days: ${ethers.utils.formatEther(totalRewards)}`);
  });

});