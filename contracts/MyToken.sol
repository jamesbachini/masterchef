// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Permit, ERC20Votes, Ownable {

    mapping(uint => address) public crossChain;

    constructor(uint256 _amount) ERC20("MyToken", "MTK") ERC20Permit("MyToken") {
      _mint(msg.sender, _amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
      super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
      super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
      super._burn(account, amount);
    }

    // Mint function required for Masterchef contract to create new tokens
    function mint(address _to, uint256 _amount) public onlyOwner {
      _mint(_to, _amount);
    }

    /* 
        Functions to lookup same token deployed on other chains
        Ethereum mainnet will hold the master token which maps
        to all the other alt L1's and L2's.
    */
    function addCrossChainContract(uint256 _chainId, address _tokenContractAddress) public onlyOwner {
      crossChain[_chainId] = _tokenContractAddress;
    }

    function removeCrossChainContract(uint256 _chainId) public onlyOwner {
      delete crossChain[_chainId];
    }

    function crossChainLookup(uint256 _chainId) public view returns (address) {
        return crossChain[_chainId];
    }

}
