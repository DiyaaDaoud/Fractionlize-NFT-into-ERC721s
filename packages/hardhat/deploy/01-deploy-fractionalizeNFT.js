// deploy/00_deploy_your_contract.js

const { ethers } = require("hardhat");

const localChainId = "31337";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const accounts = await ethers.getSigners();
  const nftDeployer = accounts[0];
  const nftOwner = accounts[1];
  const chainId = await getChainId();

  let ownerInitialFractionSupply = 100;
  let initialFractionPrice = ethers.utils.parseEther("0.01");
  let value = ethers.utils.parseEther("0.1");
  const nft1on1 = await ethers.getContract("NFT1on1", nftOwner.address);

  console.log("got the deployed 1/1 nft contract");
  await deploy("BancorFormula", {
    from: nftOwner.address,
    args: [],
    log: true,
    waitConfirmations: 5,
  });
  console.log("deployed Bancor");
  console.log("--------------------");
  const args = [
    "WrappedBondingCurve",
    "WBC",
    nft1on1.address,
    0,
    nftOwner.address,
    ownerInitialFractionSupply,
    initialFractionPrice,
  ];
  await deploy("Fractionalize1on1NFT", {
    from: nftOwner.address,
    args: args,
    log: true,
    waitConfirmations: 5,
    gasLimit: 10000000,
    value: value,
  });
  console.log("deployied!!! ");
  console.log(
    `the deployer balance is: ${await ethers.provider.getBalance(
      nftOwner.address
    )}`
  );
  console.log("-----------------");

  const fractionalize1on1NFT = await ethers.getContract(
    "Fractionalize1on1NFT",
    nftOwner.address
  );

  let tempReserveRatio = await fractionalize1on1NFT.getTempReseverRatio();
  console.log(`temp reserve ratio is : ${tempReserveRatio}`);
  let mainReserveRatio = await fractionalize1on1NFT.getMainReseverRatio();
  console.log(`main reserve ratio is : ${mainReserveRatio}`);
  let tempReserveBalnce = await fractionalize1on1NFT.getTempReserveBalance();
  console.log(`temp reserve Balnce is : ${tempReserveBalnce}`);
  let mainReserveBalnce = await fractionalize1on1NFT.getMainReserveBalance();
  console.log(`main reserve Balnce is : ${mainReserveBalnce}`);
  let ownerFee = await fractionalize1on1NFT.getOwnerFee();
  console.log(`instanuous owner fee is : ${ownerFee}`);
  let mintIndex = await fractionalize1on1NFT.mintIndex();
  console.log(`number of minted fractions  is: ${mintIndex}`);
  let price = await fractionalize1on1NFT.fractionPrice(
    ethers.utils.parseUnits(mainReserveBalnce.toString(), "wei"),
    mintIndex,
    mainReserveRatio,
    { gasLimit: 10000000 }
  );
  console.log(
    `current price  is : ${ethers.utils.formatUnits(price, "ether")}`
  );
};
module.exports.tags = ["all", "frationalizeNft"];
