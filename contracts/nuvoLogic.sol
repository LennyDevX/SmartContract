// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingContract is Ownable, Pausable {
    using SafeMath for uint256;

    uint256 public constant DURATION = 7 days;
    uint256 public constant WEEKLY_ROI_PERCENTAGE = 5e2; // 5%
    uint256 public constant HOURLY_ROI_PERCENTAGE = WEEKLY_ROI_PERCENTAGE / (7*24); // return per hour
    uint256 public constant MAX_ROI_PERCENTAGE = 13500; // 135% 
    uint256 public constant COMMISSION_PERCENTAGE = 500; // 5%
    uint256 public constant MAX_DEPOSIT = 10000 ether; // 10000 Matic 

    address public treasury;
    uint256 public totalPoolBalance;
 
    struct User {
        uint256 totalDeposit;
        uint256 lastClaimTime;
    }
    mapping(address => User) private users;
    mapping(address => uint256) public userRewards; 

    event DepositMade(address indexed user, uint256 amount, uint256 commission);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardWithdrawn(address indexed user, uint256 amount);
    event ContractPaused(address indexed owner);
    event ContractUnpaused(address indexed owner);

    constructor(address _treasury) Pausable() Ownable() {
        treasury = _treasury;
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "New treasury address is the zero address");
        treasury = _newTreasury;
    }

    function deposit() public payable whenNotPaused {
        require(msg.value <= MAX_DEPOSIT, "Deposit exceeds the maximum");
        
        uint256 commission = msg.value.mul(COMMISSION_PERCENTAGE).div(10000);
        uint256 depositAmount = msg.value.sub(commission);
        
        totalPoolBalance = totalPoolBalance.add(depositAmount);

        users[msg.sender].totalDeposit = users[msg.sender].totalDeposit.add(depositAmount);
        users[msg.sender].lastClaimTime = block.timestamp;

        (bool success, ) = payable(treasury).call{value: commission}("");
        require(success, "Failed to transfer commission");

        emit DepositMade(msg.sender, depositAmount, commission);
    }

    function getTotalDeposit(address user) public view returns(uint256) {
        return users[user].totalDeposit;
    }

    function getLastClaimTime(address user) public view returns (uint256) {
        return users[user].lastClaimTime;
    }

    function calculateRewards(address userAddress) public view returns(uint256) {
        User storage user = users[userAddress];
        uint256 hoursPassed = (block.timestamp - user.lastClaimTime) / 1 hours;      
        uint256 totalRewards = user.totalDeposit.mul(HOURLY_ROI_PERCENTAGE).div(10000).mul(hoursPassed);
        
        // Apply max ROI limit
        uint256 maxReward = user.totalDeposit.mul(MAX_ROI_PERCENTAGE).div(10000);
        if (totalRewards > maxReward) {
            totalRewards = maxReward;
        }
        return totalRewards;
    }

    function claimRewards() public whenNotPaused {
        User storage user = users[msg.sender];

        uint256 hoursPassed = (block.timestamp - user.lastClaimTime) / 1 hours;
        uint256 totalRewards = user.totalDeposit.mul(HOURLY_ROI_PERCENTAGE).div(10000).mul(hoursPassed);
        uint256 commission = totalRewards.mul(COMMISSION_PERCENTAGE).div(10000);

        // Apply max ROI limit
        uint256 maxReward = user.totalDeposit.mul(MAX_ROI_PERCENTAGE).div(10000);
        if (totalRewards > maxReward) {
            totalRewards = maxReward;
        }
        
        require(totalPoolBalance >= totalRewards.add(commission), "Not enough funds in the pool");
        require(totalRewards > 0, "No rewards to claim");

        totalRewards = totalRewards.sub(commission);

        totalPoolBalance = totalPoolBalance.sub(totalRewards.add(commission));

        // Update last claim time
        user.lastClaimTime = block.timestamp; // Actualiza el tiempo del último reclamo

        (bool success, ) = payable(treasury).call{value: commission}("");
        require(success, "Failed to transfer commission");
        userRewards[msg.sender] = userRewards[msg.sender].add(totalRewards);

        emit RewardClaimed(msg.sender, totalRewards);
    }

    function withdrawRewards() public whenNotPaused {
        require(userRewards[msg.sender] > 0, "No rewards to withdraw");
        uint256 reward = userRewards[msg.sender];
        userRewards[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Failed to transfer rewards");

        emit RewardWithdrawn(msg.sender, reward); 
    }

    function emergencyWithdraw(address to) public onlyOwner whenNotPaused {
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success, "Emergency withdraw failed");
    }

    function pause() public onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() public onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    function addBalance() public payable onlyOwner {
        // El balance será añadido automáticamente
    }

    receive() external payable {}
}
