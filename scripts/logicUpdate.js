async function main() {
    const [deployer] = await ethers.getSigners();
    const NuvoLogic = await ethers.getContractFactory("nuvoLogic");

    const nuvoLogic = await NuvoLogic.deploy(); // No initial treasury address

    console.log("NuvoLogic deployed to:", nuvoLogic.address);

    // Change treasury address after deployment
    const newTreasuryAddress = "0xc8EA26EC919320912c135f789E83458174c042c9";
    await nuvoLogic.setTreasury(newTreasuryAddress);

    console.log("Treasury address has been updated to:", newTreasuryAddress);
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});