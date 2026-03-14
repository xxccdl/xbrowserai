import 'dotenv/config';
import BrowserController from './src/controllers/BrowserController.js';
import ElementController from './src/controllers/ElementController.js';
import FileManager from './src/tools/FileManager.js';
import TerminalExecutor from './src/tools/TerminalExecutor.js';
import Utils from './src/utils/Utils.js';

console.log('=' .repeat(50));
console.log('       xbrowserai 模块测试');
console.log('=' .repeat(50));
console.log();

async function testModules() {
  console.log('1. 测试 Utils 模块...');
  console.log('   当前时间:', Utils.getCurrentTime());
  console.log('   格式化时间:', Utils.getCurrentTimeFormatted());
  console.log('   ✓ Utils 模块正常');
  console.log();

  console.log('2. 测试 FileManager 模块...');
  const fileManager = new FileManager();
  const testFile = 'test-file.txt';
  await fileManager.createFile(testFile, 'Hello, xbrowserai!');
  console.log('   ✓ 已创建测试文件');
  const content = await fileManager.readFile(testFile);
  console.log('   文件内容:', content);
  await fileManager.deleteFile(testFile);
  console.log('   ✓ 已删除测试文件');
  console.log('   ✓ FileManager 模块正常');
  console.log();

  console.log('3. 测试 TerminalExecutor 模块...');
  const terminal = new TerminalExecutor();
  const result = await terminal.execute('echo "Terminal test"');
  console.log('   终端输出:', result.stdout?.trim());
  console.log('   ✓ TerminalExecutor 模块正常');
  console.log();

  console.log('=' .repeat(50));
  console.log('所有核心模块测试通过！');
  console.log();
  console.log('接下来配置 .env 文件后可以运行: npm run dev');
  console.log('=' .repeat(50));
}

testModules().catch(console.error);
