const { expect } = require("chai");

describe("StakingContract", function () {

  let accounts;
  let owner;
  let nonOwner;
  let StakingContract;

  beforeEach(async () => {

    accounts = await ethers.getSigners();
    owner = accounts[0];
    nonOwner = accounts[1];

    const Contract = await ethers.getContractFactory("StakingContract");
    StakingContract = await Contract.deploy(accounts[0].address);
    await StakingContract.deployed();
  });

  it("can not call emergencyWithdraw by non-owner", async function() {
      await expect(
          StakingContract.connect(nonOwner).emergencyWithdraw(nonOwner.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("withdraws all funds to an address", async function() {
      const preBalance = await ethers.provider.getBalance(nonOwner.address);

      await StakingContract.addBalance({ value: ethers.utils.parseEther("1") });
      await StakingContract.emergencyWithdraw(nonOwner.address);

      const postBalance = await ethers.provider.getBalance(nonOwner.address);
      
      expect(postBalance.sub(preBalance)).to.equal(ethers.utils.parseEther("1"));
  });
});