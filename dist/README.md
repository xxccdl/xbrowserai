# xbrowserai - 浏览器AI助手

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node.js-%3E%3D16-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](package.json)

一个强大的浏览器AI助手，可以控制浏览器、管理文件、执行终端命令、创建定时任务，支持DeepSeek和OpenAI。

## ✨ 功能特性

### 🌐 浏览器控制
- 打开/刷新/前进/后退网页
- 点击元素（支持CSS选择器和文本内容）
- 输入文本、填写表单
- 页面截图、获取页面信息
- 元素等待、滚动操作
- 多标签页管理
- JavaScript注入执行
- Cookie管理（导入/导出）
- 弹窗自动处理

### 📁 文件管理
- 创建、读取、写入、追加文件
- 删除文件、创建目录
- 列出目录内容

### 💻 终端操作
- 执行命令行命令
- 自动处理中文编码问题
- 支持Windows和Linux/Mac

### ⏰ 定时任务
- 创建一次性任务
- 创建周期性定时任务（支持自然语言）
- AI子代理定时任务
- 任务暂停/恢复/删除
- 任务持久化存储
- 执行日志记录

### 🎯 技能系统
- AI自动创建自定义技能
- 技能启用/禁用管理
- 技能持久化存储
- 触发词匹配执行

### 💬 对话历史
- 对话历史自动保存
- 查看历史记录
- 删除单条历史
- 清空所有历史
- 会话持久化

### 🤖 AI能力
- 支持DeepSeek和OpenAI
- 多轮对话思考
- 智能工具调用
- 上下文压缩

## 🚀 快速开始

### 前置要求
- Node.js 16 或更高版本
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone https://github.com/xxccdl/xbrowserai.git
cd xbrowserai

# 安装依赖（跳过Chrome下载）
$env:PUPPETEER_SKIP_DOWNLOAD="true"
npm install

# 或使用国内镜像（Windows PowerShell）
$env:PUPPETEER_DOWNLOAD_BASE_URL="https://cdn.npmmirror.com/binaries/chrome-for-testing"
npm install
```

**注意**：首次运行时，程序会自动下载Chrome浏览器。如果下载失败，可以：
1. 设置环境变量跳过下载，使用系统已安装的Chrome
2. 或使用国内镜像加速下载

### 配置

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置你的API密钥：
```env
# DeepSeek 配置
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 或 OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# 选择模型
MODEL=deepseek-chat
```

### 运行

```bash
# 开发模式
npm run dev

# 或直接启动
npm start

# 或使用命令行工具
xbc
```

## 📖 使用指南

### 快捷命令

| 命令 | 描述 |
|------|------|
| `quit` / `exit` | 退出程序 |
| `clear` | 清空对话历史 |
| `help` | 显示帮助信息 |
| `history` | 查看对话历史 |
| `history delete <n>` | 删除第n条历史记录 |
| `status` | 查看系统状态 |
| `tasks` | 查看定时任务列表 |
| `skills` | 查看可用技能 |

### 浏览器操作示例

```
打开百度首页
点击"新闻"按钮
在搜索框输入"最新科技"
按回车搜索
截取当前页面
```

### 创建定时任务

```
创建一个定时任务，每5分钟检查一次百度新闻
创建AI任务，每天早上8点自动浏览科技新闻
```

### 技能管理

```
创建一个"查询天气"的技能
列出所有可用技能
删除某个技能
```

## 🏗️ 项目结构

```
xbrowserai/
├── src/
│   ├── ai/              # AI代理和LLM提供商
│   ├── controllers/     # 浏览器控制模块
│   ├── skills/          # 技能管理系统
│   ├── tools/           # 工具集合
│   ├── utils/           # 工具函数
│   └── index.js         # 主入口文件
├── bin/                 # 命令行工具
├── skills/              # 技能存储目录
├── data/                # 数据持久化目录
├── logs/                # 日志目录
├── scripts/             # 构建脚本
├── package.json
└── README.md
```

## 🔧 开发

### 构建项目

```bash
npm run build
```

### 打包发布

```bash
npm run package
```

## 📝 更新日志

### v1.0.0
- ✨ 初始版本发布
- 🌐 完整的浏览器控制功能
- 📁 文件管理系统
- 💻 终端操作支持
- ⏰ 定时任务调度
- 🎯 技能系统
- 💬 对话历史持久化
- 🤖 AI子代理支持
- 🌍 中英文界面

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Puppeteer](https://pptr.dev/) - 浏览器自动化
- [OpenAI](https://openai.com/) - AI API
- [DeepSeek](https://deepseek.com/) - AI API
- 所有开源贡献者

---

**Made with ❤️ by xxccdl**
