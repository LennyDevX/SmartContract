// Import libraries
const ethers = require('ethers');
const fs = require('fs');
require('dotenv').config();

// Set Alchemy API key and private key from your .env file
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Set up new provider and wallet
const provider = new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function main() {

  // Replace '../artifacts/contracts/NuvoNFT.sol/NuvoNFT.json' with correct path to your contract artifact if different
  const contractArtifact = require('../artifacts/contracts/nuvoNFT.sol/NuvoToken.json')

  const NuvoNFT = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, wallet);

  const nftContract = await NuvoNFT.deploy();
  console.log("Waiting for deployment...");

  await nftContract.deployed();
  console.log("NFT Contract deployed at:", nftContract.address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });