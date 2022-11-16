pragma solidity >=0.8.7;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {BancorFormula} from "./Bancor/BancorFormula.sol";
import {SafeMath} from "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Fractionalize1on1NFT is BancorFormula, ERC721 {
    using SafeMath for uint256;
    using SafeMath for uint32;

    // Bancor formula's varaibles
    uint256 private constant FIXED_1 = 0x080000000000000000000000000000000;
    uint8 private constant PRECISION = 127;

    // contract variables
    address private NFTAddress; // original ERC721 address
    uint256 private NFTID; // original ERC721 ID
    address private ownerAddress; // owner address of the original ERC721
    uint256 private initialFractionPrice; // initial fraction price desired by the owner.
    uint256 private ownerInitialFractionSupply; // initial minted fractions to the owner.
    uint32 private constant RATIO_SCALE = 1000000; // a scale for the ratios
    uint32 private mainReserveRatio = 500000; // the main curve reserve ratio. after dividing on RATIO_SCALE, it's 50%.
    uint256 private mainReserveBalance; // main curve ETH balance.
    uint32 private tempReserveRatio; // tempoerary reserve ratio.
    // uint32 private maxTempReserveBalance; // temporary curve's balance can not exceed the main reserve Balance.
    uint256 private tempReserveBalance; // temporary reserve ETH balance.
    uint256 private mainBalanceThreshold; // the threeshold between main and temporary curves' balances. now it's half the valuation.
    uint256 private constant MIN_TEMP_BALANCE = 1e12; // minimum balance that the temporary curve can have. 10^-6 ETH
    uint256 private constant MIN_OWNER_FEE = 10000; // minimum value of the Owner fee.
    uint256 private ownerFee; // the value of the owner fee, ranges between MIN_OWNER_FEE and MIN_OWNER_FEE + tempReserveRatio/mainReserveRatio
    uint256 public mintedNum; // the continuous token supply, incrases/decreases with each buy/sell
    uint256 public mintIndex; // ID of the fraction to be minted.
    uint256 private constant LIQUIDITY_FEE = 5000; // this fee is calculated when working on the main curve. it's added to the temporary
    // curve balance to adjust its reserve ratio to reach main reserve ratio.
    uint256 private sumOwnerFees; // value of the cumulative fees for the owner to be withdrawn.

    event FractionBought(address indexed _buyer, uint256 fractionId);
    event FractionSold(address indexed _seller, uint256 fractionId);
    event OwnerFeesWithdrawn(address indexed _ownerAddress, uint256 amount);

    // the amount of ETH sent from the owner will define the initial liquidity of the curve. if he sends 0.1 ETH and minted 100 initial
    // fractions with 0.01 ETH price for the fraction, then the reserve ratio is now 10%.
    /// @param _fractionName choosen name for ERC721 fraction
    /// @param _fractionSymbol choosen symbol for ERC721 fraction
    /// @param _NFTAddress address of the original ERC721
    /// @param _NFTID tokenId of the original ERC721
    /// @param _ownerAddress address of the owner of the original ERC721
    /// @param _ownerInitialFractionSupply initial minted fractions to the owner at the beginning
    /// @param _initialFractionPrice initial fraction price desired by the owner
    constructor(
        string memory _fractionName,
        string memory _fractionSymbol,
        address _NFTAddress,
        uint256 _NFTID,
        address _ownerAddress,
        uint256 _ownerInitialFractionSupply,
        uint256 _initialFractionPrice
    ) payable ERC721(_fractionName, _fractionSymbol) {
        uint32 _tempReserveRatio = uint32(
            (msg.value).mul(RATIO_SCALE).div(
                _ownerInitialFractionSupply.mul(_initialFractionPrice)
            )
        );
        require(
            _tempReserveRatio <= mainReserveRatio,
            "Constructor: over funded!"
        );
        tempReserveRatio = _tempReserveRatio;
        mainReserveBalance = mainReserveRatio
            .mul(_ownerInitialFractionSupply)
            .mul(_initialFractionPrice)
            .div(RATIO_SCALE);
        mainBalanceThreshold = mainReserveBalance;
        tempReserveBalance = msg.value;
        NFTAddress = _NFTAddress;
        NFTID = _NFTID;
        initialFractionPrice = _initialFractionPrice;
        ownerInitialFractionSupply = _ownerInitialFractionSupply;
        ownerAddress = _ownerAddress;
        ownerFee = (tempReserveRatio.mul(MIN_OWNER_FEE).div(mainReserveRatio))
            .add(MIN_OWNER_FEE);
        for (uint256 i = 0; i < _ownerInitialFractionSupply; i++) {
            _safeMint(ownerAddress, i);
            mintIndex += 1;
            mintedNum += 1;
        }
    }

    function buyFraction() public payable {
        uint256 _newFractionPrice;
        //uint32 _tempReserveRatio = getTempReseverRatio();
        uint256 txOwnerFee = ownerFee.mul(msg.value).div(RATIO_SCALE);
        uint256 amountIn = msg.value.sub(txOwnerFee);
        // if the number of minted fractions is bigger that the inital farctions minted by the owner, we buy on the main curve.
        // this means larger reserveRatio and reserve balance in calculations, thus starting with a little bit smaller price.
        // this gives us the ability to conduct another fee to the curve so we increase the temporary curve balance.

        // also, we refactord the Bancor formula's so we can calculate the price of a single purchase.
        if (mintedNum >= ownerInitialFractionSupply) {
            uint256 txLiquidityFee = amountIn.mul(LIQUIDITY_FEE).div(
                RATIO_SCALE
            );
            amountIn = amountIn.sub(txLiquidityFee);
            _newFractionPrice = fractionPrice(
                mainReserveBalance,
                mintedNum,
                mainReserveRatio
            );
            require(
                amountIn >= _newFractionPrice,
                "buy: you did not send enough ETH!"
            );
            mainReserveBalance = mainReserveBalance.add(_newFractionPrice);
            if (tempReserveBalance.add(txLiquidityFee) > mainBalanceThreshold) {
                txLiquidityFee = mainBalanceThreshold.sub(tempReserveBalance);
            }
            tempReserveBalance = tempReserveBalance.add(txLiquidityFee);
            tempReserveRatio = uint32(
                (tempReserveBalance).mul(RATIO_SCALE).div(
                    ownerInitialFractionSupply.mul(initialFractionPrice)
                )
            );
        } else {
            // calculation on the temporary curve. this does not  include a fee for liquidity, because tha amount will be added directly
            // to the temporary reserve balance.
            _newFractionPrice = fractionPrice(
                tempReserveBalance,
                mintedNum,
                tempReserveRatio
            );
            require(
                amountIn >= _newFractionPrice,
                "buy: you did not send enough ETH!"
            );
            tempReserveBalance = tempReserveBalance.add(_newFractionPrice);
        }
        uint256 amountDif = amountIn.sub(_newFractionPrice); // if the user paid more eth, we repay him the difference in the same transaction.
        _safeMint(msg.sender, mintIndex);
        mintIndex += 1;
        mintedNum += 1;
        sumOwnerFees = sumOwnerFees.add(
            ownerFee.mul(msg.value).div(RATIO_SCALE)
        );
        if (amountDif > 1e14) {
            (bool successMoneyBack, ) = payable(msg.sender).call{
                value: amountDif
            }("");
            require(
                successMoneyBack,
                "buy: failed to send the rest of the money to the buyer!"
            );
        }

        emit FractionBought(msg.sender, mintIndex.sub(1));
    }

    function sellFraction(uint256 fractionId) public {
        // ifthe minted fractions are larger than the inital number of fractions minted to the owner, we sell on the main curve. otherwise,
        // we sell on the temporary curve. the same calculations for the fees in buyFraction() fnction is applied here.
        require(
            msg.sender == ownerOf(fractionId),
            "sell: the fraction is not yours!"
        );
        uint256 amountOut;
        if (mintedNum > ownerInitialFractionSupply) {
            amountOut = _calculateSaleReturn(
                mintedNum,
                mainReserveBalance,
                mainReserveRatio,
                1
            );
            mainReserveBalance = mainReserveBalance.sub(amountOut);
            uint256 txOwnerFee = ownerFee.mul(amountOut).div(RATIO_SCALE);
            uint256 txLiquidityFee = LIQUIDITY_FEE.mul(amountOut).div(
                RATIO_SCALE
            );
            amountOut = amountOut.sub(txOwnerFee).sub(txLiquidityFee);
            sumOwnerFees = sumOwnerFees.add(txOwnerFee);
            if (tempReserveBalance.add(txLiquidityFee) > mainBalanceThreshold) {
                txLiquidityFee = mainBalanceThreshold.sub(tempReserveBalance);
            }
            tempReserveBalance = tempReserveBalance.add(txLiquidityFee);
            tempReserveRatio = uint32(
                (tempReserveBalance).mul(RATIO_SCALE).div(
                    ownerInitialFractionSupply.mul(initialFractionPrice)
                )
            );
        } else {
            amountOut = _calculateSaleReturn(
                mintedNum,
                tempReserveBalance,
                tempReserveRatio,
                1
            );
            require(
                tempReserveBalance.sub(amountOut) > MIN_TEMP_BALANCE,
                "sell: temp ETH balance is too low"
            );
            tempReserveBalance = tempReserveBalance.sub(amountOut);
            uint256 txOwnerFee = ownerFee.mul(amountOut).div(RATIO_SCALE);
            amountOut = amountOut.sub(txOwnerFee);
        }
        _burn(fractionId);
        mintedNum -= 1;
        (bool successSellMoney, ) = payable(msg.sender).call{value: amountOut}(
            ""
        );
        require(successSellMoney, "sell: failed to send money to the seller!");
        emit FractionSold(msg.sender, fractionId);
    }

    // this function is a refactoring of the Bancor formula to calculate the price of a single fraction purchase.
    /// @param _reserve the Eth reserve of the curve
    /// @param _conTokenSupply the continuous token supply
    /// @param _reserveRatio the reserve ratio of the curve
    /// @return newPrice the price of the fraction depending on the state of the curve.

    function fractionPrice(
        uint256 _reserve,
        uint256 _conTokenSupply,
        uint256 _reserveRatio
    ) public pure returns (uint256 newPrice) {
        //console.log("inside fraction price function ..");
        uint256 logVal1 = generalLog((_conTokenSupply.add(1)).mul(FIXED_1));
        //console.log("logval1 is: ", logVal1);
        uint256 logVal2 = generalLog(_conTokenSupply.mul(FIXED_1));
        //console.log("logval2 is: ", logVal2);
        uint256 logVal = logVal1.sub(logVal2);
        //console.log("logval is: ", logVal);
        logVal = logVal.mul(RATIO_SCALE).div(_reserveRatio);
        //console.log("logval is: ", logVal);
        uint256 expVal = generalExp(logVal, PRECISION);
        //console.log("expVal is: ", expVal);
        newPrice = ((expVal.sub(FIXED_1))).mul(_reserve).div(FIXED_1);
        //console.log("newPrice is: ", newPrice);
    }

    function withdrawOwnerFees() public {
        require(
            msg.sender == ownerAddress,
            "withdrawOwnerFees: only owner can withdraw fees!"
        );
        (bool successWithdrawFees, ) = payable(ownerAddress).call{
            value: sumOwnerFees
        }("");
        require(
            successWithdrawFees,
            "withdrawOwnerFees: failed to withdraw owner fees!"
        );
        emit OwnerFeesWithdrawn(ownerAddress, sumOwnerFees);
    }

    function getTempReseverRatio() public view returns (uint32) {
        return tempReserveRatio;
    }

    function getOwnerFee() public view returns (uint256) {
        return ownerFee;
    }

    function getTempReserveBalance() public view returns (uint256) {
        return tempReserveBalance;
    }

    function getMainReserveBalance() public view returns (uint256) {
        return mainReserveBalance;
    }

    function getMainReseverRatio() public view returns (uint32) {
        return mainReserveRatio;
    }
}
