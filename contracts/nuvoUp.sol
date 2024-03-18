// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Aquí definimos la interfaz del nuevo contrato al que migraremos los datos
interface NewLogicInterface {
    function migrateData(address user, uint balance) external;
}

contract UpdateContract {
    address public owner;
    address public newLogicContract;
    mapping(address => uint) internal balances;
    address[] public users;
    bytes public contractData; // almacenamos datos de la llamada del contrato

    // En el constructor establecemos al propietario del contrato y la dirección del nuevo contrato
    constructor(address _newLogicContract) {
        owner = msg.sender;
        newLogicContract = _newLogicContract;
    }

    // Modificador para restringir el acceso solo al propietario del contrato
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    // Permitir a los usuarios depositar Ether en el contrato
    function deposit() public payable {
        if(balances[msg.sender]==0){
            users.push(msg.sender); // guardamos la dirección del usuario si es la primera vez que deposita
        }
        balances[msg.sender] += msg.value;
    }

    // Devuelve el saldo del usuario en el contrato
    function balanceOf(address account) public view returns (uint) {
        return balances[account];
    }

    // Permite al propietario del contrato cambiar la dirección del nuevo contrato 
    function setNewLogicContract(address _newLogicContract) external onlyOwner {
        newLogicContract = _newLogicContract;
    }

    // Migrar todos los saldos de los usuarios al nuevo contrato
    function migrateToNewLogic() external payable onlyOwner {
        require(newLogicContract != address(0), "New logic contract address not set");
        for (uint i=0; i<users.length; i++) { 
            address user = users[i];
            uint balance = balances[user];
            if (balance > 0) {
                // 1 - transfer balance to new contract
                (bool sent, bytes memory data) = newLogicContract.call{value: balance}("");
                require(sent, "Failed to send Ether");
                // 2 - Informar al nuevo contrato sobre la transferencia
                NewLogicInterface(newLogicContract).migrateData(user, balance);
                // 3 - Anular el saldo en el contrato antiguo
                balances[user] = 0;
                contractData = data; // almacenamos los datos de la llamada del contrato
            }
        }
        // Después de migrar fondos y datos, actualizar la dirección del contrato lógico
        owner = newLogicContract;
        newLogicContract = address(0);
    }

    // Función añadida para ver los datos del contrato recientes
    function getRecentContractData() external view returns (bytes memory) {
        return contractData;
    }
}