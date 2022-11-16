// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";
module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const accounts = await ethers.getSigners();
  const nftDeployer = accounts[0];
  const nftOwner = accounts[1];
  console.log(`nftDeployer is : ${nftDeployer.address}`);
  console.log(`nftOwner is : ${nftOwner.address}`);
  const chainId = await getChainId();

  await deploy("NFT1on1", {
    from: nftDeployer.address,
    log: true,
    waitConfirmations: 5,
  });
  console.log("Deplyed 1/1 NFT contract ! ...");
  console.log("------------------");

  const nft1on1 = await ethers.getContract("NFT1on1", nftDeployer.address);
  console.log("got the deployed 1/1 NFT contact..");
  const mintTx = await nft1on1.mint(nftOwner.address, 0);
  await mintTx.wait(1);
  console.log("minted an NFT to the curator!..");
  let umNfts = await nft1on1.balanceOf(nftOwner.address);
  console.log(`num of NFTs for fractionsDeployer are: ${umNfts.toString()}`);
  console.log("-----------------");
};
module.exports.tags = ["all", "nft1on1"];
