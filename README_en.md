# xbrowserai - Browser AI Assistant

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D16-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](package.json)

A powerful browser AI assistant that can control browsers, manage files, execute terminal commands, create scheduled tasks, and supports DeepSeek and OpenAI.

## ✨ Features

### 🌐 Browser Control
- Navigate, refresh, forward, backward through web pages
- Click elements (supports CSS selectors and text content)
- Input text, fill forms
- Page screenshots, get page information
- Element waiting, scrolling operations
- Multi-tab management
- JavaScript injection execution
- Cookie management (import/export)
- Automatic dialog handling

### 📁 File Management
- Create, read, write, append files
- Delete files, create directories
- List directory contents

### 💻 Terminal Operations
- Execute command line commands
- Automatic Chinese encoding handling
- Supports Windows and Linux/Mac

### ⏰ Scheduled Tasks
- Create one-time tasks
- Create periodic scheduled tasks (supports natural language)
- AI sub-agent scheduled tasks
- Task pause/resume/delete
- Task persistent storage
- Execution log recording

### 🎯 Skill System
- AI automatically creates custom skills
- Skill enable/disable management
- Skill persistent storage
- Trigger word matching execution

### 💬 Conversation History
- Automatic conversation history saving
- View history records
- Delete single history entry
- Clear all history
- Session persistence

### 🤖 AI Capabilities
- Supports DeepSeek and OpenAI
- Multi-turn conversation thinking
- Intelligent tool calling
- Context compression

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/xxccdl/xbrowserai.git
cd xbrowserai

# Install dependencies
npm install
```

### Configuration

1. Copy the environment variable example file:
```bash
cp .env.example .env
```

2. Edit the `.env` file to configure your API keys:
```env
# DeepSeek Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Or OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# Select Model
MODEL=deepseek-chat
```

### Running

```bash
# Development mode
npm run dev

# Or directly start
npm start

# Or use command line tool
xbc
```

## 📖 Usage Guide

### Quick Commands

| Command | Description |
|---------|-------------|
| `quit` / `exit` | Exit the program |
| `clear` | Clear conversation history |
| `help` | Show help information |
| `history` | View conversation history |
| `history delete <n>` | Delete nth history entry |
| `status` | View system status |
| `tasks` | View scheduled task list |
| `skills` | View available skills |

### Browser Operation Examples

```
Open Baidu homepage
Click the "News" button
Enter "latest technology" in the search box
Press Enter to search
Take screenshot of current page
```

### Create Scheduled Tasks

```
Create a scheduled task to check Baidu news every 5 minutes
Create AI task to automatically browse technology news at 8 AM every day
```

### Skill Management

```
Create a "check weather" skill
List all available skills
Delete a skill
```

## 🏗️ Project Structure

```
xbrowserai/
├── src/
│   ├── ai/              # AI Agent and LLM Provider
│   ├── controllers/     # Browser Control Modules
│   ├── skills/          # Skill Management System
│   ├── tools/           # Tool Collection
│   ├── utils/           # Utility Functions
│   └── index.js         # Main Entry File
├── bin/                 # Command Line Tools
├── skills/              # Skill Storage Directory
├── data/                # Data Persistence Directory
├── logs/                # Log Directory
├── scripts/             # Build Scripts
├── package.json
└── README.md
```

## 🔧 Development

### Build Project

```bash
npm run build
```

### Package for Release

```bash
npm run package
```

## 📝 Changelog

### v1.0.0
- ✨ Initial release
- 🌐 Complete browser control features
- 📁 File management system
- 💻 Terminal operation support
- ⏰ Scheduled task scheduling
- 🎯 Skill system
- 💬 Conversation history persistence
- 🤖 AI sub-agent support
- 🌍 Chinese and English interface

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

ISC License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Puppeteer](https://pptr.dev/) - Browser automation
- [OpenAI](https://openai.com/) - AI API
- [DeepSeek](https://deepseek.com/) - AI API
- All open source contributors

---

**Made with ❤️ by xxccdl**
