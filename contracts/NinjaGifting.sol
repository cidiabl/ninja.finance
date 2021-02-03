pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract NinjaGifting {
    
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    
    
    address private ninja = 0xC9cE70A381910D0a90B30d408CC9C7705ee882de;
    IERC20 private ninjaToken = IERC20(ninja);
    
    constructor() public payable {
        
    }
    
    function sendGifts(address[] memory _recipients, uint256 _amountPer) public {
        for(uint i = 0; i < _recipients.length; i++) {
            ninjaToken.safeTransferFrom(msg.sender, _recipients[i], _amountPer);
        }
    }
    
}