# AI Content Detector — Built on GenLayer

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)
[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/8Jm4v89VAu)
[![Telegram](https://img.shields.io/badge/Telegram--T.svg?style=social&logo=telegram)](https://t.me/genlayer)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/yeagerai.svg?style=social&label=Follow%20%40GenLayer)](https://x.com/GenLayer)

## 👀 About

This project is a full-stack dApp built on **GenLayer** that detects whether a piece of text is **AI-generated or Human-written**.

It uses GenLayer's **Intelligent Contracts** (Python smart contracts with AI capabilities) to analyze text and store the result on-chain. The result is verified by multiple AI validators through **Optimistic Democracy Consensus** before being finalized.

## ✨ Features

- Paste any text and get an instant AI/Human classification
- Quality score from 1 to 10
- Reason for the classification
- Result verified by 5 AI validators on-chain
- Built with Next.js 15 + TypeScript + genlayer-js

## 🧠 How it Works

1. User pastes text into the frontend
2. The frontend calls the `analyze_content` function on the Intelligent Contract
3. The contract uses `gl.nondet.exec_prompt` to send the text to an AI model
4. **5 validators** independently run the same analysis
5. GenLayer's **Optimistic Democracy Consensus** ensures all validators agree
6. The result is stored on-chain and returned to the frontend

## 🛠️ Requirements

- [Node.js](https://nodejs.org/) v18+
- A running GenLayer Studio — use the hosted version at [studio.genlayer.com](https://studio.genlayer.com)

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/NoMad-bnb/genlayer-project-boilerplate.git
cd genlayer-project-boilerplate
```

### 2. Deploy the Intelligent Contract

1. Open [studio.genlayer.com](https://studio.genlayer.com)
2. Create a new contract and paste the code from `/contracts/ai_content_detector.py`
3. Click **Deploy new instance**
4. Copy the contract address

### 3. Setup the frontend
```bash
cd frontend
cp .env.example .env
```

Edit `.env` and add your contract address:
```env
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here
```

### 4. Run the frontend
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📄 The Intelligent Contract

The contract is located at `/contracts/ai_content_detector.py`.
```python
# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json

class AIContentDetector(gl.Contract):
    last_result: str

    def __init__(self):
        self.last_result = ""

    @gl.public.write
    def analyze_content(self, text: str) -> None:
        # Uses AI to analyze the text
        ...

    @gl.public.view
    def get_last_result(self) -> str:
        return self.last_result
```

Key concepts used:
- `gl.Contract` — base class for all GenLayer contracts
- `gl.nondet.exec_prompt` — calls an AI model with a prompt
- `gl.eq_principle.prompt_comparative` — ensures validators agree on the result
- `@gl.public.write` — a function that modifies state
- `@gl.public.view` — a read-only function

## 🗳️ Optimistic Democracy Consensus

GenLayer uses a unique consensus mechanism where **multiple AI validators** independently execute the contract and must agree on the result before it's finalized on-chain.
```
PENDING → PROPOSING → COMMITTING → REVEALING → ACCEPTED
```

Each validator runs a different AI model (GPT, Claude, Gemini, etc.) and votes on the result. This ensures no single AI model can manipulate the outcome.

## 💬 Community

- **[Discord](https://discord.gg/8Jm4v89VAu)**
- **[Telegram](https://t.me/genlayer)**

## 📖 Documentation

- [GenLayer Docs](https://docs.genlayer.com/)
- [genlayer-js SDK](https://github.com/yeagerai/genlayer-js)

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.