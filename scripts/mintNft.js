require('dotenv').config();

const hre = require("hardhat");
const ethers = hre.ethers;

// Importing contract artifacts
const contractArtifact = require('../artifacts/contracts/nuvoNFT.sol/NuvoToken.json'); 

const POLYGON_MUMBAI = process.env.POLYGON_MUMBAI;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NUVO_TOKEN_CONTRACT = process.env.NUVO_TOKEN_CONTRACT;

async function main() {
    // Fetching network to pass to ethers provider
    const network = process.env.ALCHEMY_NETWORK;

    // Use ethers provider to connect to the set network
    const provider = new ethers.providers.JsonRpcProvider(`https://polygon-mumbai.g.alchemy.com/v2/${POLYGON_MUMBAI}`);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Create instance of contract with the provider
    const nftContract = new ethers.Contract(NUVO_TOKEN_CONTRACT, contractArtifact.abi, wallet);

    const tokenURI = "https://gateway.pinata.cloud/ipfs/QmZwTp2tiyo8nJw1rAnqYhQbRJCMHZ8F5S6vmRZfV4jwuw"

    try {
        const result = await nftContract.mintNFT(tokenURI);
        const receipt = await result.wait();
        console.log("NFT minted! Transaction hash: ", receipt.transactionHash);
    } catch (error) {
        console.log(`Something went wrong when attempting to mint your NFT: ${error}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });