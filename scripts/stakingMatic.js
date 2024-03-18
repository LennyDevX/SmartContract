const ethers = require('ethers');
const { abi } = require('../artifacts/contracts/nuvo.sol/Governance.json'); // Importing contract ABI

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function interact() {
  const provider = new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const contractAddress = '0xf94Efb8672945Bd7C119ee7572c0e253223b3559';
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // Making sure the deposit is in the contract's acceptable range
  const depositAmount = ethers.utils.parseUnits('4', '18');

  const transaction = await contract.deposit({
    value: depositAmount,
    gasLimit: ethers.utils.hexlify(1000000)
  });

  await transaction.wait();
  console.log(`Transaction successful with hash: ${transaction.hash}`);
}

interact();