pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFT1on1 is ERC721 {

  constructor() ERC721("1on1", "1on1") {
    _mint(msg.sender, 0);
  }
}
