import { ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectBtn = document.getElementById("connect");
const fundBtn = document.getElementById("fund");
const balBtn = document.getElementById("balanceBtn");
const withdrawBtn = document.getElementById("withdraw");
balBtn.onclick = getBalance;
connectBtn.onclick = connect;
fundBtn.onclick = fund;
withdrawBtn.onclick = withdraw;

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        connectBtn.innerHTML = "connected!";
    } else {
        connectBtn.innerHTML = "install metamask!";
    }
}

async function getBalance() {
    if (typeof window.ethereum != "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(contractAddress);
        console.log(ethers.utils.formatEther(balance));
    }
}

async function fund() {
    const ethAmt = document.getElementById("ethAmt").value;
    console.log(`${ethAmt}`);
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        try {
            const txResp = await contract.fund({
                value: ethers.utils.parseEther(ethAmt),
            });
            await listenForTxMine(txResp, provider);
        } catch (error) {
            console.log(error);
        }
    }
}

function listenForTxMine(txResp, provider) {
    console.log(`Mining ${txResp.hash}...`);
    return new Promise((resolve, reject) => {
        provider.once(txResp.hash, (txReceipt) => {
            console.log(
                `Completed with ${txReceipt.confirmations} confirmations`
            );
            resolve();
        });
    });
}

async function withdraw() {
    if (typeof window.ethereum != "undefined") {
        console.log("withdraw");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);
        try {
            const txResp = await contract.withdraw();
            await listenForTxMine(txResp, provider);
        } catch (error) {
            console.log(error);
        }
    }
}
