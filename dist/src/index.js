import 'dotenv/config';
import chalk from 'chalk';
import readline from 'readline';
import figlet from 'figlet';
import boxen from 'boxen';
import BrowserController from './controllers/BrowserController.js';
import ElementController from './controllers/ElementController.js';
import DataExtractor from './controllers/DataExtractor.js';
import CookieManager from './controllers/CookieManager.js';
import DialogHandler from './controllers/DialogHandler.js';
import FileManager from './tools/FileManager.js';
import TerminalExecutor from './tools/TerminalExecutor.js';
import TaskScheduler from './tools/TaskScheduler.js';
import AITaskExecutor from './tools/AITaskExecutor.js';
import DataExporter from './utils/DataExporter.js';
import Logger from './utils/Logger.js';
import Utils from './utils/Utils.js';
import Spinner from './utils/Spinner.js';
import Agent from './ai/Agent.js';
import SessionManager from './utils/SessionManager.js';

let browserController = null;
let elementController = null;
let dataExtractor = null;
let cookieManager = null;
let dialogHandler = null;
let fileManager = null;
let terminalExecutor = null;
let taskScheduler = null;
let dataExporter = null;
let logger = null;
let agent = null;
let sessionManager = null;
let rl = null;
let startTime = Date.now();

const c = {
  cyan: chalk.cyan,
  green: chalk.green,
  yellow: chalk.yellow,
  magenta: chalk.magenta,
  red: chalk.red,
  gray: chalk.gray,
  bold: chalk.bold,
  bgBlue: chalk.bgBlue,
  bgGreen: chalk.bgGreen,
  bgYellow: chalk.bgYellow,
  white: chalk.white,
  rgb: chalk.rgb,
  hex: chalk.hex
};

const gradient = {
  start: c.hex('#00d4ff'),
  mid: c.hex('#00ff88'),
  end: c.hex('#ffaa00')
};

function printBanner() {
  console.log();
  const bannerText = figlet.textSync('xbrowserai', { font: 'ANSI Shadow' });
  const lines = bannerText.split('\n');
  lines.forEach((line, i) => {
    if (line.trim()) {
      const hue = (i / lines.length) * 120;
      console.log(c.rgb(0, 200 + Math.sin(i * 0.5) * 55, 255)(line));
    }
  });
  console.log(c.cyan('  🚀 浏览器超级AI助手 - 支持 DeepSeek / OpenAI'));
  console.log(c.gray('  💡 多轮思考 • 🔧 智能工具调用 • 🌐 浏览器完全控制\n'));
}

function printCommands() {
  const commands = [
    { cmd: 'quit/exit', desc: '退出程序', icon: '🚪' },
    { cmd: 'clear', desc: '清空对话历史', icon: '🧹' },
    { cmd: 'help', desc: '显示帮助信息', icon: '❓' },
    { cmd: 'history', desc: '查看对话历史', icon: '📜' },
    { cmd: 'history delete <n>', desc: '删除第n条历史记录', icon: '🗑️' },
    { cmd: 'status', desc: '查看系统状态', icon: '📊' },
    { cmd: 'tasks', desc: '查看定时任务列表', icon: '⏰' },
    { cmd: 'skills', desc: '查看可用技能', icon: '🎯' }
  ];
  
  let cmdText = c.yellow.bold('📋 快捷命令') + '\n\n';
  commands.forEach(({ cmd, desc, icon }) => {
    cmdText += `  ${icon} ${c.green.bold(cmd.padEnd(12))} ${c.gray(desc)}\n`;
  });
  
  console.log(boxen(cmdText, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: '快捷操作',
    titleAlignment: 'center'
  }));
}

function showHelp() {
  const helpText = `
${c.cyan.bold('📖 功能帮助')}

${c.yellow('🎯 浏览器控制')}
  打开网页、点击元素、输入文本、切换标签页、截图等

${c.yellow('📁 文件管理')}
  创建、读取、写入、追加、删除文件，创建目录等

${c.yellow('💻 终端操作')}
  执行命令行命令，支持中文输出

${c.yellow('⏰ 定时任务')}
  创建一次性任务和周期性定时任务（支持AI子代理）

${c.yellow('🔧 技能系统')}
  AI可以自动创建和管理自定义技能

${c.yellow('📊 数据导出')}
  支持导出为 JSON、CSV、HTML、Markdown 格式

${c.green('💡 提示:')} ${c.gray('直接用自然语言描述你的需求，AI会自动选择合适的工具完成任务')}
`;
  
  console.log(boxen(helpText, {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'green',
    title: '使用指南',
    titleAlignment: 'center'
  }));
}

function showStatus() {
  const uptime = Date.now() - startTime;
  const hours = Math.floor(uptime / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  const seconds = Math.floor((uptime % 60000) / 1000);
  
  const tasks = taskScheduler ? taskScheduler.listTasks() : { total: 0, tasks: [], schedules: [] };
  const browserStatus = browserController && browserController.browser ? c.green('已连接 ✓') : c.red('未连接 ✗');
  
  let uptimeText = '';
  if (hours > 0) uptimeText += `${hours}时`;
  if (minutes > 0) uptimeText += `${minutes}分`;
  uptimeText += `${seconds}秒`;
  
  const statusText = `
${c.cyan.bold('📊 系统状态')}

  ${c.yellow('🌐 浏览器')}    ${browserStatus}
  ${c.yellow('⏱ 运行时间')}  ${c.gray(uptimeText)}
  ${c.yellow('📋 任务数')}    ${c.gray(tasks.total)} ${c.gray(`(一次性:${tasks.tasks.length} 定时:${tasks.schedules.length})`)}
  ${c.yellow('💬 对话数')}    ${c.gray(agent ? agent.conversationHistory.length : 0)}
`;
  
  console.log(boxen(statusText, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'yellow',
    title: '系统信息',
    titleAlignment: 'center'
  }));
}

function showTasks() {
  if (!taskScheduler) {
    console.log(c.red('✗ 任务调度器未初始化'));
    return;
  }
  
  const result = taskScheduler.listTasks();
  
  let taskText = c.cyan.bold('⏰ 定时任务列表') + '\n\n';
  
  if (result.schedules.length > 0) {
    taskText += c.yellow('📅 定时任务:\n');
    result.schedules.forEach((task, i) => {
      const statusIcon = task.status === 'active' ? '🟢' : task.status === 'paused' ? '🟡' : '🔴';
      const statusColor = task.status === 'active' ? c.green : task.status === 'paused' ? c.yellow : c.red;
      const nextRun = task.nextRun ? new Date(task.nextRun).toLocaleString('zh-CN') : 'N/A';
      const taskTypeIcon = task.taskType === 'ai' ? '🤖' : '💻';
      const taskTypeText = task.taskType === 'ai' ? ' [AI任务]' : '';
      taskText += `  ${statusIcon} ${i + 1}. ${statusColor(task.status)} ${c.bold(task.name)}${taskTypeText} ${taskTypeIcon}\n`;
      taskText += `     ${c.gray('计划:')} ${task.schedule.minute} ${task.schedule.hour} ${task.schedule.day}\n`;
      taskText += `     ${c.gray('下次:')} ${nextRun} | ${c.gray('次数:')} ${task.runCount}\n`;
      if (task.taskType === 'ai' && task.prompt) {
        const promptPreview = task.prompt.length > 40 ? task.prompt.substring(0, 40) + '...' : task.prompt;
        taskText += `     ${c.gray('提示:')} ${promptPreview}\n`;
      }
      taskText += '\n';
    });
  }
  
  if (result.tasks.length > 0) {
    taskText += c.yellow('📋 一次性任务:\n');
    result.tasks.forEach((task, i) => {
      taskText += `  ⚪ ${i + 1}. ${c.bold(task.name)} [${task.id}] - ${c.gray(task.status)}\n`;
    });
    taskText += '\n';
  }
  
  if (result.total === 0) {
    taskText += c.gray('  📭 暂无任务\n');
  }
  
  console.log(boxen(taskText, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'magenta',
    title: '任务管理',
    titleAlignment: 'center'
  }));
}

function showSkills() {
  if (!agent || !agent.skillManager) {
    console.log(c.red('✗ 技能管理器未初始化'));
    return;
  }
  
  const result = agent.skillManager.listSkills();
  
  let skillText = c.cyan.bold('🎯 可用技能列表') + '\n\n';
  
  if (result.skills && result.skills.length > 0) {
    result.skills.forEach((skill, i) => {
      const statusIcon = skill.enabled ? '✅' : '⭕';
      const statusColor = skill.enabled ? c.green : c.gray;
      skillText += `  ${statusIcon} ${i + 1}. ${statusColor(c.bold(skill.name))}\n`;
      skillText += `     ${c.gray(skill.description)}\n`;
      if (skill.triggers && skill.triggers.length > 0) {
        skillText += `     ${c.yellow('触发:')} ${skill.triggers.join(', ')}\n`;
      }
      skillText += '\n';
    });
  } else {
    skillText += c.gray('  📭 暂无技能\n');
  }
  
  console.log(boxen(skillText, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: '技能库',
    titleAlignment: 'center'
  }));
}

async function init() {
  printBanner();
  
  const spinner = new Spinner('正在初始化系统...');
  spinner.start();
  
  logger = new Logger();
  sessionManager = new SessionManager();
  await sessionManager.init();
  
  spinner.setText('初始化控制器...');
  browserController = new BrowserController();
  elementController = new ElementController(browserController);
  dataExtractor = new DataExtractor(browserController, elementController);
  cookieManager = new CookieManager(browserController);
  dialogHandler = new DialogHandler(browserController);
  fileManager = new FileManager();
  terminalExecutor = new TerminalExecutor();
  
  const aiTaskExecutor = new AITaskExecutor(
    browserController,
    elementController,
    dataExtractor,
    cookieManager,
    dialogHandler,
    fileManager,
    terminalExecutor
  );
  
  taskScheduler = new TaskScheduler(aiTaskExecutor);
  await taskScheduler.init();
  dataExporter = new DataExporter();

  spinner.setText('初始化AI代理...');
  agent = new Agent(
    browserController,
    elementController,
    fileManager,
    terminalExecutor,
    Utils,
    dataExtractor,
    cookieManager,
    dialogHandler,
    taskScheduler
  );

  spinner.setText('加载会话历史...');
  const historyResult = await sessionManager.loadConversationHistory();
  if (historyResult.success) {
    agent.conversationHistory = historyResult.history;
    spinner.setText(`已加载 ${historyResult.history.length} 条对话记录`);
  }

  spinner.setText('启动浏览器...');
  await browserController.launch(false);
  
  await dialogHandler.enableAutoHandle('accept');

  spinner.succeed('系统初始化完成！');
  
  const welcomeMsg = `${c.green.bold('🎉 欢迎使用 xbrowserai!')}\n\n${c.gray('输入 ') + c.yellow.bold('help') + c.gray(' 查看帮助，或直接描述你的需求')}`;
  
  console.log(boxen(welcomeMsg, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
    title: '欢迎',
    titleAlignment: 'center'
  }));
  
  printCommands();
  setupInputHandler();
}

let isProcessing = false;

function setupInputHandler() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: c.magenta.bold('👤 你: ')
  });

  process.stdout.on('resize', () => {
  });

  rl.prompt();

  rl.on('line', async (line) => {
    if (isProcessing) return;
    
    const userInput = line.trim();
    
    if (!userInput) {
      rl.prompt();
      return;
    }

    isProcessing = true;

    const lowerInput = userInput.toLowerCase();

    if (lowerInput === 'quit' || lowerInput === 'exit') {
      console.log(c.gray('\n🚪 正在退出...'));
      if (agent && sessionManager) {
        await sessionManager.saveConversationHistory(agent.conversationHistory);
      }
      if (browserController) await browserController.close();
      console.log(c.green.bold('再见！👋\n'));
      process.exit(0);
    }

    if (lowerInput === 'clear') {
      if (agent) agent.clearHistory();
      await sessionManager.clearSession();
      console.log(c.green.bold('✓ 对话历史已清空\n'));
      isProcessing = false;
      rl.prompt();
      return;
    }

    if (lowerInput === 'help') {
      showHelp();
      isProcessing = false;
      rl.prompt();
      return;
    }

    if (lowerInput === 'history' && agent) {
      console.log(c.cyan.bold('\n📜 对话历史:'));
      if (agent.conversationHistory.length === 0) {
        console.log(c.gray('  📭 暂无历史记录\n'));
      } else {
        agent.conversationHistory.forEach((msg, i) => {
          const role = msg.role === 'user' ? '你' : msg.role === 'assistant' ? 'AI' : '工具';
          const roleIcon = msg.role === 'user' ? '👤' : msg.role === 'assistant' ? '🤖' : '🔧';
          const roleColor = msg.role === 'user' ? c.magenta : msg.role === 'assistant' ? c.cyan : c.gray;
          const preview = (msg.content || '').substring(0, 50).replace(/\n/g, ' ');
          console.log(`  ${roleIcon} ${i + 1}. ${roleColor.bold(role)}: ${c.gray(preview)}...`);
        });
        console.log(c.gray('  使用 "history delete <编号>" 删除单条记录\n'));
      }
      isProcessing = false;
      rl.prompt();
      return;
    }

    if (lowerInput.startsWith('history delete') && agent) {
      const parts = userInput.split(' ');
      if (parts.length >= 3) {
        const num = parseInt(parts[2]);
        if (!isNaN(num) && num >= 1 && num <= agent.conversationHistory.length) {
          const index = num - 1;
          const result = agent.deleteHistory(index);
          if (result.success) {
            await sessionManager.saveConversationHistory(agent.conversationHistory);
            console.log(c.green.bold(`✓ 已删除第 ${num} 条历史记录\n`));
          } else {
            console.log(c.red.bold(`✗ 删除失败: ${result.error}\n`));
          }
        } else {
          console.log(c.yellow.bold('⚠ 请输入有效的记录编号\n'));
        }
      } else {
        console.log(c.yellow.bold('⚠ 使用方法: history delete <编号>\n'));
      }
      isProcessing = false;
      rl.prompt();
      return;
    }

    if (lowerInput === 'status') {
      showStatus();
      isProcessing = false;
      rl.prompt();
      return;
    }

    if (lowerInput === 'tasks') {
      showTasks();
      isProcessing = false;
      rl.prompt();
      return;
    }

    if (lowerInput === 'skills') {
      showSkills();
      isProcessing = false;
      rl.prompt();
      return;
    }

    const thinkingSpinner = new Spinner('🤖 AI思考中');
    thinkingSpinner.start();
    
    try {
      await logger.info('用户输入', { input: userInput });
      
      let toolCallCount = 0;
      const response = await agent.processWithTools(
        userInput,
        (toolCall) => {
          toolCallCount++;
          thinkingSpinner.stop();
          console.log(c.gray(`\n  🔧 调用工具: ${c.yellow.bold(toolCall.name)} (${toolCallCount})`));
        },
        (toolName, result) => {
          let isSuccess = true;
          if (result && typeof result === 'object') {
            if (result.error !== undefined || result.success === false) {
              isSuccess = false;
            }
          }
          const statusIcon = isSuccess ? '✅' : '❌';
          const color = isSuccess ? c.green : c.red;
          console.log(color(`     ${statusIcon} ${toolName}`));
          thinkingSpinner.start();
        }
      );

      thinkingSpinner.stop();
      
      if (response && typeof response === 'string' && response.length > 0) {
        console.log(boxen(response, {
          padding: 1,
          margin: { top: 1, bottom: 1, left: 0, right: 0 },
          borderStyle: 'round',
          borderColor: 'cyan',
          title: '🤖 AI回复',
          titleAlignment: 'center'
        }));
      } else {
        console.log(boxen(c.gray('(无回复内容)'), {
          padding: 1,
          margin: { top: 1, bottom: 1, left: 0, right: 0 },
          borderStyle: 'round',
          borderColor: 'cyan',
          title: '🤖 AI回复',
          titleAlignment: 'center'
        }));
      }
      
      await logger.info('AI响应', { response: response ? response.substring(0, 500) : '' });
      
      await sessionManager.saveConversationHistory(agent.conversationHistory);
    } catch (error) {
      thinkingSpinner.fail('AI处理失败');
      console.log(c.red.bold('\n❌ 错误:'), error.message);
      console.log();
    }

    isProcessing = false;
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(c.gray('\n🚪 退出'));
    process.exit(0);
  });
}

async function main() {
  try {
    await init();
  } catch (error) {
    console.log(c.red.bold('❌ 错误:'), error.message);
    if (browserController) await browserController.close();
    process.exit(1);
  }
}

main();
