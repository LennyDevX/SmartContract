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
    const depositAmount = ethers.utils.parseEther("100");
    await staking.connect(owner).deposit({ value: depositAmount });

    const depositInContract = await staking.getTotalDeposit(owner.address);
    expect(ethers.utils.formatEther(depositInContract)).to.equal('95.0');  // 11 - 5%

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
    const depositAmount = ethers.utils.parseEther("100");
    await expect(staking.connect(addr1).deposit({value: depositAmount})).to.be.revertedWith("Pausable: paused");
    console.log(`Deposit failed when contract is paused`)
  });

  it("Should allow claim rewards when contract is not paused and there are rewards", async function () {
    const depositAmount = ethers.utils.parseEther("100");
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
    const depositAmount = ethers.utils.parseEther("100");
    await staking.connect(owner).deposit({value: depositAmount});

    await staking.connect(owner).pause();

    await expect(staking.connect(owner).claimRewards()).to.be.revertedWith("Pausable: paused");
    console.log(`Claim rewards failed when contract is paused`)
    
  });

 it("Should calculate accumulated rewards over 7 days and allow to claim and withdraw them with commission", async function () {
       // First deposit an amount
       const depositAmount = ethers.utils.parseEther("100");
       const depositResult = await staking.connect(owner).deposit({value: depositAmount});
       const depositResultData = await depositResult.wait();
       let commissionFeeDeposit = depositResultData.events.pop().args.commission;
       let actualAmount = depositAmount.sub(commissionFeeDeposit);
 
       // Calculate rewards for 7 days
       let rewards = ethers.utils.parseEther("0"); // Initialize rewards to 0
       for (let i = 0; i < 7 * 24; i++) { // 7 days * 24 hours
           // Advance time by 1 hour
           await ethers.provider.send("evm_increaseTime", [3600]); // 3600 seconds in an hour
           await ethers.provider.send("evm_mine");  // Mine the next block
 
           // Calculate rewards
           let rewardsEndOfHour = await staking.calculateRewards(owner.address);
           console.log(`Hour ${Math.floor(i / 24) + 1}, Minute ${(i % 24) * 60}: ${ethers.utils.formatEther(rewardsEndOfHour)} rewards`);
 
           // Add to the total
           rewards = rewards.add(rewardsEndOfHour);
       }
 
       // Now claim rewards
       await staking.connect(owner).claimRewards();
 
       // Calculate commission fee just before withdrawal
       let commissionFeeClaim = rewards.mul(5).div(100); // 5% commission
       let rewardsActual = rewards.sub(commissionFeeClaim);
 
       let balanceBefore = await ethers.provider.getBalance(owner.address);
       await staking.connect(owner).withdrawRewards();
       let balanceAfter = await ethers.provider.getBalance(owner.address);
 
       // Check that the balance after withdrawing is greater than the balance before
       expect(balanceAfter).to.be.gt(balanceBefore);
 
       console.log(`Actual deposit after 5% fee: ${ethers.utils.formatEther(actualAmount)}`);
       console.log(`Actual withdrawn rewards: ${ethers.utils.formatEther(balanceAfter.sub(balanceBefore))}`);
   })})
 
 
 
 