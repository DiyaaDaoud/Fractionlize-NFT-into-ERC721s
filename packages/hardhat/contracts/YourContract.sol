pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract YourContract is ERC721, Ownable {

  uint public price;
  uint public change;
  uint public ownerFees;
  address public nft;
  uint public id;

  uint tokenId;

  constructor() ERC721("Wrapper Bonding Curve", "WBC") {}

  function transfer1on1NFT(address _nft, uint _id) external onlyOwner {
    nft = _nft;
    id = _id;
    ERC721(_nft).transferFrom(owner(), address(this), _id);
  }

  function setParameters(uint startingPrice, uint changePrice, uint fees) external onlyOwner {
    price = startingPrice;
    change = changePrice;
    ownerFees = fees;
  }

  function tokenURI(uint _id) public view virtual override returns (string memory) {
    return ERC721(nft).tokenURI(id);
  }

  function buyNFT() external payable {
    require(msg.value == price+ownerFees, "wrong msg.value");
    (bool success, ) = owner().call{value: ownerFees}("");
    require(success, "ETH transfer to owner failed");

    _mint(msg.sender, tokenId);
    tokenId += 1;
    price += change;
  }

  function sellNFT(uint _id) external payable {
    require(msg.value == ownerFees, "wrong msg.value");
    (bool success, ) = owner().call{value: ownerFees}("");
    require(success, "ETH transfer to owner failed");
    (bool success1, ) = msg.sender.call{value: price}("");
    require(success1, "ETH transfer to msg.sender failed");

    _burn(_id);
    price -= change;
  }
}
