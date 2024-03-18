const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract", function () {
  let StakingContract, staking, owner, addr1;
  
  beforeEach(async function () {
    [owner, addr1, ...addrs] = await ethers.getSigners();

    StakingContract = await ethers.getContractFactory("StakingContract");
    staking = await StakingContract.deploy(owner.address);

    await owner.sendTransaction({ to: staking.address, value: ethers.utils.parseEther("100") });
  });

  it("Should withdraw successfully and decrease the total pool balance", async function () {
    // Deposit funds
    const depositAmount = ethers.utils.parseEther("7");
    await staking.connect(addr1).deposit({ value: depositAmount });

    console.log(`addr1 deposited: ${ethers.utils.formatEther(depositAmount)} ETH`);

    // Wait for rewards to accumulate (e.g., 2 weeks)
    await ethers.provider.send("evm_increaseTime", [14 * 24 * 60 * 60]); // Increase time by 2 weeks
    await ethers.provider.send("evm_mine");

    // Check rewards
    const rewards = await staking.calculateRewards(addr1.address);
    console.log("Rewards after 2 weeks:", ethers.utils.formatEther(rewards), "ETH");

    // Claim rewards
    const claimTx = await staking.connect(addr1).claimRewards();
    const claimTxReceipt = await claimTx.wait();
    const claimTxFee = claimTxReceipt.gasUsed.mul(claimTx.gasPrice);
    console.log(`Gas fees for claiming rewards: ${ethers.utils.formatEther(claimTxFee)} ETH`);

    // Verify contract and pool balances
    const initialContractBalance = await ethers.provider.getBalance(staking.address);
    const initialPoolBalance = await staking.totalPoolBalance();
    console.log("Initial contract balance: ", ethers.utils.formatEther(initialContractBalance));
    console.log("Initial pool balance: ", ethers.utils.formatEther(initialPoolBalance), "ETH");

    // Withdraw rewards
    const withdrawAmount = await staking.getTotalDeposited(addr1.address);
    const withdrawTx = await staking.connect(addr1).withdraw(withdrawAmount);
    const withdrawTxReceipt = await withdrawTx.wait();
    const withdrawTxFee = withdrawTxReceipt.gasUsed.mul(withdrawTx.gasPrice);
    console.log(`Gas fees for withdrawal: ${ethers.utils.formatEther(withdrawTxFee)} ETH`);

    // Check final contract and pool balances
    const finalContractBalance = await ethers.provider.getBalance(staking.address);
    const finalPoolBalance = await staking.totalPoolBalance();
    console.log("Final contract balance: ", ethers.utils.formatEther(finalContractBalance));
    console.log("Final pool balance: ", ethers.utils.formatEther(finalPoolBalance), "ETH");

    expect(finalPoolBalance).to.be.lt(initialPoolBalance);
});



  //... Rest of tests

  //... Rest of tests


    it("Should not allow withdraw when contract is paused", async function () {
        const depositAmount = ethers.utils.parseEther("2");
        const withdrawAmount = ethers.utils.parseEther("1");

        await (staking.connect(addr1).deposit({value: depositAmount}));

        await ethers.provider.send("evm_increaseTime", [3 * 30 * 24 * 60 * 60]);  // Increase time by ~3 months
        await ethers.provider.send("evm_mine");

        await staking.pause();

        try {
            const withdrawTx = await staking.connect(addr1).withdraw(withdrawAmount);
            await withdrawTx.wait();
            expect.fail("Withdraw should fail when contract is paused");
        } catch (error) {
            expect(error.message).to.include("Pausable: paused");
        }
    });

    it("Should not allow withdraw of zero", async function () {
        const depositAmount = ethers.utils.parseEther("2");

        await (staking.connect(addr1).deposit({value: depositAmount}));

        await ethers.provider.send("evm_increaseTime", [3 * 30 * 24 * 60 * 60]);  // Increase time by ~3 months
        await ethers.provider.send("evm_mine");

        try {
            const withdrawTx = await staking.connect(addr1).withdraw(ethers.utils.parseEther("0"));
            await withdrawTx.wait();
            expect.fail("Insufficient funds to withdraw");
        } catch (error) {
            expect(error.message).to.include("Insufficient funds to withdraw");
        }
    });
});