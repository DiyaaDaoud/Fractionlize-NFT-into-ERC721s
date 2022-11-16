# 🏗 Fractionalize ERC721 NFT into ERC721 fractions
> this repo is still under development, and it inherits from the marvelous [Nibbl](https://github.com/NibblNFT/nibbl-smartcontracts) project.

# Main Idea

In this project, we aim to fractionalize a 1/1 NFT, BUT NOT INTO ERC20 token, into ERC721 fractions. this process is controlled using [bonding curves and Bancor formulas](https://yos.io/2018/11/10/bonding-curves/).
In general, Bancor formulas gives us the ability to caclulate:
- Purchase Return: which is the amount of tokens the buyer will recieve after paying some amount of ETH, depending on the instantaneous ReserveTokenBalance, ContinuousTokenBalance, and the ReserveRatio.
- Sale Return: which is the amount of ETH the seller will gain after selling some amount of tokens, depending on the instantaneous ReserveTokenBalance, ContinuousTokenSupply, and the ReserveRatio. 

In our case, we are dealing with a single fraction buying/selling at once. So, instead of calculating the PurchaseReturn, we will calculate the single fraction price as :

![image](https://i.ibb.co/TLrpkb6/Bancor-Price-Formula.png)

# Procedure

this project relies on two bonding curves:
- Main curve: has a statice Reserve Ratio. this curve represents what we aim our trading flow and how the price changing would be in the long term.
- Temporary curve: has a flexible parameters.

WHY?

Let's suppose we have a single bonding curve. The owner valued his NFT to be 50 ETH, he wants the bonding curve to have a Reserve Ratio of 50%, and the initial fraction price to be 0.01 ETH. Logically, the owner would want people to buy at or above the 50 ETH point at the curve (each point is defined by the number of fractions supplied, and the price of the fraction). So, he MUST kickoff the liquidity by adding amount equals the area under the curve from the origin to the 50 ETH point. this is a perpendicular triangle with two sides 5000 and 0.01, its area is 1/2 * 5000 * 0.01 = 25. So, he must add 25 ETH to the curve, and then mints 5000 fractions, so the reserve ratio would become 25/(5000*0.01) = 50%, and people could start buying at atleast 0,01 ETH per fraction.

Now, 25 ETH (as example) is not a considerable amount of money to pay at once. to overcome this, we can split the whole curve into Two: 
- the first one in the interval [0,5000] fractions
- the second one starts from 5000.

Now,the owner can kickoff the liquidity of the system by adding less amount, let's say 5 ETH.  so the reserve ratio is now 10% in the first curve. This defines the shape of the temporary curve, while the primary curve will have a constant desired reserve ratio of 50%.
Our goal now is to adjust the shape of the temporary curve so it matches the main one.

# 🏄‍♂️ Trading

- when we buy/sell on the main curve: we take a royalty fee to the owner + a small fee that is added to the balance in the temporary curve to adjust its shape.
- when we buy/sell on the temporary curve: we only take the the onwer fee, as the reserve ratio should be stable while we trade on the curve.

> SO, what decides which curve to buy or sell on? 

A GENERAL RULE: buying/selling will always be on the main curve as long as the number of minted fractions in the system is larger or equal the number of fractions minted initialy by the owner (5000 in our example).

The owner is made to mint this amount to make sure that we start at a certain level. so unless the owner sells some of his fractions, we will always buy and sell on the main curve, and adjust the shape of the temporary curve using the liquidity fee from trading.

# Quick start

> install and start your 👷‍ Hardhat chain:

```bash
yarn install
yarn chain
```

> in a second terminal window, 🛰 deploy your contract:

```bash
yarn deploy --network localhost
```
or for a fresh deployment:

```bash
yarn deploy --reset --network localhost
```

> Keep the local chain running after deployment. Now to check the functionality real quick, run the general trading script and check the results
```bash
cd packages/hardhat
yarn hardhat run scripts/generalTrading.js --network localhost
```
