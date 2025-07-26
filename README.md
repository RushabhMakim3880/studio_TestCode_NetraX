# NETRA-X Core

**Nodal Electronic Threat Reconnaissance & Attack System**

![NETRA-X Banner](https://placehold.co/1200x300.png)
*A comprehensive, modular platform for advanced cybersecurity operations.*

---

## Overview

NETRA-X is a powerful, AI-enhanced web application designed to be a centralized command center for both offensive (Red Team) and defensive (Blue Team) security tasks. From planning sophisticated phishing campaigns to analyzing malware and generating executive reports, NETRA-X provides an integrated suite of tools to streamline security workflows.

This platform is built with a modern tech stack and is designed for educational, research, and authorized professional use.

## Key Features

- **🛡️ Offensive Operations:**
  - **Phishing Simulator:** Clone webpages, inject credential harvesters, and launch campaigns.
  - **Campaign Management:** Plan, execute, and monitor phishing campaigns against target profiles.
  - **Payload Generation:** Create custom malware concepts, DuckyScript, reverse shells, and more with AI assistance.
  - **C2 via Telegram:** Use Telegram for simple, effective command and control.
  - **Live Session Hijacking:** Inject JS payloads to monitor user activity, capture keystrokes, and exfiltrate data in real-time.

- **🔍 Intelligence Gathering (OSINT):**
  - **Comprehensive Recon:** Perform WHOIS lookups, DNS queries, and subdomain scanning.
  - **Data Breach Analysis:** Check emails and domains against breach compilations via IntelX.
  - **Profile Analysis:** Generate simulated intelligence reports from social media profiles and scrub metadata from images.

- **🔬 Defensive & Analysis Suite:**
  - **Malware Analysis:** Scan file hashes against VirusTotal and perform client-side analysis to extract strings.
  - **Log & Config Analysis:** Use AI to parse log files and infrastructure configurations for anomalies and misconfigurations.
  - **Vulnerability Assessment:** A suite of tools including a CVSS calculator and an AI Exploit Chain Assistant.

- **🤖 AI-Powered Assistance:**
  - **Genkit Integration:** Leverages Google's Gemini models for a wide range of tasks, from code generation to data analysis.
  - **Context-Aware Tips:** Provides helpful tips based on the user's role and current module.
  - **Automated Reporting:** Generate executive summaries and charts for operational reports.

- **📈 Project Management & Reporting:**
  - **Centralized Dashboard:** A customizable command center with widgets for monitoring activity, project progress, and threat intel.
  - **Task Management:** Plan projects, create tasks (manually or with AI), and assign them to team members.
  - **Document Generation:** Automatically create professional documents like Statements of Work (SOW) and Letters of Reconnaissance (LOR).

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **Generative AI:** Google's Gemini models via Genkit
- **Authentication:** Custom JWT-based auth with role-based access control (RBAC)
- **Database:** Client-side `localStorage` for this simulation.

---

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env` in the root of the project and add your API keys. These are crucial for the application's intelligence and AI features to function.

    ```env
    # Get from https://aistudio.google.com/app/apikey
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

    # Get from https://www.virustotal.com/
    VIRUSTOTAL_API_KEY="YOUR_VIRUSTOTAL_API_KEY"
    
    # Get from https://www.whoisxmlapi.com/
    WHOIS_API_KEY="YOUR_WHOIS_API_KEY"
    
    # Get from https://intelx.io/
    INTELX_API_KEY="YOUR_INTELX_API_KEY"
    ```

### Running the Development Server

1.  **Start the Genkit AI tools (in a separate terminal):**
    ```bash
    npm run genkit:dev
    ```

2.  **Start the Next.js development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can log in with the default credentials (e.g., `admin` / `password123`).

---

## Deployment

This application is optimized for deployment on platforms that support Next.js, such as **Vercel** or **Netlify**.

To deploy on Vercel:
1.  Push your code to a GitHub repository.
2.  Import the repository into Vercel.
3.  **Crucially, add the same environment variables listed above in the Vercel project settings.**
4.  Deploy! Vercel will handle the build process automatically.

---

## ⚠️ Disclaimer

NETRA-X is a powerful tool created for educational and professional security testing purposes **only**. It should be used exclusively in authorized environments and against systems you have explicit permission to test. Unauthorized use of this software against any system is illegal. The developers assume no liability and are not responsible for any misuse or damage caused by this program.