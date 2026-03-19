"use client";

import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { TransactionStatus } from "genlayer-js/types";
import { createGenLayerClient, getAccounts } from "@/lib/genlayer/client";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const HISTORY_KEY_GUEST = "scan_history_guest";
const HISTORY_KEY_VERIFIED = "scan_history_verified";

interface ScanResult {
  text: string;
  content_type: string;
  score: number;
  confidence: number;
  reason: string;
  timestamp: string;
  mode: string;
}

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"verified" | "guest">("guest");

  // Load history from localStorage when mode changes
  useEffect(() => {
    const key = mode === "guest" ? HISTORY_KEY_GUEST : HISTORY_KEY_VERIFIED;
    const saved = localStorage.getItem(key);
    setHistory(saved ? JSON.parse(saved) : []);
  }, [mode]);

  const saveHistory = (newHistory: ScanResult[], currentMode: string) => {
    const key = currentMode === "guest" ? HISTORY_KEY_GUEST : HISTORY_KEY_VERIFIED;
    localStorage.setItem(key, JSON.stringify(newHistory));
    setHistory(newHistory);
  };

  const clearHistory = () => {
    const key = mode === "guest" ? HISTORY_KEY_GUEST : HISTORY_KEY_VERIFIED;
    localStorage.removeItem(key);
    setHistory([]);
  };

  const analyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      let client;

      if (mode === "verified") {
        const disconnected = localStorage.getItem("wallet_disconnected") === "true";
        const accounts = await getAccounts();
        if (disconnected || !accounts || accounts.length === 0) {
          setError("Please connect your wallet to use Verified mode.");
          setLoading(false);
          return;
        }
        client = createGenLayerClient(accounts[0]);
      } else {
        client = createClient({
          chain: studionet,
          account: createAccount(),
        });
      }

      const txHash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "analyze_content",
        args: [text],
        value: 0n,
      });

      await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.FINALIZED,
        retries: 60,
        interval: 5000,
      });

      const data = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_last_result",
        args: [],
      });

      const parsed = JSON.parse(data as string);
      const newResult: ScanResult = {
        ...parsed,
        text: text,
        timestamp: new Date().toLocaleTimeString(),
        mode: mode === "verified" ? "Verified" : "Guest",
      };

      const newHistory = [newResult, ...history];
      saveHistory(newHistory, mode);
      setResult(newResult);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AI Content Detector
            </h1>
            <p className="text-lg text-muted-foreground">
              Detect if text is AI-generated or Human-written using GenLayer blockchain.
            </p>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex rounded-lg overflow-hidden border border-white/10">
              <button
                onClick={() => setMode("guest")}
                className={`flex-1 py-2 text-sm font-semibold transition-all ${
                  mode === "guest"
                    ? "bg-accent text-white"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                Guest
              </button>
              <button
                onClick={() => setMode("verified")}
                className={`flex-1 py-2 text-sm font-semibold transition-all ${
                  mode === "verified"
                    ? "bg-accent text-white"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                Verified
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {mode === "guest"
                ? "No wallet required. Results are not tied to your identity."
                : "Requires MetaMask. Results are verified on-chain and linked to your wallet."}
            </p>

            <textarea
              className="w-full h-40 p-4 rounded-lg bg-white/5 border border-white/10 text-white resize-none focus:outline-none focus:border-accent"
              placeholder="Paste any text here to analyze..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              onClick={analyzeText}
              disabled={loading || !text.trim()}
              className="w-full py-3 px-6 rounded-lg bg-accent text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Analyzing..." : "Analyze Text"}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {result && (
            <div className="glass-card p-6 mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Result</h2>
                <span className="text-xs px-3 py-1 rounded-full border border-white/10 text-muted-foreground">
                  {result.mode}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Type</p>
                  <p className={`text-2xl font-bold ${result.content_type === "Human" ? "text-green-400" : "text-red-400"}`}>
                    {result.content_type}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Quality Score</p>
                  <p className="text-2xl font-bold text-accent">{result.score}/10</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Confidence</p>
                  <p className="text-2xl font-bold text-yellow-400">{result.confidence}%</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Confidence Level</p>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${result.content_type === "Human" ? "bg-green-400" : "bg-red-400"}`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">Reason</p>
                <p className="text-white">{result.reason}</p>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Scan History</h2>
                <button
                  onClick={clearHistory}
                  className="text-sm text-muted-foreground hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={index} className="glass-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${item.content_type === "Human" ? "text-green-400" : "text-red-400"}`}>
                        {item.content_type}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-accent text-sm">{item.score}/10</span>
                        <span className="text-yellow-400 text-sm">{item.confidence}%</span>
                        <span className="text-muted-foreground text-xs border border-white/10 px-2 rounded-full">
                          {item.mode}
                        </span>
                        <span className="text-muted-foreground text-xs">{item.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{item.text}</p>
                    <p className="text-xs text-white/70">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="https://genlayer.com" target="_blank" className="hover:text-accent transition-colors">
              Powered by GenLayer
            </a>
            <a href="https://docs.genlayer.com" target="_blank" className="hover:text-accent transition-colors">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}