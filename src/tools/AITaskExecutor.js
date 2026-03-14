import LLMProvider from '../ai/LLMProvider.js';
import BrowserController from '../controllers/BrowserController.js';
import ElementController from '../controllers/ElementController.js';
import DataExtractor from '../controllers/DataExtractor.js';
import CookieManager from '../controllers/CookieManager.js';
import DialogHandler from '../controllers/DialogHandler.js';
import FileManager from './FileManager.js';
import TerminalExecutor from './TerminalExecutor.js';
import Utils from '../utils/Utils.js';

class AITaskExecutor {
  constructor(browserController, elementController, dataExtractor, cookieManager, dialogHandler, fileManager, terminalExecutor) {
    this.browser = browserController;
    this.element = elementController;
    this.dataExtractor = dataExtractor;
    this.cookieManager = cookieManager;
    this.dialogHandler = dialogHandler;
    this.fileManager = fileManager;
    this.terminal = terminalExecutor;
    this.llm = new LLMProvider();
  }

  async execute(prompt, taskName) {
    console.log(`[AI任务] 开始执行: ${taskName}`);
    
    try {
      const messages = [
        {
          role: 'system',
          content: `你是一个任务执行助手。请根据用户的需求，使用工具完成任务。

可用工具：
- browser_goto(url) - 打开网页
- browser_click(selector) - 点击元素
- browser_type(selector, text) - 输入文本
- browser_get_text(selector) - 获取元素文本
- browser_screenshot(path) - 截图
- file_read(path) - 读取文件
- file_write(path, content) - 写入文件
- terminal_execute(command) - 执行终端命令
- get_current_time() - 获取当前时间

请直接执行任务，不需要回复其他内容。`
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.llm.chat(messages);
      
      if (response.success) {
        console.log(`[AI任务] 完成: ${taskName}`);
        return {
          success: true,
          result: response.message.content
        };
      } else {
        console.error(`[AI任务] 失败: ${taskName}`, response.error);
        return {
          success: false,
          error: response.error
        };
      }
    } catch (error) {
      console.error(`[AI任务] 异常: ${taskName}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AITaskExecutor;
