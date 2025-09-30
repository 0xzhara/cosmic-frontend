"use client";

import { useState } from "react";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

// ABI smart contract (yang kamu kasih)
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "newCount", "type": "uint256" }
    ],
    "name": "CheckedIn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "message", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "MessageSent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "description", "type": "string" }
    ],
    "name": "ProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "voter", "type": "address" }
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "checkInCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_description", "type": "string" }],
    "name": "createProposal",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dailyCheckIn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "getProposal",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "proposals",
    "outputs": [
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "votes", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_message", "type": "string" }],
    "name": "sendMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [wcProvider, setWcProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [status, setStatus] = useState("");

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
  const PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;
  const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 42220); // Celo Mainnet = 42220

  async function connect() {
    try {
      setStatus("Opening WalletConnect modal...");
      const provider = await EthereumProvider.init({
        projectId: PROJECT_ID,
        chains: [CHAIN_ID],
        showQrModal: true
      });

      await provider.connect();

      const ethersProvider = new ethers.BrowserProvider(provider as any);
      const s = await ethersProvider.getSigner();
      const addr = await s.getAddress();

      setWcProvider(provider);
      setSigner(s);
      setAccount(addr);
      setStatus("Connected: " + addr);
    } catch (err: any) {
      console.error(err);
      setStatus("Connect error: " + (err?.message || err));
    }
  }

  async function disconnect() {
    try {
      if (wcProvider) {
        await wcProvider.disconnect();
        setAccount(null);
        setSigner(null);
        setWcProvider(null);
        setStatus("Disconnected");
      }
    } catch (err: any) {
      console.error(err);
      setStatus("Disconnect error: " + (err?.message || err));
    }
  }

  async function dailyCheckIn() {
    if (!signer) return setStatus("Please connect first");
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.dailyCheckIn();
      setStatus("⏳ Submitted: " + tx.hash);
      const receipt = await tx.wait();
      setStatus("✅ Confirmed in block " + receipt.blockNumber);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + (err?.message || err));
    }
  }

  async function createProposal() {
    if (!signer) return setStatus("Please connect first");
    const desc = prompt("Proposal description:");
    if (!desc) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.createProposal(desc);
      setStatus("⏳ Submitted: " + tx.hash);
      const receipt = await tx.wait();
      setStatus("✅ Proposal created in block " + receipt.blockNumber);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + (err?.message || err));
    }
  }

  async function vote() {
    if (!signer) return setStatus("Please connect first");
    const id = prompt("Proposal ID:");
    if (!id) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.vote(Number(id));
      setStatus("⏳ Submitted: " + tx.hash);
      const receipt = await tx.wait();
      setStatus("✅ Vote confirmed in block " + receipt.blockNumber);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + (err?.message || err));
    }
  }

  async function sendMessage() {
    if (!signer) return setStatus("Please connect first");
    const msg = prompt("Your message:");
    if (!msg) return;
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.sendMessage(msg);
      setStatus("⏳ Submitted: " + tx.hash);
      const receipt = await tx.wait();
      setStatus("✅ Message sent in block " + receipt.blockNumber);
    } catch (err: any) {
      console.error(err);
      setStatus("Error: " + (err?.message || err));
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>🚀 Cosmic (Celo Mainnet)</h1>
      <p>{status}</p>

      {account ? (
        <>
          <p>Connected: {account}</p>
          <button onClick={disconnect}>Disconnect</button>
          <hr />
          <button onClick={dailyCheckIn}>Daily Check-In</button>
          <button onClick={createProposal}>Create Proposal</button>
          <button onClick={vote}>Vote</button>
          <button onClick={sendMessage}>Send Message</button>
        </>
      ) : (
        <button onClick={connect}>Connect Wallet (WalletConnect)</button>
      )}
    </div>
  );
}
