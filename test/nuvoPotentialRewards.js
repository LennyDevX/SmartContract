const { ethers } = require("hardhat");

describe("StakingContract", function () {
  it("Should deploy and execute correctly", async function () {
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const [owner, treasury] = await ethers.getSigners();
    
    const contractInstance = await StakingContract.deploy(treasury.address);
    
    const depositValue = ethers.utils.parseEther("3"); // 1 ether deposit
    const oneDayInSeconds = 60*60*24;
    const decimals = 18;

    // Deposit
    await contractInstance.connect(owner).deposit({value: depositValue});
    console.log('Deposit successful');
  
    for (let i = 1; i <= 7; i++) {
      // Advance time by 1 day
      await ethers.provider.send("evm_increaseTime", [oneDayInSeconds]);
      await ethers.provider.send("evm_mine");
  
      // calculate and print rewards after i days
      const reward = await contractInstance.calculateRewards(owner.address);
      console.log(`Rewards after ${i} day(s): `, ethers.utils.formatUnits(reward, decimals), 'Eth');
    }
  
    // claim rewards
    await contractInstance.connect(owner).claimRewards();
    console.log('Rewards claimed');
  
    // Withdraw
    await contractInstance.connect(owner).withdraw(depositValue);
    console.log('Withdrawal successful');
  });
});