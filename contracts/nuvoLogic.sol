// SPDX-License-Identifier: UNLICENSED
    pragma solidity ^0.8.19;

    import "@openzeppelin/contracts/access/Ownable.sol";
    import "@openzeppelin/contracts/security/Pausable.sol";
    import "@openzeppelin/contracts/utils/math/SafeMath.sol";

    contract StakingContract is Ownable, Pausable {
        using SafeMath for uint256;

        uint256 public constant DURATION = 7 days;
        uint256 public constant MAX_ROI_PERCENTAGE = 55e2;  // 55%
        uint256 public constant MAX_DEPOSIT_PERCENTAGE = 155e2; // 155%
        uint256 public constant WEEKLY_ROI_PERCENTAGE = 5e2; // 5%
        uint256 public constant DAILY_ROI_PERCENTAGE = 714; // 0.714%
        uint256 public constant COMMISSION_PERCENTAGE = 400;

        address public treasury;
        uint256 public totalPoolBalance;

        struct Deposit {
            uint256 amount;
            uint256 limitAmount;
            uint256 lastClaimTime;
            bool active;
        }

        mapping(address => Deposit[]) public userDeposits;
        mapping(address => uint256) public totalDeposited;
        mapping(address => uint256) public totalClaimedRewards;
        mapping(address => uint256) public lastWithdrawalTime;

        event DepositMade(address indexed user, uint256 amount, uint256 commission);
        event RewardClaimed(address indexed user, uint256 amount);
        event DepositWithdrawn(address indexed user, uint256 amount, uint256 commission);

        constructor(address _treasury) {
            treasury = _treasury;
        }

        function setTreasury(address _newTreasury) external onlyOwner {
            treasury = _newTreasury;
        }

        mapping(address => uint256) private _deposits;

        function deposit() public payable  {
            _deposits[msg.sender] += msg.value;

            uint256 commission = msg.value.mul(COMMISSION_PERCENTAGE).div(10000);
            uint256 depositAmount = msg.value.sub(commission);

            userDeposits[msg.sender].push(Deposit({
                amount: depositAmount,
                limitAmount: depositAmount.mul(MAX_DEPOSIT_PERCENTAGE).div(10000),
                lastClaimTime: block.timestamp,
                active: true
            }));

            totalDeposited[msg.sender] = totalDeposited[msg.sender].add(depositAmount);
            totalPoolBalance = totalPoolBalance.add(depositAmount);

            (bool success, ) = payable(treasury).call{value: commission}("");
            require(success, "Failed to transfer commission");

            emit DepositMade(msg.sender, depositAmount, commission);
        }

        function getTotalDeposited(address user) public view returns (uint256) {
            return _deposits[user];
            
        }

        function checkUserDeposits(address user) public view returns (uint256) {
            return getTotalDeposited(user);
        }

        function calculateRewards(address user) public view returns(uint256) {
            Deposit[] storage deposits = userDeposits[user];
            uint256 totalRewards = 0;

            for (uint256 i = 0; i < deposits.length; i++) {
                if (!deposits[i].active) continue;

                uint256 daysPassed = (block.timestamp - deposits[i].lastClaimTime) / 1 days;
                
                uint256 newReward = deposits[i].amount.mul(WEEKLY_ROI_PERCENTAGE).div(10000);
                if (daysPassed >= 7) {
                    newReward = newReward.mul(daysPassed / 7);
                } else {
                    newReward = 0;
                }

                if (newReward.add(totalDeposited[user]) > deposits[i].limitAmount) {
                    newReward = deposits[i].limitAmount.sub(totalDeposited[user]);
                }

                totalRewards = totalRewards.add(newReward);
            }
            
            return totalRewards.sub(totalClaimedRewards[user]);
        }

        function claimRewards() public whenNotPaused {
            require(block.timestamp > lastWithdrawalTime[msg.sender] + DURATION, "Need to wait at least a week for next claim");

            uint256 rewards = calculateRewards(msg.sender);
            require(rewards > 0, "No rewards to claim");

            totalClaimedRewards[msg.sender] = totalClaimedRewards[msg.sender].add(rewards);
            totalDeposited[msg.sender] = totalDeposited[msg.sender].add(rewards);
            totalPoolBalance = totalPoolBalance.sub(rewards);
            
            for (uint256 i = 0; i < userDeposits[msg.sender].length; i++) {
                userDeposits[msg.sender][i].lastClaimTime = block.timestamp;
            }

            (bool success, ) = payable(msg.sender).call{value: rewards}("");
            require(success, "Failed to transfer rewards");

            emit RewardClaimed(msg.sender, rewards);
        }

        function addToPool() public payable onlyOwner {
            totalPoolBalance = totalPoolBalance.add(msg.value);
        }

        function withdraw(uint256 _amount) public whenNotPaused {
            // Verificar que el usuario puede retirar
            require(block.timestamp >= lastWithdrawalTime[msg.sender].add(DURATION), "Cannot withdraw yet");

            // Verificar que el usuario tiene suficientes fondos para retirar
            require(_amount <= totalDeposited[msg.sender], "Insufficient funds to withdraw");

            // Calcular las recompensas totales del usuario
            uint256 totalRewards = totalClaimedRewards[msg.sender];
            uint256 withdrawableRewards = totalRewards > _amount ? _amount : totalRewards;

            // Calcular la comisión
            uint256 commission = withdrawableRewards.mul(COMMISSION_PERCENTAGE).div(10000);

            // Calcular la cantidad a retirar del contrato
            uint256 withdrawAmount = withdrawableRewards.sub(commission);

            // Actualizar los balances y el saldo total del contrato
            totalDeposited[msg.sender] = totalDeposited[msg.sender].sub(_amount);
            totalClaimedRewards[msg.sender] = totalClaimedRewards[msg.sender].sub(withdrawableRewards);
            totalPoolBalance = totalPoolBalance.sub(withdrawAmount);

            // Transferir la comisión al tesoro
            (bool successCommission, ) = payable(treasury).call{value: commission}("");
            require(successCommission, "Failed to transfer commission");

            // Transferir la cantidad a retirar al usuario
            (bool successWithdraw, ) = payable(msg.sender).call{value: withdrawAmount}("");
            require(successWithdraw, "Failed to transfer withdraw amount");

            // Emitir evento de retiro exitoso
            emit DepositWithdrawn(msg.sender, withdrawAmount, commission);
        }

        function pause() public onlyOwner {
            _pause();
        }

        function unpause() public onlyOwner {
            _unpause();
        }

        receive() external payable {}
    }