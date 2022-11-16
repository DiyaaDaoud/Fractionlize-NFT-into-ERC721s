pragma solidity >=0.8.7 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFT1on1 is ERC721("1on1NFT", "1on1NFT") {
    function mint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }
}
