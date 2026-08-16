<div align="center">

<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/logo.png" width="120" alt="DEVSPA Logo">

⚡ DEVSPA

The AI-Powered Developer OS

<p>
  <strong>Code.</strong>&nbsp;&nbsp;
  <strong>Understand.</strong>&nbsp;&nbsp;
  <strong>Debug.</strong>&nbsp;&nbsp;
  <strong>Build.</strong>&nbsp;&nbsp;
  <strong>Ship.</strong>
</p>

<p>
  <a href="https://devspa.vercel.app">🌐 <b>LIVE DEMO</b></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://youtu.be/oOVtkJ5dLAM">▶️ <b>WATCH DEMO</b></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://github.com/AR-Coders9-web/Devspa">💻 <b>SOURCE CODE</b></a>
</p>

<br>

<img src="https://img.shields.io/badge/STATUS-HACKATHON%20BUILD-7C3AED?style=for-the-badge&labelColor=09090B" alt="Status">
<img src="https://img.shields.io/badge/AI-GEMINI-4285F4?style=for-the-badge&labelColor=09090B" alt="AI">
<img src="https://img.shields.io/badge/FRONTEND-REACT-61DAFB?style=for-the-badge&labelColor=09090B" alt="React">
<img src="https://img.shields.io/badge/BACKEND-NODE%20%2B%20EXPRESS-339933?style=for-the-badge&labelColor=09090B" alt="Backend">

</div>

<div align="center">

🧬 A Developer Workspace Designed Like an Operating System

DEVSPA is not just an editor.

It is an attempt to bring the developer's code, files, terminal, debugging workflow, AI assistance and GitHub connection into one focused environment.

</div>

🌌 THE IDEA

Modern development often looks like this:

┌──────────┐     ┌──────────┐     ┌──────────┐
│  Editor  │ ──► │ Browser  │ ──► │   AI     │
└──────────┘     └──────────┘     └──────────┘
      │                │                │
      ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Terminal │ ──► │ Debugger │ ──► │ GitHub   │
└──────────┘     └──────────┘     └──────────┘

             CONSTANT CONTEXT SWITCHING

DEVSPA explores a different model:

                         ┌──────────────────────┐
                         │        DEVSPA        │
                         │   AI DEVELOPER OS    │
                         └──────────┬───────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
       ┌─────────┐             ┌─────────┐             ┌─────────┐
       │  CODE   │             │   AI    │             │ DEBUG   │
       │ EDITOR  │             │ASSISTANT│             │  CORE   │
       └────┬────┘             └────┬────┘             └────┬────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
               ┌─────────┐    ┌──────────┐    ┌─────────┐
               │ FILES   │    │ TERMINAL │    │ GITHUB  │
               └─────────┘    └──────────┘    └─────────┘

One workspace. One project context. Fewer distractions.

🖥️ THE DEVSPA EXPERIENCE

<div align="center">

<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/Wallpaper.png" width="100%" alt="DEVSPA Workspace">

</div>

<br>

DEVSPA is built around a desktop-inspired workspace where tools behave like parts of one system rather than disconnected websites.

The current experience brings together:

Module

Purpose

🧠 AI Assistant

Developer-focused AI interaction

</> Code Editor

Project-aware coding environment

📁 Explorer

Navigate and work with project files

🐛 Debugger

AI-assisted debugging workflow

⚡ Terminal

Run development commands inside the workspace

⚙️ Settings

Configure the workspace

🐙 GitHub

Authentication and GitHub-connected workflows

🤖 AI ASSISTANT

The AI assistant is designed to live inside the developer workflow.

Instead of:

Problem → Leave IDE → Search → Open AI → Copy → Return

DEVSPA aims for:

Problem
   ↓
DEVSPA AI
   ↓
Understand
   ↓
Explain / Suggest / Assist
   ↓
Keep Building

AI direction

The current architecture provides a foundation for progressively adding:

Context-aware answers

Code explanations

Debugging assistance

Refactoring suggestions

Project-aware reasoning

Test generation

Multi-file analysis

Eventually, agentic development workflows

🐛 AI DEBUGGER

Debugging is where DEVSPA gets especially interesting.

A traditional debugger tells you what failed.

The DEVSPA vision is to help explain:

┌───────────────────┐
│    Runtime Error  │
└─────────┬─────────┘
          ↓
┌───────────────────┐
│ Collect Context   │
└─────────┬─────────┘
          ↓
┌───────────────────┐
│ Analyze Code      │
└─────────┬─────────┘
          ↓
┌───────────────────┐
│ Find Root Cause   │
└─────────┬─────────┘
          ↓
┌───────────────────┐
│ Explain the Why   │
└─────────┬─────────┘
          ↓
┌───────────────────┐
│ Suggest a Fix     │
└───────────────────┘

The important distinction:

AI should help the developer understand the bug, not blindly hide it.

⚡ TERMINAL — INSIDE THE WORKSPACE

The terminal is powered by an interactive terminal layer and is designed to stay close to the rest of the development environment.

The backend uses node-pty and WebSocket-based infrastructure to support terminal communication.

DEVSPA UI
   │
   ▼
Terminal Component
   │
   ▼
WebSocket
   │
   ▼
Node.js Backend
   │
   ▼
node-pty
   │
   ▼
System Shell

This makes the terminal another part of the workspace rather than another window.

🐙 GITHUB INTEGRATION

DEVSPA uses GitHub authentication through an OAuth-based flow.

        DEVSPA
           │
           ▼
    /auth/github
           │
           ▼
        GitHub
           │
           │ Authorization
           ▼
 /auth/github/callback
           │
           ▼
     Validate State
           │
           ▼
    Exchange Code
           │
           ▼
    GitHub User API
           │
           ▼
   Server-side Session
           │
           ▼
       DEVSPA HOME

Security principles

OAuth state validation

Server-side sessions

HTTP-only session cookies

Environment-based secrets

Production-aware secure cookies

No GitHub password handling inside DEVSPA

The goal is to make GitHub authentication a foundation for future repository workflows.

🎨 THE VISUAL SYSTEM

DEVSPA is intentionally designed around a dark, futuristic developer aesthetic.

The visual language combines:

BLACK / DEEP SPACE
       +
PURPLE ENERGY
       +
ELECTRIC BLUE
       +
WHITE UI
       +
SOFT GLOW
       =
DEVSPA

The repository already contains a set of visual wallpapers and live assets that are part of the product identity.

🖼️ WALLPAPER GALLERY

<div align="center">

<table>
<tr>
<td align="center">
<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/Wallpaper.png" width="420" alt="DEVSPA Wallpaper 1">
<br><b>DEVSPA CORE</b>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/Wallpaper2.png" width="420" alt="DEVSPA Wallpaper 2">
<br><b>DEVELOPER SPACE</b>
</td>
</tr>

<tr>
<td align="center">
<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/wallpaper3.png" width="420" alt="DEVSPA Wallpaper 3">
<br><b>AI ENERGY</b>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/wallpaper4.png" width="420" alt="DEVSPA Wallpaper 4">
<br><b>CYBER WORKSPACE</b>
</td>
</tr>

<tr>
<td colspan="2" align="center">
<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/wallpaper5.png" width="700" alt="DEVSPA Wallpaper 5">
<br><b>THE DEVSPA VOID</b>
</td>
</tr>
</table>

</div>

🎞️ LIVE VISUALS

The repository also contains live wallpaper assets:

▶️ Live Wallpaper 01

<a href="https://github.com/AR-Coders9-web/Devspa/raw/production-architecture/frontend/public/wallpapers/live/live1.mp4">
  <img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/Wallpaper.png" width="700" alt="Watch DEVSPA Live Wallpaper 01">
</a>

Click the image to open the live MP4.

▶️ Live Wallpaper 02

<a href="https://github.com/AR-Coders9-web/Devspa/raw/production-architecture/frontend/public/wallpapers/live/live2.mp4">
  <img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/Wallpaper5.png" width="700" alt="Watch DEVSPA Live Wallpaper 02">
</a>

GitHub README pages do not consistently provide a native MP4 player for repository files, so the visual cards above link directly to the original repository videos.

🧱 ARCHITECTURE

flowchart LR

    U[👨‍💻 Developer]

    FE[⚛️ React + Vite Frontend]
    API[🟢 Node.js + Express Backend]

    AI[🤖 AI Services]
    GH[🐙 GitHub OAuth / App]
    TERM[⚡ Terminal + WebSocket]
    SESSION[🔐 Express Session]
    FILES[📁 Workspace / Project APIs]

    U --> FE
    FE --> API

    API --> AI
    API --> GH
    API --> TERM
    API --> SESSION
    API --> FILES

🧰 TECHNOLOGY STACK

Frontend

Technology

Role

⚛️ React 19

Component-based UI

⚡ Vite

Frontend development and production build

🎨 Tailwind CSS 4

Styling system

🧩 Monaco Editor React

Code-editor experience

🖥️ xterm.js

Terminal UI

📐 Lucide React

Interface icons

🧭 React Router

Application routing

🗃️ Zustand

Client-side state management

🌐 Axios

HTTP communication

The current frontend package explicitly includes React, Vite, Tailwind, Monaco Editor, xterm, React Router, Zustand, Axios and Lucide React.

Backend

Technology

Role

🟢 Node.js

Server runtime

🚂 Express 5

Backend API/server

🔐 express-session

Session management

🐙 Octokit

GitHub App integration

⚡ node-pty

Terminal process layer

🔌 WebSocket (ws)

Real-time terminal communication

🌐 Axios

External API requests

🛡️ CORS

Cross-origin configuration

📦 dotenv

Environment configuration

🗜️ adm-zip

ZIP/project handling

These technologies are reflected in the repository's current frontend and backend package manifests.

AI

DEVSPA is designed around an AI layer that can connect developer context with model-powered assistance.

The current project configuration supports Gemini-powered AI workflows.

🔄 HOW A REQUEST MOVES THROUGH DEVSPA

                   USER ACTION
                       │
                       ▼
              ┌─────────────────┐
              │ React Interface  │
              └────────┬────────┘
                       │
                    Axios/API
                       │
                       ▼
              ┌─────────────────┐
              │ Express Backend │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
      AI Core       GitHub        Workspace
        │              │              │
        ▼              ▼              ▼
     Gemini        OAuth/App       Project
        │              │           Services
        └──────────────┼──────────────┘
                       │
                       ▼
                 DEVSPA UI

📂 PROJECT STRUCTURE

Devspa/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── aiDebuggerController.js
│   │   │   ├── githubAuthController.js
│   │   │   └── githubImportController.js
│   │   │
│   │   ├── services/
│   │   │   └── workspaceIdentityService.js
│   │   │
│   │   ├── terminal/
│   │   │   └── terminalWebSocket.js
│   │   │
│   │   └── server.js
│   │
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── intro/
│   │   ├── sound/
│   │   ├── wallpapers/
│   │   │   ├── live/
│   │   │   │   ├── live1.mp4
│   │   │   │   └── live2.mp4
│   │   │   ├── Wallpaper.png
│   │   │   ├── Wallpaper2.png
│   │   │   ├── wallpaper3.png
│   │   │   ├── wallpaper4.png
│   │   │   └── wallpaper5.png
│   │   └── logo.png
│   │
│   └── package.json
│
└── package-lock.json

🧠 WHY THE ARCHITECTURE MATTERS

DEVSPA is intentionally split into independent layers.

Frontend

Responsible for:

UI
Routing
Workspace
Editor
Terminal Interface
State
User Interaction

Backend

Responsible for:

API
Authentication
Sessions
GitHub
AI Requests
Terminal
Workspace Services

External Services

GitHub
Gemini
Deployment Platforms

This separation makes it possible to improve one part without rebuilding the entire system.

🔐 SECURITY MODEL

Sensitive values should never be committed to the repository.

Example environment configuration:

NODE_ENV=production

FRONTEND_URL=...
BACKEND_URL=...
CORS_ORIGIN=...

SESSION_SECRET=...

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=...

GEMINI_API_KEY=...

Never commit:

❌ .env
❌ API keys
❌ OAuth secrets
❌ Private keys
❌ Session secrets

🚀 QUICK START

1. Clone

git clone https://github.com/AR-Coders9-web/Devspa.git
cd Devspa

2. Frontend

cd frontend
npm install
npm run dev

3. Backend

Open another terminal:

cd backend
npm install
npm run dev

4. Configure environment variables

Create your environment configuration using the variables expected by the backend.

5. Open DEVSPA

http://localhost:5173

🌍 DEPLOYMENT MODEL

DEVSPA is structured for a separated frontend/backend deployment:

                     INTERNET
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
      ┌─────────────┐       ┌─────────────┐
      │   VERCEL    │       │   RENDER    │
      │  FRONTEND   │ ────► │   BACKEND   │
      └─────────────┘       └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
                 GitHub         Gemini        Terminal

Production authentication depends on correctly configured:

Frontend URL

Backend URL

CORS origin

GitHub callback URL

Session secret

Secure cookies

AI credentials

🏆 BUILT FOR A HACKATHON — BUT NOT BUILT TO STOP HERE

DEVSPA was created as a hackathon project, but the architecture is intentionally designed with a larger product direction in mind.

The hackathon version proves the core idea:

       AI
       +
     Editor
       +
    Debugger
       +
    Terminal
       +
     GitHub
       ↓
   DEVSPA

The next challenge is making every part deeper, smarter and more reliable.

🛣️ ROADMAP — WHERE WE GO NEXT

⚙️ PHASE 01 — STABILITY

████████████████████░░  85%

Core workspace

AI assistant

Code editor

Explorer

Terminal

GitHub authentication

AI debugger foundation

More edge-case testing

Better error recovery

Better workspace persistence

🧠 PHASE 02 — PROJECT-AWARE AI

██████████░░░░░░░░░░░░  40%

The AI should eventually understand:

       PROJECT
          │
   ┌──────┼──────┐
   ▼      ▼      ▼
 Files  Config  Dependencies
   │      │      │
   └──────┼──────┘
          ▼
      AI CONTEXT

Planned:

Project context

Multi-file reasoning

Codebase explanations

Architecture understanding

Dependency awareness

Better debugging context

🐛 PHASE 03 — NEXT-GEN DEBUGGER

ERROR
 ↓
TRACE
 ↓
UNDERSTAND
 ↓
ROOT CAUSE
 ↓
EXPLAIN
 ↓
FIX
 ↓
TEST

Planned:

Error clustering

Relevant-file detection

Root-cause analysis

Fix suggestions

Test generation

Regression verification

🤖 PHASE 04 — AI DEVELOPMENT AGENT

This is where the Developer OS idea becomes much more powerful.

Instead of only asking:

"How do I fix this?"

you could ask:

"Build this feature."

DEVSPA could eventually:

USER REQUEST
     ↓
UNDERSTAND TASK
     ↓
PLAN
     ↓
EDIT FILES
     ↓
RUN TERMINAL
     ↓
RUN TESTS
     ↓
READ ERRORS
     ↓
DEBUG
     ↓
ITERATE
     ↓
SHOW CHANGES
     ↓
USER APPROVES

The developer remains the decision-maker.

🐙 PHASE 05 — GITHUB-NATIVE DEVELOPMENT

Future GitHub workflows:

Repository browser

Branch management

Commit assistant

Pull request creation

AI PR summaries

AI code review

Issue analysis

Issue → implementation workflows

Repository-aware AI

Imagine:

GitHub Issue
     ↓
"Add dark mode"
     ↓
DEVSPA AI
     ↓
Understand repository
     ↓
Plan changes
     ↓
Modify files
     ↓
Run tests
     ↓
Create PR

🌐 THE LONG-TERM VISION

DEVSPA's long-term goal is not to replace every developer tool.

It is to create a connected intelligence layer around development.

                         ┌──────────────────────┐
                         │       DEVSPA         │
                         │  AI DEVELOPER OS     │
                         └──────────┬───────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
   DEVELOPMENT                    AI CORE                    CLOUD
        │                           │                           │
   ┌────┼────┐                 ┌────┼────┐                 ┌────┼────┐
   │    │    │                 │    │    │                 │    │    │
 Editor Terminal Debugger   Chat Agent Context           GitHub CI/CD Deploy
   │    │    │                 │    │    │                 │    │    │
   └────┴────┘                 └────┴────┘                 └────┴────┘

The final idea:

Your project becomes the operating system's context.

Not just:

AI + Editor

but:

AI
+
Code
+
Files
+
Terminal
+
Debugging
+
GitHub
+
Project Context
+
Automation

🎥 SEE IT IN ACTION

<div align="center">

▶️ Full DEVSPA Demo

<a href="https://youtu.be/oOVtkJ5dLAM">
  <img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/wallpapers/Wallpaper5.png" width="850" alt="Watch DEVSPA Demo">
</a>

<br><br>

<b>Click the image to watch the complete demo.</b>

</div>

📊 DEVSPA AT A GLANCE

Area

Current Direction

🖥️ Workspace

Desktop-inspired developer environment

💻 Editor

Monaco-based editor

📁 Files

Integrated project explorer

🤖 AI

Gemini-powered assistance

🐛 Debugger

AI-assisted debugging foundation

⚡ Terminal

xterm + node-pty + WebSocket

🐙 GitHub

OAuth + GitHub App foundation

🔐 Auth

Session-based secure architecture

🎨 UI

Dark futuristic developer interface

🌌 Visuals

Static + live wallpaper system

🚀 Future

AI-native development agent

💜 WHY DEVSPA?

Because developers don't need more tabs.

They need better context.

       LESS SWITCHING
             ↓
       MORE CONTEXT
             ↓
       BETTER FOCUS
             ↓
       FASTER ITERATION
             ↓
       BETTER SOFTWARE

👨‍💻 BUILT SOLO

DEVSPA was built as a solo hackathon project.

That meant working across:

        PRODUCT IDEA
             │
             ▼
        UI / UX DESIGN
             │
             ▼
          REACT
             │
             ▼
        NODE / EXPRESS
             │
       ┌─────┴─────┐
       ▼           ▼
      AI         GITHUB
       │           │
       └─────┬─────┘
             ▼
         TERMINAL
             │
             ▼
        DEPLOYMENT
             │
             ▼
          DEBUGGING
             │
             ▼
       WORKING PRODUCT

The biggest lesson was not a single technology.

It was learning how all of these pieces have to work together.

🧪 ENGINEERING LESSONS

01 — Authentication is a system

A login button is easy.

A production OAuth flow is not.

02 — AI needs context

A chatbot is useful.

A project-aware developer assistant can be much more useful.

03 — Deployment changes everything

Local development hides problems involving:

CORS
Cookies
HTTPS
Sessions
OAuth
Environment Variables

04 — Debugging is part of building

The product itself had to be tested, deployed, broken, diagnosed and improved.

That process became part of the project.

🔗 LINKS

<div align="center">





🌐 Live Application

https://devspa.vercel.app

🎬 Demo Video

https://youtu.be/oOVtkJ5dLAM

💻 GitHub Repository

https://github.com/AR-Coders9-web/Devspa

🖼️ Visual Assets

frontend/public/wallpapers/

</div>

⭐ SUPPORT THE PROJECT

If the idea of an AI-native Developer OS interests you:

⭐ Star the repository

🍴 Explore the code

🐛 Open an issue

💡 Share an idea

🚀 Help shape the future of DEVSPA

<div align="center">

<img src="https://raw.githubusercontent.com/AR-Coders9-web/Devspa/production-architecture/frontend/public/logo.png" width="90" alt="DEVSPA">

DEVSPA

Build inside the flow.

Code • AI • Debug • Terminal • GitHub

<br>

Made with curiosity, caffeine & a lot of debugging.

</div>
