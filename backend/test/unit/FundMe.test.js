const { deployments, ethers } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1");

          beforeEach(async function () {
              // const accounts = await ethers.getSigners();
              // const accountZero = accounts[0];
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe");
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", async function () {
              it("sets aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async function () {
              it("fails not enough eth", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith("Not enough");
              });

              it("updated amount", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddToAmtFunded(deployer);
                  assert.equal(response.toString(), sendValue.toString());
              });

              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraw ETH from a single founder", async function () {
                  const startingBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const depStartBal = await fundMe.provider.getBalance(
                      deployer
                  );

                  const txResp = await fundMe.withdraw();
                  const txReceipt = await txResp.wait(1);

                  const { gasUsed, effectiveGasPrice } = txReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  const endDepBal = await fundMe.provider.getBalance(deployer);

                  assert.equal(endFundMeBal, 0);
                  assert.equal(
                      startingBal.add(depStartBal).toString(),
                      endDepBal.add(gasCost).toString()
                  );
              });

              it("cheapwithdraw ETH from a single founder", async function () {
                  const startingBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const depStartBal = await fundMe.provider.getBalance(
                      deployer
                  );

                  const txResp = await fundMe.cheapWithdraw();
                  const txReceipt = await txResp.wait(1);

                  const { gasUsed, effectiveGasPrice } = txReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  const endDepBal = await fundMe.provider.getBalance(deployer);

                  assert.equal(endFundMeBal, 0);
                  assert.equal(
                      startingBal.add(depStartBal).toString(),
                      endDepBal.add(gasCost).toString()
                  );
              });

              it("multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const depStartBal = await fundMe.provider.getBalance(
                      deployer
                  );

                  const txResp = await fundMe.withdraw();
                  const txReceipt = await txResp.wait(1);

                  const { gasUsed, effectiveGasPrice } = txReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  const endDepBal = await fundMe.provider.getBalance(deployer);

                  assert.equal(endFundMeBal, 0);
                  assert.equal(
                      startingBal.add(depStartBal).toString(),
                      endDepBal.add(gasCost).toString()
                  );

                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddToAmtFunded(accounts[i].address),
                          0
                      );
                  }
              });

              it("Only owner allowed", async function () {
                  const accounts = await ethers.getSigners();
                  const attackerConnectedcontract = await fundMe.connect(
                      accounts[1]
                  );
                  await expect(
                      attackerConnectedcontract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner");
              });

              it("cheap withdraw multiple funders", async function () {
                  const accounts = await ethers.getSigners();
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  const startingBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const depStartBal = await fundMe.provider.getBalance(
                      deployer
                  );

                  const txResp = await fundMe.cheapWithdraw();
                  const txReceipt = await txResp.wait(1);

                  const { gasUsed, effectiveGasPrice } = txReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  );

                  const endDepBal = await fundMe.provider.getBalance(deployer);

                  assert.equal(endFundMeBal, 0);
                  assert.equal(
                      startingBal.add(depStartBal).toString(),
                      endDepBal.add(gasCost).toString()
                  );

                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddToAmtFunded(accounts[i].address),
                          0
                      );
                  }
              });
          });
      });
