const { ethers } = require("ethers");

const ABI = require('../artifacts/contracts/nuvoLogic.sol/StakingContract.json'); 
const MAINNET = process.env.POLYGON_MAINNET;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NUVO_TOKEN_CONTRACT = process.env.NUVO_TOKEN_CONTRACT;

// URL del proveedor de red Ethereum (por ejemplo, Infura)
const providerUrl = "https://polygon-mainnet.g.alchemy.com/v2/" + MAINNET;

// Instanciar un proveedor de red
const provider = new ethers.providers.JsonRpcProvider(providerUrl);

// Instanciar una instancia del contrato
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(NUVO_TOKEN_CONTRACT, ABI.abi, signer);

async function addBalanceToContract() {
    try {
        // Enviar transacción para llamar a la función addBalance
        const tx = await contract.addBalance({ value: ethers.utils.parseEther("0.4") });

        // Esperar a que se confirme la transacción
        await tx.wait();

        console.log("Balance agregado exitosamente al contrato.");
    } catch (error) {
        console.error("Error al agregar balance al contrato:", error);
    }
}

// Llamar a la función addBalanceToContract
addBalanceToContract();
