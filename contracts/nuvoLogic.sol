// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingContract is Ownable, Pausable {
    using SafeMath for uint256;

    uint256 public constant DURATION = 7 days;
    uint256 public constant WEEKLY_ROI_PERCENTAGE = 5e2; // 5%
    uint256 public constant DAILY_ROI_PERCENTAGE = WEEKLY_ROI_PERCENTAGE / 7; 
    uint256 public constant COMMISSION_PERCENTAGE = 500; // 5%
    uint256 public constant MAX_DEPOSIT = 10000 ether; // 10000 Matic 

    address public treasury;
    uint256 public totalPoolBalance;
 
    struct Deposit {
        uint256 amount;
        uint256 lastClaimTime;
    }

    mapping(address => Deposit[]) public userDeposits;
    mapping(address => uint256) public userRewards; 

    event DepositMade(address indexed user, uint256 amount, uint256 commission);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardWithdrawn(address indexed user, uint256 amount); 

    constructor(address _treasury) Pausable() Ownable() {
        treasury = _treasury;
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        treasury = _newTreasury;
    }

    function deposit() public payable whenNotPaused {
        require(msg.value <= MAX_DEPOSIT, "Deposit exceeds the maximum");
        uint256 commission = msg.value.mul(COMMISSION_PERCENTAGE).div(10000);
        uint256 depositAmount = msg.value.sub(commission);
        totalPoolBalance = totalPoolBalance.add(depositAmount);

        userDeposits[msg.sender].push(Deposit({
            amount: depositAmount,
            lastClaimTime: block.timestamp
        }));

        (bool success, ) = payable(treasury).call{value: commission}("");
        require(success, "Failed to transfer commission");

        emit DepositMade(msg.sender, depositAmount, commission);
    }

    function getTotalDeposit(address user) public view returns(uint256) {
        Deposit[] storage deposits = userDeposits[user];
        uint256 totalDeposit = 0;

        for(uint256 i = 0; i < deposits.length; i++) {
            totalDeposit = totalDeposit.add(deposits[i].amount);
        }

        return totalDeposit;
    }

    function getLastClaimTime(address user) public view returns (uint256) {
    require(userDeposits[user].length > 0, "User has no deposits");

    return userDeposits[user][userDeposits[user].length - 1].lastClaimTime;
}

    function calculateRewards(address user) public view returns(uint256) {
        Deposit[] storage deposits = userDeposits[user];
        uint256 totalRewards = 0;

        for(uint256 i = 0; i < deposits.length; i++) {
            uint256 daysPassed = (block.timestamp - deposits[i].lastClaimTime) / 1 days;
            uint256 reward = deposits[i].amount.mul(DAILY_ROI_PERCENTAGE).div(10000) * daysPassed;
            totalRewards = totalRewards.add(reward);
        }

        return totalRewards;
    }

    function claimRewards() public whenNotPaused {
        Deposit[] storage deposits = userDeposits[msg.sender];
        
        uint256 totalRewards = calculateRewards(msg.sender);
        require(totalRewards > 0, "No rewards to claim");

        uint256 commission = totalRewards.mul(COMMISSION_PERCENTAGE).div(10000);
        totalRewards = totalRewards.sub(commission);

        totalPoolBalance = totalPoolBalance.sub(totalRewards.add(commission));

        for(uint256 i = 0; i < deposits.length; i++) {
            deposits[i].lastClaimTime = block.timestamp;
        }

        (bool success, ) = payable(treasury).call{value: commission}("");
        require(success, "Failed to transfer commission");

        userRewards[msg.sender] = userRewards[msg.sender].add(totalRewards);

        emit RewardClaimed(msg.sender, totalRewards);
    }

    function withdrawRewards() public {
        require(userRewards[msg.sender] > 0, "No rewards to withdraw");
        uint256 reward = userRewards[msg.sender];
        userRewards[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Failed to transfer rewards");

        emit RewardWithdrawn(msg.sender, reward);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    receive() external payable {}
}