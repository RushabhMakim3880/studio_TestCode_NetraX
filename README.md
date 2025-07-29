
# NETRA-X: Nodal Electronic Threat Reconnaissance & Attack System

![NETRA-X Banner](https://placehold.co/1200x300.png)

**A modular, AI-enhanced platform for advanced, simulated cybersecurity operations.**

---

## Overview

NETRA-X is a sophisticated web application designed to serve as a comprehensive command and control (C2) center for educational and professional cybersecurity training. It integrates a full suite of offensive (Red Team) and defensive (Blue Team) tools, enhanced by generative AI, to provide a realistic and interactive learning environment.

From planning multi-stage phishing campaigns and generating custom malware concepts to analyzing logs and assessing vulnerabilities, NETRA-X offers a centralized platform to simulate and manage the entire cybersecurity lifecycle.

## Key Features

The platform is organized into distinct modules, each catering to a specific phase or function of a security operation.

### 🛡️ Offensive Operations
-   **Phishing & Social Engineering**:
    -   **AI Phishing Email Generator**: Craft context-aware phishing emails for specific targets and scenarios.
    -   **Webpage Cloner & Harvester**: Clone live websites and inject credential harvesting scripts.
    -   **Campaign Management**: Plan and execute simulated phishing campaigns against target profiles.
-   **Payload & Exploit Generation**:
    -   **AI Malware Concept Generator**: Design conceptual malware with features like reverse shells, persistence, and keylogging.
    -   **Rubber Ducky Script Generator**: Convert natural language commands into DuckyScript for HID attack simulations.
    -   **LOLBins Payload Generator**: Create command-line payloads using trusted OS binaries to simulate evasion techniques.
-   **Command & Control**:
    -   **Telegram C2 Panel**: Use Telegram bots for remote command execution and data exfiltration.
    -   **Live Session Hijacking**: Inject JS payloads to monitor user activity (keystrokes, clicks), capture screenshots, and simulate device hijacking.
    -   **WebRAT**: A Remote Access Toolkit to interact with compromised browser sessions in real-time.

### 🔍 Intelligence & Reconnaissance (OSINT)
-   **Domain & IP Analysis**: Perform WHOIS lookups, DNS queries, and subdomain scanning.
-   **Data Breach Investigation**: Check emails and domains against the IntelX.io breach compilation database.
-   **Social Media Analysis**: Generate simulated intelligence reports from social media profiles.
-   **Metadata Scrubber**: Analyze and simulate scrubbing EXIF data from images to prevent information leaks.
-   **Google & Shodan Dorking**: Generate advanced search queries to discover exposed assets and information.

### 🔬 Defensive & Analysis Suite
-   **Log & Config Analysis**: Use AI to parse log files (Apache, Syslog) and infrastructure configurations (Nginx, Dockerfile) to find anomalies and misconfigurations.
-   **Malware Analysis**:
    -   **VirusTotal Integration**: Scan file hashes against the VirusTotal database.
    -   **Client-Side Analyzer**: Extract strings and calculate hashes of files entirely within the browser.
    -   **AI Yara Rule Generator**: Create Yara rules from natural language descriptions of malware characteristics.
-   **Vulnerability Assessment**:
    -   **CVSS v3.1 Calculator**: Score vulnerabilities based on standard metrics.
    -   **AI Exploit Chain Assistant**: Analyze how multiple vulnerabilities can be chained together for greater impact.

### 🤖 Project & Platform Management
-   **AI-Powered Assistance**: Genkit integration leverages Google's Gemini models for context-aware tips, report generation, and strategic planning.
-   **Customizable Dashboard**: A command center with widgets for monitoring activity, project progress, and threat intel.
-   **Project & Task Management**: Plan campaigns, create tasks (manually or with AI), and assign them to team members with a Gantt chart timeline view.
-   **Document Generation**: Automatically create professional documents like Statements of Work (SOW) and Letters of Reconnaissance (LOR).

## Tech Stack

-   **Framework**: Next.js 15 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS with shadcn/ui components
-   **Generative AI**: Google's Gemini models via Genkit
-   **Real-time Communication**: Firebase (Firestore)
-   **Authentication**: Custom JWT-based auth with role-based access control (RBAC)

---

## 🚀 Getting Started: Setup Guide

Follow these steps carefully to set up and run NETRA-X on your local machine.

### Step 1: Prerequisites

-   **Node.js**: Version 18 or later.
-   **npm** (or yarn/pnpm).
-   **Python 3**: Required for the optional Nmap wrapper script.
-   **Nmap**: Required for the optional Nmap wrapper script.
-   **(Optional) Ollama**: For running AI features locally. [ollama.com](https://ollama.com)

### Step 2: Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/netra-x.git
    cd netra-x
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Step 3: Firebase Setup (Required for Core Features)

The chat and real-time collaboration features depend on Firebase.

1.  **Go to the Firebase Console**: [console.firebase.google.com](https://console.firebase.google.com)
2.  **Create a Project**: Click **Add project**, give it a name, and accept the terms. You can disable Google Analytics.
3.  **Create a Web App**: In your project dashboard, click the Web icon (`</>`). Register the app with a nickname.
4.  **Get Config Keys**: After registering, Firebase will display a `firebaseConfig` object. You need these values.
5.  **Create `.env` File**: In the root of your project, create a file named `.env`.
6.  **Populate `.env` File**: Copy the keys from your `firebaseConfig` object into the `.env` file. **Crucially, add `NEXT_PUBLIC_` before each key name.**

    Your `.env` file should look like this (with your actual values):
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
    NEXT_PUBLIC_FIREBASE_APP_ID="1:..."
    ```

7.  **Enable Firestore & Storage**:
    -   In the Firebase console, go to **Build > Firestore Database**. Click **Create database**, select a location, and start in **Test mode**.
    -   Go to **Build > Storage**. Click **Get started** and start in **Test mode**.

### Step 4: Third-Party API Keys (Optional but Recommended)

To enable all OSINT and analysis features, add these keys to your `.env` file.

```env
# Get from https://aistudio.google.com/app/apikey (for AI features)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Get from https://www.virustotal.com/ (for hash scanning)
VIRUSTOTAL_API_KEY="YOUR_VIRUSTOTAL_API_KEY"

# Get from https://www.whoisxmlapi.com/ (for Whois lookups)
WHOIS_API_KEY="YOUR_WHOIS_API_KEY"

# Get from https://intelx.io/ (for data breach searches)
INTELX_API_KEY="YOUR_INTELX_API_KEY"
```

### Step 5: Nmap Wrapper Setup (Optional)

For advanced network scans (SYN, OS Detection), you need to run a local Python wrapper.

1.  **Install Python libraries**:
    ```bash
    pip install flask python-nmap
    ```
2.  **Run the script**: A script is provided in the `Advanced Network Scanner` component UI. Save it as `nmap_api.py` and run it from your terminal:
    ```bash
    python nmap_api.py
    ```
    For `sudo`-required scans, you may need to run `sudo python nmap_api.py`. The script runs a local server on port 5000 that NETRA-X communicates with.

### Step 6: Running the Application

1.  **Start the Development Server**:
    ```bash
    npm run dev
    ```

2.  **Access the Application**: Open [http://localhost:3000](http://localhost:3000) in your browser.

3.  **Log In**: You can log in with the default credentials (e.g., `admin` / `password123`).

---

## ⚠️ Disclaimer

NETRA-X is a powerful tool created for educational and professional security testing purposes **only**. It should be used exclusively in authorized environments and against systems you have explicit permission to test. Unauthorized use of this software against any system is illegal. The developers assume no liability and are not responsible for any misuse or damage caused by this program.
