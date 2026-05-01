<p align="center">
  <img src="frontend/public/favicon.svg" alt="FuzzAI Logo" width="120" />
</p>

<h1 align="center">FuzzAI</h1>

<p align="center">
  <strong>Next-Generation Automated Fuzz Testing & Vulnerability Analysis Engine</strong><br>
  <em>Powered by FastAPI, Vite, and Gemini 2.0 Flash</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688.svg" alt="FastAPI">
  <img src="https://img.shields.io/badge/Vite-5.0+-646CFF.svg" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</p>

---

## ⚡ Overview

**FuzzAI** is an industrial-grade, full-stack application designed to automatically identify, classify, and explain security vulnerabilities and edge-case failures in Python functions and REST API endpoints. 

By utilizing dynamic **Fuzz Testing**, FuzzAI bombards target code with hundreds of malformed, unexpected, or malicious payloads (SQL Injection, XXE, Unicode bombs, buffer overflows). Instead of simply crashing, FuzzAI catches the exceptions in a secure sandbox, streams the results to a real-time dashboard, and leverages AI to provide actionable patches.

## 🔥 Key Features

* **Real-time SSE Streaming:** Built on FastAPI, the backend streams pass/fail results instantly to the frontend dashboard using Server-Sent Events.
* **Dual-Mode Fuzzing:** 
  * *Code Fuzzer:* Safely executes untrusted Python code in an isolated subprocess with strict timeouts.
  * *API Fuzzer:* Rapid-fires malicious JSON and string payloads against live HTTP endpoints to test for robust error handling.
* **Intelligent Payload Generation:** A built-in engine that produces diverse edge cases (e.g., `NaN`, deep recursion, path traversal vectors).
* **AI Crash Analysis:** Integrates with Google Gemini to analyze stack traces and provide plain-English explanations and code patches.
* **Automated PDF Audits:** Generates native, sanitized, professional PDF security reports for compliance and auditing.

## 🏗 Architecture

FuzzAI is built with a decoupled architecture for maximum performance and security:

1. **Frontend (`/frontend`)**: A high-performance SPA built with Vanilla JS and Vite. Uses `Chart.js` for severity visualization and raw SSE listeners for sub-millisecond feed updates.
2. **Backend (`/backend`)**: An asynchronous Python server built on `FastAPI`. 
   * **Sandbox Engine:** Uses `subprocess` and `pickle` to serialize complex objects and safely execute untrusted code without risking the host server.
   * **Fuzz Generator:** Mutates static dictionaries of known attack vectors to generate dynamic payloads.

## 🚀 Getting Started

### 1. Backend Setup
Navigate to the backend directory, set up your environment, and start the server.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
In a new terminal window, start the Vite development server.
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables (Optional)
To enable the AI Explainer, copy the example environment file and add your Google Gemini API key.
```bash
cd backend
cp .env.example .env
# Edit .env and insert: GEMINI_API_KEY="your_api_key_here"
```

## 🛡️ Security Disclaimer

FuzzAI is a powerful testing tool designed for **authorized security auditing and educational purposes only**. The API fuzzer is capable of generating massive amounts of network traffic and malicious payloads. Do not run the API Fuzzer against endpoints you do not own or have explicit permission to test.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
