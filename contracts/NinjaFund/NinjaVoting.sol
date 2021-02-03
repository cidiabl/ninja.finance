pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/SafeERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/math/SafeMath.sol";
import "./ERC20Interface.sol";

contract NinjaVoting {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    
    address public owner;
    
    uint256 public currentVotingStartBlock;
    uint256 public currentVotingEndBlock;
    bool public isVotingPeriod;
    
    uint256 public votingPeriodBlockLength = 270;
    uint256 public costPerVote = 1000000000000000000;
    uint256 public catnipCost = 100000000000000000;
    
    struct bid {
        address bidder;
        string functionCode;
        string functionName;
        uint256 votes;
        address[] addresses;
        uint256[] integers;
        string[] strings;
        bytes32[] bytesArr;
        string[] chain;
    }
    
     mapping(address => bid) private currentBids;
    
    struct bidChain {
        string id;
        string functionCode;
        string functionName;
        address[] addresses;
        uint256[] integers;
        string[] strings;
        bytes32[] bytesArr;
    }
    
    mapping(string => bidChain) private bidChains;
    
    address public topBidAddress;
    
    struct votingHold {
        uint256 ninjaLocked;
        uint256 releaseBlock;
    }
    
    mapping(address => votingHold) private votedNinja;
    
    
    uint256 public lastDistributionBlock;
    uint256 public currentDistributionEndBlock;
    bool public isDistributing;
    bool public canDistribute;
    bool public isRewardingCatnip = true;
    
    
    address public currentDistributionAddress;
    uint256 public currentDistributionAmount;
    uint256 public currentDistributionAmountClaimed;
    
    struct distributionClaimed {
        uint256 ninjaLocked;
        
    }
    
    mapping(address => distributionClaimed) private claims;
    
    
    address public ninjaAddress;
    IERC20 private ninjaIERC20;
    address public catnipAddress;
    IERC20 private catnipIERC20;
    address public catnipUni;
    IERC20 private catnipUniIERC20;
    address public dNinjaAddress;
    IERC20 private dNinjaIERC20;
    
    address public uniswapAddress;
    
    address public connectorAddress;
    
    modifier _onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    modifier _onlyConnector() {
        require(msg.sender == connectorAddress);
        _;
    }
    
    
    constructor() public {
        owner = address(this);
        currentVotingStartBlock = block.number;
        currentVotingEndBlock = block.number + votingPeriodBlockLength;
    }
    
    function setConnector(address _connector) public _onlyConnector {
        connectorAddress = _connector;
        
        //Voting connector change event
    }
    
    function setIsRewardingCatnip(bool _isRewarding) public _onlyConnector {
        isRewardingCatnip = _isRewarding;
        
        //Voting connector change event
    }
    
    function setVotingPeriodBlockLength(uint256 _blocks) public _onlyConnector {
        votingPeriodBlockLength = _blocks;
        
        //Voting period change event
    } 
    
    function setNinjaAddress(address _addr) public _onlyConnector {
        ninjaAddress = _addr;
        ninjaIERC20 = IERC20(ninjaAddress);
        
        //Ninja address change event
    }
    
    function setCatnipAddress(address _addr) public _onlyConnector {
        catnipAddress = _addr;
        catnipIERC20 = IERC20(catnipAddress);
        
        //Catnip address change event
    }
    
    function setdNinjaAddress(address _addr) public _onlyConnector {
        dNinjaAddress = _addr;
        dNinjaIERC20 = IERC20(dNinjaAddress);
        
        //dNinja address change event
    }
    
    function proposeBid(string memory _functionCode, string memory _functionName, address[] memory _addresses, uint256[] memory _integers, string[] memory _strings, bytes32[] memory _bytesArr) public {
        require(isVotingPeriod, "Voting period has not started.");
        require(currentVotingEndBlock >= block.number, "Voting period has ended.");
        currentBids[msg.sender].bidder = msg.sender;
        currentBids[msg.sender].functionCode = _functionCode;
        currentBids[msg.sender].functionName = _functionName;
        currentBids[msg.sender].addresses = _addresses;
        currentBids[msg.sender].integers = _integers;
        currentBids[msg.sender].strings = _strings;
        currentBids[msg.sender].bytesArr = _bytesArr;
        
        //Bid proposal event
    }
    
    function addChainBid(string memory id, string memory _functionCode, string memory _functionName, address[] memory _addresses, uint256[] memory _integers, string[] memory _strings, bytes32[] memory _bytesArr) public {
        
    }
    
    function voteForBid(address _bidAddr, uint256 votes) public {
        ninjaIERC20.safeTransferFrom(msg.sender, address(this), votes * costPerVote);
        catnipIERC20.safeTransferFrom(msg.sender, address(this), votes * catnipCost);
        votedNinja[msg.sender].ninjaLocked = votedNinja[msg.sender].ninjaLocked.add(votes * costPerVote);
        votedNinja[msg.sender].releaseBlock = currentVotingEndBlock;
        currentBids[_bidAddr].votes = currentBids[_bidAddr].votes.add(votes);
        
        //Bid vote event
        
    }
    
    function withdrawBidNinja() public {
        require(votedNinja[msg.sender].releaseBlock > block.number, "Ninja is still locked for vote");
        uint256 amount = votedNinja[msg.sender].ninjaLocked;
        ninjaIERC20.safeTransfer(msg.sender, amount);
        votedNinja[msg.sender].ninjaLocked = 0;
        
        //Bid Ninja withdrawal event
    }
    
    function approveContract(address _addr, uint256 _amount) public _onlyConnector {
        ERC20(_addr).approve(_addr, _amount);
        
        //Contract approval event
    }
    
    function executeBid(string memory _functionCode, 
                        string memory _functionName, 
                        address[] memory _addresses, 
                        uint256[] memory integers, 
                        string[] memory strings, 
                        bytes32[] memory bytesArr)
                        public _onlyConnector {
                            
        // require(currentVotingEndBlock < block.number, "Voting period is still active.");
        currentVotingStartBlock = block.number.add(votingPeriodBlockLength.mul(2));
        currentVotingEndBlock = block.number.add(currentVotingStartBlock.add(votingPeriodBlockLength));
        connectorAddress.call(abi.encodeWithSignature("executeBid(string,string,address[],uint256[],string[],bytes32[])",
                                                        _functionCode,_functionName,_addresses,integers,strings,bytesArr));
                                                        
        
        for (uint256 c = 0; c<currentBids[topBidAddress].chain.length; c++) {
            connectorAddress.call(abi.encodeWithSignature("executeBid(string,string,address[],uint256[],string[],bytes32[])",
                                                        bidChains[currentBids[topBidAddress].chain[c]].functionCode,
                                                        bidChains[currentBids[topBidAddress].chain[c]].functionName,
                                                        bidChains[currentBids[topBidAddress].chain[c]].addresses,
                                                        bidChains[currentBids[topBidAddress].chain[c]].integers,
                                                        bidChains[currentBids[topBidAddress].chain[c]].strings,
                                                        bidChains[currentBids[topBidAddress].chain[c]].bytesArr));
        }
        
        //Bid execution event                                                
    }
    
    function distributeFunds(address _addr, uint256 _amount) public _onlyConnector {
        
    }
    
    function claimDistribution(address _claimer, uint256 _amount) public {
        require(isDistributing && currentVotingEndBlock>block.number, "You are not in a distribution period");
        ninjaIERC20.safeTransferFrom(_claimer, address(this), _amount);
        claims[_claimer].ninjaLocked = claims[_claimer].ninjaLocked.add(_amount);
        uint256 ninjaSupply = ERC20(ninjaAddress).totalSupply();
        uint256 catnipSupply = ERC20(catnipUni).totalSupply();
        uint256 rewardsPool = ninjaSupply;
        
        if (isRewardingCatnip) {
            rewardsPool.add(catnipSupply);
        }
        
        uint256 claimerPerc = rewardsPool.mul(_amount);
        uint256 claimedAmount = currentDistributionAmount.div(claimerPerc);
        IERC20(currentDistributionAddress).safeTransfer(msg.sender, _amount);
        currentDistributionAmountClaimed = currentDistributionAmountClaimed.add(claimedAmount);
        
        //distribution claim event
        
    }
    
    function withdrawDistributionNinja() public {
        
    }
    
    function burnCatnip() public _onlyConnector {
        //take catnip in burn pool
        //divide the amount in half
        //swap one half for dNinja on uniswap
        //send other catnip half to burn address
        //send swapped dNinja to burn address
        
    }
    
    
    
}