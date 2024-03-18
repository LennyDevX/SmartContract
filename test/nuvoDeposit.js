const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract", function () {
    let owner, addr1, addrs;
    let StakingContract;
    let staking;
    const COMMISSION_PERCENTAGE = 4;  // Replace with your correct value.

    beforeEach(async function () {
        StakingContract = await ethers.getContractFactory("StakingContract");
        [owner, addr1, ...addrs] = await ethers.getSigners();
    
        staking = await StakingContract.deploy(owner.address);

        // Let's fund the contract.
        await owner.sendTransaction({ to:staking.address, value: ethers.utils.parseEther("10") });
    });

    it("Should deposit successfully and increase the total pool balance", async function () {
        const depositAmount = ethers.utils.parseEther("2");
        const initialPoolBalance = await staking.totalPoolBalance();

        const depositTx = await staking.connect(addr1).deposit({value: depositAmount});
        await depositTx.wait();

        const finalPoolBalance = await staking.totalPoolBalance();
        expect(finalPoolBalance).to.equal(initialPoolBalance.add(depositAmount.mul(100 - COMMISSION_PERCENTAGE).div(100)));
    });

    it("Should not allow deposit when contract is paused", async function () {
        const pauseTx = await staking.pause();
        await pauseTx.wait();

        const depositAmount = ethers.utils.parseEther("2");
        try {
            const depositTx = await staking.connect(addr1).deposit({value: depositAmount});
            await depositTx.wait();
            expect.fail("Deposit should fail when contract is paused");
        } catch (error) {
            expect(error.message).to.include("Pausable: paused");
        }
    });

    it("Should not allow deposit of zero", async function () {
        try {
            const depositTx = await staking.connect(addr1).deposit({value: ethers.utils.parseEther("0")});
            await depositTx.wait();
            expect.fail("Deposit should fail when no value is sent");
        } catch (error) {
            expect(error.message).to.include("Cannot deposit 0");
        }
    });
});