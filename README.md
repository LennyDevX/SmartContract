#Smart Contract Description

Nuvo Staking Contract Beta v1
The StakingContract is a Solidity smart contract designed for staking and earning rewards. It provides users with the ability to deposit funds into the contract, which are then staked to earn rewards based on a fixed interest rate. Additionally, users can claim their earned rewards and withdraw them from the contract.

Features:
Staking: Users can deposit funds into the contract, which are then staked to earn rewards.

Reward Calculation: Rewards are calculated based on a fixed interest rate, which is distributed hourly.

Maximum Reward Limit: The contract enforces a maximum reward limit to prevent excessive rewards.

Commission Mechanism: A small commission fee is deducted from the rewards earned by users, which contributes to the sustainability of the contract.

Pause Mechanism: The contract owner can pause and unpause the contract, providing additional security and control.

Emergency Withdrawal: In case of emergencies, the contract owner can withdraw the contract's balance.

Technical Details:
Duration: Rewards are distributed hourly.

Fixed Interest Rate: The contract offers a fixed interest rate of 5% weekly, which is distributed hourly.

Maximum Reward: Users can earn a maximum reward of 135% of their total deposit.

Commission Fee: A commission fee of 5% is deducted from the rewards earned by users.

Maximum Deposit: The maximum deposit allowed per user is 10,000 Matic.

Treasury: A treasury address is set by the contract owner to receive commission fees.

Usage:
Deposit: Users can deposit funds into the contract by calling the deposit function. The deposited funds are staked automatically.

Claim Rewards: Users can claim their earned rewards by calling the claimRewards function. Rewards are distributed hourly based on the user's stake.

Withdraw Rewards: Users can withdraw their claimed rewards by calling the withdrawRewards function.

Emergency Withdrawal: In case of emergencies, the contract owner can call the emergencyWithdraw function to withdraw the contract's balance.

Pause/Unpause: The contract owner can pause and unpause the contract using the pause and unpause functions, respectively.

Security:
The contract utilizes OpenZeppelin's Ownable and Pausable contracts to enhance security and control.
Only the contract owner can pause and unpause the contract.
Emergency withdrawal functionality provides a safety net in case of unexpected events.
Deployment:
The contract can be deployed on the Ethereum blockchain using the Solidity compiler version ^0.8.19. It requires the deployment of OpenZeppelin's Ownable, Pausable, and SafeMath contracts.

Disclaimer: This contract is provided for demonstration purposes only. Use it at your own risk, and ensure thorough testing before deploying it in a production environment.
