"use client";

import { Navbar } from "@/components/Navbar";
import { useState } from "react";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const account = createAccount();
const client = createClient({
  chain: studionet,
  account: account,
});

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function HomePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
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

      setResult(JSON.parse(data as string));
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
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
              {loading ? "Analyzing... (this may take a minute)" : "Analyze Text"}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          {result && (
            <div className="glass-card p-6 mt-6 space-y-4">
              <h2 className="text-2xl font-bold">Result</h2>
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

              {/* Confidence Bar */}
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