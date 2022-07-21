const { getNamedAccounts, deployments, network } = require("hardhat");
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAcc, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // const ethUsdAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAgg = await deployments.get("MockV3Aggregator");
        ethUsdAddress = ethUsdAgg.address;
    } else {
        ethUsdAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    const args = [ethUsdAddress];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
};

module.exports.tags = ["all", "fundme"];
