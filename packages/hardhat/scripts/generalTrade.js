const { ethers } = require("hardhat");

async function main() {
  const accounts = await ethers.getSigners();
  const owner = accounts[1];
  const buyer1 = accounts[2];
  const buyer2 = accounts[3];
  const curvFee = 5000;
  const mainReserveRatio = 500000;
  let mainReserveBalance = ethers.utils.parseEther("0.5");
  const ratioScale = 1000000;

  const fractionalize1on1NFT = await ethers.getContract("Fractionalize1on1NFT");
  const fractionalize1on1NFT1 = await fractionalize1on1NFT.connect(buyer1);
  let initialTempReserveRatio =
    await fractionalize1on1NFT1.getTempReseverRatio();
  let initialTempReserveBalance =
    await fractionalize1on1NFT1.getTempReserveBalance();
  let mintIndex = await fractionalize1on1NFT1.mintIndex();
  let mintedNum = await fractionalize1on1NFT1.mintedNum();
  console.log(`number of minted fractions is : ${mintedNum}`);
  let buyPrice = await fractionalize1on1NFT1.fractionPrice(
    ethers.utils.parseUnits(mainReserveBalance.toString(), "wei"),
    mintedNum,
    mainReserveRatio,
    { gasLimit: 10000000 }
  );
  console.log(
    `if you wanna buy, you pay: ${ethers.utils.formatUnits(buyPrice, "ether")}`
  );
  const ownerFee = await fractionalize1on1NFT1.getOwnerFee();
  let value1 = ethers.utils.parseEther("0.1");

  console.log("**********************************");
  console.log(
    "                   first user is buying on the main curve ...                "
  );
  mintedNum = await fractionalize1on1NFT1.mintedNum();
  console.log(`number of minted fractions is : ${mintIndex}`);
  let initalBuyer1ETHBalance = await ethers.provider.getBalance(buyer1.address);
  let initialBuyer1FractionsBalance = await fractionalize1on1NFT1.balanceOf(
    buyer1.address
  );

  let buy1Tx = await fractionalize1on1NFT1.buyFraction({ value: value1 });
  let buy1TxReciept = await buy1Tx.wait(1);
  let cumGasUsed = buy1TxReciept.cumulativeGasUsed;
  let gasPrice = buy1TxReciept.effectiveGasPrice;
  let finalBuyer1ETHBalance = await ethers.provider.getBalance(buyer1.address);
  let finalBuyer1FractionsBalance = await fractionalize1on1NFT1.balanceOf(
    buyer1.address
  );
  let expectedConduction1 = buyPrice
    .add(value1.mul(ownerFee.add(curvFee)).div(ratioScale))
    .add(cumGasUsed.mul(gasPrice));
  let finalTempReserveRatio = await fractionalize1on1NFT1.getTempReseverRatio();
  console.log(`inital buyer 1 balance (ETH) : ${initalBuyer1ETHBalance}`);
  console.log(`expected conduction : ${expectedConduction1}`);
  console.log(
    `expected final buyer 1 balance (ETH): ${initalBuyer1ETHBalance.sub(
      expectedConduction1
    )}`
  );
  console.log(`final buyer 1 balance (ETH) : ${finalBuyer1ETHBalance}`);
  console.log(
    `initial buyer 1 fractions balanse : ${initialBuyer1FractionsBalance}`
  );
  console.log(
    `final buyer 1 fractions balanse : ${finalBuyer1FractionsBalance}`
  );
  console.log(`initial temp reserve ratio is: ${initialTempReserveRatio}`);
  console.log(`final temp reserve ratio is: ${finalTempReserveRatio}`);
  console.log("*****************************************");
  console.log(
    "                   second user is buying on the main curve ...                "
  );

  initialTempReserveRatio = finalTempReserveRatio;
  const fractionalize1on1NFT2 = await fractionalize1on1NFT.connect(buyer2);
  mintedNum = await fractionalize1on1NFT2.mintedNum();
  console.log(`number of minted fractions is : ${mintedNum}`);
  mainReserveBalance = await fractionalize1on1NFT2.getMainReserveBalance();

  buyPrice = await fractionalize1on1NFT2.fractionPrice(
    ethers.utils.parseUnits(mainReserveBalance.toString(), "wei"),
    mintedNum,
    mainReserveRatio,
    { gasLimit: 10000000 }
  );
  console.log(
    `if you wanna buy, you pay: ${ethers.utils.formatUnits(buyPrice, "ether")}`
  );
  let initalBuyer2ETHBalance = await ethers.provider.getBalance(buyer2.address);
  let initialBuyer2FractionsBalance = await fractionalize1on1NFT.balanceOf(
    buyer2.address
  );
  const buy2Tx = await fractionalize1on1NFT2.buyFraction({ value: value1 });
  const buy2TxRexeipt = await buy2Tx.wait(1);
  cumGasUsed = buy2TxRexeipt.cumulativeGasUsed;
  gasPrice = buy2TxRexeipt.effectiveGasPrice;
  let finalBuyer2ETHBalance = await ethers.provider.getBalance(buyer2.address);
  let finalBuyer2FractionsBalance = await fractionalize1on1NFT2.balanceOf(
    buyer2.address
  );
  let expectedConduction2 = buyPrice
    .add(value1.mul(ownerFee.add(curvFee)).div(ratioScale))
    .add(cumGasUsed.mul(gasPrice));
  finalTempReserveRatio = await fractionalize1on1NFT2.getTempReseverRatio();
  console.log(`inital buyer 2 balance (ETH) : ${initalBuyer2ETHBalance}`);
  console.log(`expected conduction : ${expectedConduction2}`);
  console.log(
    `expected final buyer 2 balance (ETH): ${initalBuyer2ETHBalance.sub(
      expectedConduction2
    )}`
  );
  console.log(`final buyer 2 balance (ETH) : ${finalBuyer2ETHBalance}`);
  console.log(
    `initial buyer 2 fractions balanse : ${initialBuyer2FractionsBalance}`
  );
  console.log(
    `final buyer 2 fractions balanse : ${finalBuyer2FractionsBalance}`
  );

  console.log(`initial temp reserve ratio is: ${initialTempReserveRatio}`);
  console.log(`final temp reserve ratio is: ${finalTempReserveRatio}`);

  console.log("*****************************************");
  console.log(
    "                   first user is selling on the main curve...          "
  );
  initialTempReserveRatio = finalTempReserveRatio;
  mintedNum = await fractionalize1on1NFT1.mintedNum();
  console.log(`number of minted fractions is : ${mintedNum}`);
  console.log(`buyer 1 balance (ETH) : ${finalBuyer1ETHBalance}`);
  console.log(`buyer 1 fractions balance : ${finalBuyer1FractionsBalance}`);

  const sellTx1 = await fractionalize1on1NFT1.sellFraction(100);
  const sellTx1Receipt = await sellTx1.wait(1);
  finalBuyer1ETHBalance = await ethers.provider.getBalance(buyer1.address);
  finalBuyer1FractionsBalance = await fractionalize1on1NFT1.balanceOf(
    buyer1.address
  );
  finalTempReserveRatio = await fractionalize1on1NFT1.getTempReseverRatio();
  console.log(`final buyer 1 balance (ETH) : ${finalBuyer1ETHBalance}`);
  console.log(
    `final buyer 1 fractions balance : ${finalBuyer1FractionsBalance}`
  );

  console.log(`initial temp reserve ratio is: ${initialTempReserveRatio}`);
  console.log(`final temp reserve ratio is: ${finalTempReserveRatio}`);

  console.log("*****************************************");

  console.log("                     owner is selling on the main curve ...");
  initialTempReserveRatio = finalTempReserveRatio;
  const fractionalize1on1NFT0 = await fractionalize1on1NFT.connect(owner);
  mintedNum = await fractionalize1on1NFT0.mintedNum();
  console.log(`number of minted fractions is : ${mintedNum}`);
  let initialOwnerEthBalance = await ethers.provider.getBalance(owner.address);
  let initialOwnerFractionsBalance = await fractionalize1on1NFT0.balanceOf(
    owner.address
  );
  const sellTx0 = await fractionalize1on1NFT0.sellFraction(10);
  const sellTx0Receipt = await sellTx0.wait(1);
  let finalOwnerETHBalance = await ethers.provider.getBalance(owner.address);
  let finalOwnerFractionsBalance = await fractionalize1on1NFT0.balanceOf(
    owner.address
  );
  finalTempReserveRatio = await fractionalize1on1NFT0.getTempReseverRatio();
  console.log(`owner balance (ETH) : ${initialOwnerEthBalance}`);
  console.log(`owner fractions balance : ${initialOwnerFractionsBalance}`);

  console.log(`final owner balance (ETH) : ${finalOwnerETHBalance}`);
  console.log(`finalowner fractions balance : ${finalOwnerFractionsBalance}`);
  console.log(`initial temp reserve ratio is: ${initialTempReserveRatio}`);
  console.log(`final temp reserve ratio is: ${finalTempReserveRatio}`);

  console.log("*****************************************");

  console.log(
    "                         buyer 2 is selling on the temp curve ..."
  );
  mintedNum = await fractionalize1on1NFT2.mintedNum();
  console.log(`number of minted fractions is : ${mintedNum}`);
  initialTempReserveRatio = finalTempReserveRatio;
  console.log(`buyer 2 balance (ETH) : ${finalBuyer2ETHBalance}`);
  console.log(`buyer 2 fractions balance : ${finalBuyer2FractionsBalance}`);
  const sellTx2 = await fractionalize1on1NFT2.sellFraction(101);
  const sellTx2Receipt = await sellTx2.wait(1);
  finalBuyer2ETHBalance = await ethers.provider.getBalance(buyer2.address);
  finalBuyer2FractionsBalance = await fractionalize1on1NFT2.balanceOf(
    buyer2.address
  );
  finalTempReserveRatio = await fractionalize1on1NFT2.getTempReseverRatio();

  console.log(`final buyer 2 balance (ETH) : ${finalBuyer2ETHBalance}`);
  console.log(
    `final buyer 2 fractions balance : ${finalBuyer2FractionsBalance}`
  );
  console.log(`initial temp reserve ratio is: ${initialTempReserveRatio}`);
  console.log(`final temp reserve ratio is: ${finalTempReserveRatio}`);

  console.log("*****************************************");

  console.log(
    "                           buyer 1 is buying on the temp curve.."
  );

  mintedNum = await fractionalize1on1NFT1.mintedNum();
  console.log(`number of minted fractions is : ${mintedNum}`);
  initialTempReserveRatio = finalTempReserveRatio;
  console.log(`buyer 1 balance (ETH) : ${finalBuyer1ETHBalance}`);
  console.log(`buyer 1 fractions balance : ${finalBuyer1FractionsBalance}`);

  buy1Tx = await fractionalize1on1NFT1.buyFraction({ value: value1 });
  buy1TxReciept = await buy1Tx.wait(1);
  finalBuyer1ETHBalance = await ethers.provider.getBalance(buyer1.address);
  finalBuyer1FractionsBalance = await fractionalize1on1NFT1.balanceOf(
    buyer1.address
  );
  finalTempReserveRatio = await fractionalize1on1NFT2.getTempReseverRatio();
  console.log(`final buyer 1 balance (ETH) : ${finalBuyer1ETHBalance}`);
  console.log(
    `final buyer 1 fractions balance : ${finalBuyer1FractionsBalance}`
  );
  console.log(`initial temp reserve ratio is: ${initialTempReserveRatio}`);
  console.log(`final temp reserve ratio is: ${finalTempReserveRatio}`);

  console.log("*****************************************");

  console.log("                               withdrawing owner fees..");
  console.log(`owner balance (ETH) : ${finalOwnerETHBalance}`);
  let withdrawFeeTx = await fractionalize1on1NFT0.withdrawOwnerFees();
  await withdrawFeeTx.wait(1);
  finalOwnerETHBalance = await ethers.provider.getBalance(owner.address);
  console.log(`final owner balance (ETH) : ${finalOwnerETHBalance}`);
  console.log("*****************************************");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
