/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState } from "react";
import EthereumProvider from "@walletconnect/ethereum-provider";

type Props = {
  projectId?: string; // bisa otomatis pakai .env
  chainId?: number;
};

export default function SessionStressTest({
  projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "",
  chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 42220),
}: Props) {
  const [count, setCount] = useState<number>(2);
  const [delayMs, setDelayMs] = useState<number>(20000);
  const [approveTimeoutMs, setApproveTimeoutMs] = useState<number>(18000);
  const [running, setRunning] = useState<boolean>(false);
  const [log, setLog] = useState<string[]>([]);
  const stopRef = useRef(false);

  function appendLog(msg: string) {
    setLog((l) => [new Date().toISOString() + " — " + msg, ...l].slice(0, 200));
    console.log(msg);
  }

  async function makeOneSession(i: number) {
    appendLog(`Starting session #${i + 1}`);
    let provider: any;
    try {
      provider = await EthereumProvider.init({
        projectId,
        chains: [chainId],
        showQrModal: true,
      });

      provider.on("connect", (session: any) => {
        appendLog(`#${i + 1} connected — topic: ${session?.topic || "unknown"}`);
      });

      await provider.connect();

      appendLog(`#${i + 1} waiting ${approveTimeoutMs}ms for approval...`);
      await new Promise((res) => setTimeout(res, approveTimeoutMs));

      appendLog(
        `#${i + 1} session snapshot: ${
          provider.session?.topic
            ? JSON.stringify({ topic: provider.session.topic })
            : "none"
        }`
      );

      try {
        await provider.disconnect();
      } catch (dErr) {
        appendLog(`#${i + 1} disconnect error: ${String(dErr)}`);
      }
    } catch (err: any) {
      appendLog(`#${i + 1} error: ${err?.message || String(err)}`);
      try {
        provider?.disconnect?.();
      } catch {}
    }
  }

  async function runLoop() {
    if (!projectId) {
      appendLog("ERROR: Project ID missing.");
      setRunning(false);
      return;
    }
    stopRef.current = false;
    setRunning(true);
    appendLog(`=== START loop (count=${count}, delayMs=${delayMs}) ===`);

    for (let i = 0; i < count; i++) {
      if (stopRef.current) {
        appendLog("Stopped by user");
        break;
      }
      await makeOneSession(i);
      if (i < count - 1) {
        appendLog(`Waiting ${delayMs}ms before next session...`);
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    appendLog("=== FINISHED loop ===");
    setRunning(false);
  }

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif" }}>
      <h2>WalletConnect Session Stress Test</h2>
      <p>Project ID: {projectId || "❌ not set"}</p>
      <p>Chain: {chainId}</p>

      <div style={{ marginBottom: 12 }}>
        <label>
          Count:&nbsp;
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        &nbsp;&nbsp;
        <label>
          Delay (ms):&nbsp;
          <input
            type="number"
            value={delayMs}
            onChange={(e) => setDelayMs(Number(e.target.value))}
          />
        </label>
        &nbsp;&nbsp;
        <label>
          Approve Timeout (ms):&nbsp;
          <input
            type="number"
            value={approveTimeoutMs}
            onChange={(e) => setApproveTimeoutMs(Number(e.target.value))}
          />
        </label>
      </div>

      {!running ? (
        <button onClick={runLoop}>Start</button>
      ) : (
        <button
          onClick={() => {
            stopRef.current = true;
            setRunning(false);
          }}
        >
          Stop
        </button>
      )}

      <div
        style={{
          marginTop: 16,
          maxHeight: 300,
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 8,
          background: "#fafafa",
          fontSize: 12,
        }}
      >
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
