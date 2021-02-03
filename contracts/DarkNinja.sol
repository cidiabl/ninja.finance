pragma solidity ^0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract DarkNinja is ERC20{
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;


    struct stakeTracker {
        uint256 lastBlockChecked;
        uint256 rewards;
        uint256 catnipPoolTokens;
        uint256 darkNinjaPoolTokens;
    }
    
    mapping(address => stakeTracker) private stakedBalances;


    address owner;
    
    address public fundVotingAddress;
    
    bool public isSendingFunds = false;
    
    uint256 private lastBlockSent;
    
    uint256 public liquidityMultiplier = 70;
    uint256 public miningDifficulty = 40000;
    
    IERC20 private catnip;
    IERC20 private darkNinja;
    
    IERC20 private catnipV2;
    address public catnipUniswapV2Pair;
    
    IERC20 private darkNinjaV2;
    address public darkNinjaUniswapV2Pair;
    
    uint256 totalLiquidityStaked;


    modifier _onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    modifier updateStakingReward(address _account) {
        uint256 liquidityBonus;
        if (stakedBalances[_account].darkNinjaPoolTokens > 0) {
            liquidityBonus = stakedBalances[_account].darkNinjaPoolTokens/ liquidityMultiplier;
        }
        if (block.number > stakedBalances[_account].lastBlockChecked) {
            uint256 rewardBlocks = block.number
                                        .sub(stakedBalances[_account].lastBlockChecked);
                                        
                                        
             
            if (stakedBalances[_account].catnipPoolTokens > 0) {
                stakedBalances[_account].rewards = stakedBalances[_account].rewards
                                                                            .add(stakedBalances[_account].catnipPoolTokens)
                                                                            .add(liquidityBonus)
                                                                            .mul(rewardBlocks)
                                                                            / miningDifficulty;
            }
            
           
                    
            stakedBalances[_account].lastBlockChecked = block.number;
            
            
            emit Rewards(_account, stakedBalances[_account].rewards);                                                     
        }
        _;
    }
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    event catnipUniStaked(address indexed user, uint256 amount, uint256 totalLiquidityStaked);
    
    event darkNinjaUniStaked(address indexed user, uint256 amount, uint256 totalLiquidityStaked);
    
    event catnipUniWithdrawn(address indexed user, uint256 amount, uint256 totalLiquidityStaked);
    
    event darkNinjaUniWithdrawn(address indexed user, uint256 amount, uint256 totalLiquidityStaked);
    
    event Rewards(address indexed user, uint256 reward);
    
    event FundsSentToFundingAddress(address indexed user, uint256 amount);
    
    event votingAddressChanged(address indexed user, address votingAddress);
    
    event catnipPairAddressChanged(address indexed user, address catnipPairAddress);
    
    event darkNinjaPairAddressChanged(address indexed user, address darkNinjaPairAddress);
    
    event difficultyChanged(address indexed user, uint256 difficulty);


    constructor() public payable ERC20("darkNINJA", "dNINJA") {
        owner = msg.sender;
        uint256 supply = 100;
        _mint(msg.sender, supply.mul(10 ** 18));
        lastBlockSent = block.number;
    }
    
    function transferOwnership(address newOwner) external _onlyOwner {
        assert(newOwner != address(0)/*, "Ownable: new owner is the zero address"*/);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
    
    function setVotingAddress(address _account) public _onlyOwner {
        fundVotingAddress = _account;
        emit votingAddressChanged(msg.sender, fundVotingAddress);
    }
    
    function setCatnipPairAddress(address _uniV2address) public _onlyOwner {
        catnipUniswapV2Pair = _uniV2address;
        catnipV2 = IERC20(catnipUniswapV2Pair);
        emit catnipPairAddressChanged(msg.sender, catnipUniswapV2Pair);
    }

    function setdarkNinjaPairAddress(address _uniV2address) public _onlyOwner {
        darkNinjaUniswapV2Pair = _uniV2address;
        darkNinjaV2 = IERC20(darkNinjaUniswapV2Pair);
        emit darkNinjaPairAddressChanged(msg.sender, darkNinjaUniswapV2Pair);
    }
    
     function setMiningDifficulty(uint256 amount) public _onlyOwner {
       miningDifficulty = amount;
       emit difficultyChanged(msg.sender, miningDifficulty);
   }
    
    function stakeCatnipUni(uint256 amount) public updateStakingReward(msg.sender) {
        catnipV2.safeTransferFrom(msg.sender, address(this), amount);
        stakedBalances[msg.sender].catnipPoolTokens = stakedBalances[msg.sender].catnipPoolTokens.add(amount);
        totalLiquidityStaked = totalLiquidityStaked.add(amount);                                                                              
        emit catnipUniStaked(msg.sender, stakedBalances[msg.sender].catnipPoolTokens, totalLiquidityStaked);
    }
    
    function withdrawCatnipUni(uint256 amount) public updateStakingReward(msg.sender) {
        catnipV2.safeTransfer(msg.sender, amount);
        stakedBalances[msg.sender].catnipPoolTokens = stakedBalances[msg.sender].catnipPoolTokens.sub(amount);
        totalLiquidityStaked = totalLiquidityStaked.sub(amount);                                                                              
        emit catnipUniWithdrawn(msg.sender, amount, totalLiquidityStaked);
    }
    
    
    
    function stakeDarkNinjaUni(uint256 amount) public updateStakingReward(msg.sender) {
        darkNinjaV2.safeTransferFrom(msg.sender, address(this), amount);
        stakedBalances[msg.sender].darkNinjaPoolTokens = stakedBalances[msg.sender].darkNinjaPoolTokens.add(amount);
        totalLiquidityStaked = totalLiquidityStaked.add(amount);                                                                              
        emit darkNinjaUniStaked(msg.sender, amount, totalLiquidityStaked);
    }
    
    function withdrawDarkNinjaUni(uint256 amount) public updateStakingReward(msg.sender) {
        darkNinjaV2.safeTransfer(msg.sender, amount);
        stakedBalances[msg.sender].darkNinjaPoolTokens = stakedBalances[msg.sender].darkNinjaPoolTokens.sub(amount);
        totalLiquidityStaked = totalLiquidityStaked.sub(amount);                                                                              
        emit darkNinjaUniWithdrawn(msg.sender, amount, totalLiquidityStaked);
    }
    
    function getNipUniStakeAmount(address _account) public view returns (uint256) {
        return stakedBalances[_account].catnipPoolTokens;
    }
    
    function getDNinjaUniStakeAmount(address _account) public view returns (uint256) {
        return stakedBalances[_account].darkNinjaPoolTokens;
    }
    
    function myRewardsBalance(address _account) public view returns(uint256) {
        uint256 liquidityBonus;
        if (stakedBalances[_account].darkNinjaPoolTokens > 0) {
            liquidityBonus = stakedBalances[_account].darkNinjaPoolTokens / liquidityMultiplier;
        }
        
        if (block.number > stakedBalances[_account].lastBlockChecked) {
            uint256 rewardBlocks = block.number
                                        .sub(stakedBalances[_account].lastBlockChecked);
                                        
                                        
             
            if (stakedBalances[_account].catnipPoolTokens > 0) {
                return stakedBalances[_account].rewards
                                                .add(stakedBalances[_account].catnipPoolTokens)
                                                .add(liquidityBonus)
                                                .mul(rewardBlocks)
                                                / miningDifficulty;
            } else {
                return 0;
            }
        }
    }
    
    function getReward() public updateStakingReward(msg.sender) {
        uint256 reward = stakedBalances[msg.sender].rewards;
       stakedBalances[msg.sender].rewards = 0;
       _mint(msg.sender, reward.mul(8) / 10);
       uint256 fundingPoolReward = reward.mul(2) / 10;
       _mint(address(this), fundingPoolReward);
       emit Rewards(msg.sender, reward);
    }
    
    function toggleFundsTransfer() public _onlyOwner {
        isSendingFunds = !isSendingFunds;
    }
    
    function sendDarkNinjaToFund(uint256 amount) public {
        if (!isSendingFunds) {
            return;
        }
        lastBlockSent = block.number;
        IERC20(address(this)).safeTransfer(fundVotingAddress, amount);
        emit FundsSentToFundingAddress(msg.sender, amount);
    }
    
    
}