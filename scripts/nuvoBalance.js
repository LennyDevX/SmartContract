const ethers = require('ethers');
const { abi } = require('../artifacts/contracts/nuvoLogic.sol/StakingContract.json'); 

const provider = new ethers.providers.JsonRpcProvider(`http://localhost:8545`); 
const wallet = provider.getSigner(0); // Use first Hardhat account
const contractAddress = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'; // Update this value
const contract = new ethers.Contract(contractAddress, abi, wallet);

async function interact() {
  // With 4% deposit fee, actual deposit looks like 96% of intended deposit
  const intendedDepositAmount = ethers.utils.parseUnits('3', '18');
  const actualDepositAmount = intendedDepositAmount.mul(96).div(100);

  const balance = await wallet.getBalance();
  if (balance < actualDepositAmount) {
    console.log("The wallet doesn't have enough balance. Sending Ether to it now.");
    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("10.0")
    });
    await tx.wait();
  }

  try {
    const transaction = await contract.deposit({
      value: actualDepositAmount,
      gasLimit: ethers.utils.hexlify(1000000) 
    });
    const receipt = await transaction.wait();
    console.log(`Transaction successful with hash: ${receipt.transactionHash}`);
  } catch(err) {
    console.log("An error occurred while making the deposit:", err);
  }

  const signerAddress = await wallet.getAddress(); // Get correct address of the signer
  const stakedBalance = await contract.checkUserDeposits(signerAddress);
  console.log(`User's staked balance: ${stakedBalance}`);
}

interact().catch(console.error);