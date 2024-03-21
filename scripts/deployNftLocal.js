const hre = require("hardhat");

async function main() {
    const NFT = await hre.ethers.getContractFactory("NuvoToken");
    const nft = await NFT.deploy();

    await nft.deployed();

    console.log("NuvoToken desplegado en:", nft.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });