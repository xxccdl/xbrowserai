#!/usr/bin/env node

import { program } from 'commander';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

program
  .name('xbc')
  .description('xbrowserai - 浏览器超级AI助手')
  .version('1.0.0');

program
  .command('start')
  .description('启动交互式AI助手')
  .option('-d, --debug', '启用调试模式')
  .action(async (options) => {
    console.log('🚀 启动 xbrowserai 交互式AI助手...\n');
    
    const indexPath = path.join(projectRoot, 'src', 'index.js');
    const nodeOptions = options.debug ? ['--inspect'] : [];
    
    const child = spawn('node', [...nodeOptions, indexPath], {
      stdio: 'inherit',
      cwd: projectRoot
    });

    child.on('error', (err) => {
      console.error('❌ 启动失败:', err);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  });

program
  .command('init')
  .description('初始化配置文件')
  .action(() => {
    const envExamplePath = path.join(projectRoot, '.env.example');
    const envPath = path.join(projectRoot, '.env');

    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ 已创建 .env 配置文件');
        console.log('📝 请编辑 .env 文件配置您的API密钥');
      } else {
        // 创建默认的 .env 文件
        const defaultEnv = `# xbrowserai 配置文件
# AI 提供商 (deepseek 或 openai)
AI_PROVIDER=deepseek

# DeepSeek API 配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# OpenAI API 配置 (可选)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
`;
        fs.writeFileSync(envPath, defaultEnv);
        console.log('✅ 已创建默认 .env 配置文件');
        console.log('📝 请编辑 .env 文件配置您的API密钥');
      }
    } else {
      console.log('ℹ️  .env 文件已存在');
    }
  });

program
  .command('setup')
  .description('交互式配置向导')
  .action(async () => {
    const readline = await import('readline');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, (answer) => resolve(answer.trim()));
    });

    console.log('');
    console.log('🚀 xbrowserai 配置向导');
    console.log('═══════════════════════════════════════');
    console.log('');

    try {
      // 选择模型供应商
      console.log('📋 请选择 AI 模型供应商:');
      console.log('  1. DeepSeek (推荐)');
      console.log('  2. OpenAI');
      console.log('');
      
      let providerChoice = await question('请选择 (1/2) [默认: 1]: ');
      if (!providerChoice) providerChoice = '1';
      
      const provider = providerChoice === '2' ? 'openai' : 'deepseek';
      
      console.log('');
      console.log(`✅ 已选择: ${provider === 'deepseek' ? 'DeepSeek' : 'OpenAI'}`);
      console.log('');

      // 输入 API Key
      console.log('🔑 请输入 API Key:');
      const apiKey = await question('> ');
      
      if (!apiKey) {
        console.log('');
        console.log('❌ API Key 不能为空，配置已取消');
        rl.close();
        return;
      }

      // 验证 API Key 格式
      if (!apiKey.startsWith('sk-')) {
        console.log('');
        console.log('⚠️  警告: API Key 格式可能不正确');
        console.log('   通常 API Key 以 "sk-" 开头');
        const confirm = await question('是否继续? (y/n) [y]: ');
        if (confirm.toLowerCase() === 'n') {
          console.log('');
          console.log('❌ 配置已取消');
          rl.close();
          return;
        }
      }

      console.log('');

      // 选择模型（可选）
      let model = '';
      if (provider === 'deepseek') {
        console.log('🤖 请选择模型:');
        console.log('  1. deepseek-chat (默认)');
        console.log('  2. deepseek-coder');
        console.log('');
        const modelChoice = await question('请选择 (1/2) [默认: 1]: ');
        model = modelChoice === '2' ? 'deepseek-coder' : 'deepseek-chat';
      } else {
        console.log('🤖 请选择模型:');
        console.log('  1. gpt-4 (默认)');
        console.log('  2. gpt-4-turbo');
        console.log('  3. gpt-3.5-turbo');
        console.log('');
        const modelChoice = await question('请选择 (1/2/3) [默认: 1]: ');
        if (modelChoice === '2') model = 'gpt-4-turbo';
        else if (modelChoice === '3') model = 'gpt-3.5-turbo';
        else model = 'gpt-4';
      }

      console.log('');
      console.log(`✅ 已选择模型: ${model}`);
      console.log('');

      // 生成配置文件
      const envPath = path.join(projectRoot, '.env');
      
      let envContent = `# xbrowserai 配置文件
# 生成时间: ${new Date().toISOString()}

# AI 提供商
AI_PROVIDER=${provider}
`;

      if (provider === 'deepseek') {
        envContent += `
# DeepSeek API 配置
DEEPSEEK_API_KEY=${apiKey}
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=${model}

# OpenAI API 配置 (可选，留空)
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
`;
      } else {
        envContent += `
# DeepSeek API 配置 (可选，留空)
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# OpenAI API 配置
OPENAI_API_KEY=${apiKey}
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=${model}
`;
      }

      fs.writeFileSync(envPath, envContent);

      console.log('═══════════════════════════════════════');
      console.log('');
      console.log('✅ 配置完成！');
      console.log('');
      console.log('📄 配置文件位置:');
      console.log(`   ${envPath}`);
      console.log('');
      console.log('🚀 现在可以运行:');
      console.log('   xbc start');
      console.log('');

    } catch (error) {
      console.error('❌ 配置失败:', error.message);
    } finally {
      rl.close();
    }
  });

program
  .command('config')
  .description('查看或修改配置')
  .option('-s, --show', '显示当前配置')
  .option('-k, --key <key>', '配置项名称')
  .option('-v, --value <value>', '配置项值')
  .action((options) => {
    const envPath = path.join(projectRoot, '.env');
    
    if (options.show || (!options.key && !options.value)) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        console.log('📋 当前配置:');
        console.log(content);
      } else {
        console.log('⚠️  未找到 .env 文件，请先运行: xbc init');
      }
      return;
    }
    
    if (options.key && options.value) {
      let content = '';
      if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        let found = false;
        const newLines = lines.map(line => {
          if (line.startsWith(`${options.key}=`)) {
            found = true;
            return `${options.key}=${options.value}`;
          }
          return line;
        });
        if (!found) {
          newLines.push(`${options.key}=${options.value}`);
        }
        content = newLines.join('\n');
      } else {
        content = `${options.key}=${options.value}`;
      }
      fs.writeFileSync(envPath, content);
      console.log(`✅ 已设置 ${options.key}=${options.value}`);
    }
  });

program
  .command('status')
  .description('检查系统状态')
  .action(async () => {
    console.log('🔍 检查系统状态...\n');
    
    // 检查 Node.js 版本
    const nodeVersion = process.version;
    console.log(`Node.js: ${nodeVersion}`);
    
    // 检查 .env 文件
    const envPath = path.join(projectRoot, '.env');
    if (fs.existsSync(envPath)) {
      console.log('✅ .env 配置文件: 存在');
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const hasDeepSeekKey = envContent.includes('DEEPSEEK_API_KEY=') && 
                            !envContent.includes('DEEPSEEK_API_KEY=your_') &&
                            !envContent.includes('DEEPSEEK_API_KEY=sk-');
      if (hasDeepSeekKey) {
        console.log('✅ DeepSeek API Key: 已配置');
      } else {
        console.log('⚠️  DeepSeek API Key: 未配置');
      }
    } else {
      console.log('❌ .env 配置文件: 不存在');
    }
    
    // 检查依赖
    const nodeModulesPath = path.join(projectRoot, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      console.log('✅ 依赖包: 已安装');
    } else {
      console.log('❌ 依赖包: 未安装，请运行 npm install');
    }
  });

program
  .command('update')
  .description('检查更新')
  .action(async () => {
    console.log('🔄 检查更新...');
    try {
      const { stdout } = await execAsync('npm view xbrowserai version', { cwd: projectRoot });
      const latestVersion = stdout.trim();
      const currentVersion = '1.0.0';
      
      if (latestVersion !== currentVersion) {
        console.log(`📦 有新版本可用: ${latestVersion} (当前: ${currentVersion})`);
        console.log('运行 npm install xbrowserai@latest 更新');
      } else {
        console.log('✅ 已是最新版本');
      }
    } catch (error) {
      console.log('⚠️  无法检查更新');
    }
  });

program
  .command('logs')
  .description('查看日志')
  .option('-f, --follow', '实时跟踪日志')
  .option('-n, --lines <number>', '显示最后N行', '50')
  .action(async (options) => {
    const logsDir = path.join(projectRoot, 'logs');
    
    if (!fs.existsSync(logsDir)) {
      console.log('📭 暂无日志文件');
      return;
    }
    
    const logFiles = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
    
    if (logFiles.length === 0) {
      console.log('📭 暂无日志文件');
      return;
    }
    
    // 显示最新的日志文件
    const latestLog = logFiles.sort().pop();
    const logPath = path.join(logsDir, latestLog);
    
    console.log(`📄 显示日志: ${latestLog}\n`);
    
    if (options.follow) {
      const tail = spawn('tail', ['-f', '-n', options.lines, logPath], {
        stdio: 'inherit'
      });
    } else {
      try {
        const { stdout } = await execAsync(`tail -n ${options.lines} "${logPath}"`);
        console.log(stdout);
      } catch {
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.split('\n').slice(-options.lines);
        console.log(lines.join('\n'));
      }
    }
  });

program
  .command('clean')
  .description('清理临时文件和日志')
  .option('-l, --logs', '清理日志文件')
  .option('-a, --all', '清理所有临时文件')
  .action(async (options) => {
    console.log('🧹 清理中...');
    
    if (options.logs || options.all) {
      const logsDir = path.join(projectRoot, 'logs');
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        for (const file of files) {
          fs.unlinkSync(path.join(logsDir, file));
        }
        console.log('✅ 日志文件已清理');
      }
    }
    
    if (options.all) {
      // 清理其他临时文件
      const tempDirs = ['temp', '.tmp', 'cache'];
      for (const dir of tempDirs) {
        const tempPath = path.join(projectRoot, dir);
        if (fs.existsSync(tempPath)) {
          fs.rmSync(tempPath, { recursive: true, force: true });
        }
      }
      console.log('✅ 临时文件已清理');
    }
    
    console.log('🎉 清理完成');
  });

program
  .command('help')
  .description('显示帮助信息')
  .action(() => {
    console.log('');
    console.log('🚀 xbrowserai - 浏览器超级AI助手');
    console.log('');
    console.log('📚 常用命令:');
    console.log('  xbc setup          交互式配置向导（推荐）');
    console.log('  xbc start          启动AI助手');
    console.log('  xbc init           初始化配置文件');
    console.log('  xbc config         查看/修改配置');
    console.log('  xbc status         检查系统状态');
    console.log('  xbc logs           查看日志');
    console.log('  xbc clean          清理临时文件');
    console.log('');
    console.log('💡 使用示例:');
    console.log('  xbc setup          首次配置');
    console.log('  xbc start --debug  以调试模式启动');
    console.log('  xbc config -s      显示当前配置');
    console.log('  xbc logs -f        实时查看日志');
    console.log('');
    program.outputHelp();
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
