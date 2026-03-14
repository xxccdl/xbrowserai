import LLMProvider from './LLMProvider.js';
import SkillManager from '../skills/SkillManager.js';
import TaskSchedulerSkill from '../skills/TaskSchedulerSkill.js';

class Agent {
  constructor(browserController, elementController, fileManager, terminalExecutor, utils, dataExtractor, cookieManager, dialogHandler, taskScheduler) {
    this.browser = browserController;
    this.element = elementController;
    this.fileManager = fileManager;
    this.terminal = terminalExecutor;
    this.utils = utils;
    this.dataExtractor = dataExtractor;
    this.cookieManager = cookieManager;
    this.dialogHandler = dialogHandler;
    this.taskScheduler = taskScheduler;
    
    this.llm = new LLMProvider();
    this.conversationHistory = [];
    this.maxHistoryLength = 100;
    this.maxTokens = 80000;
    this.compressionThreshold = 0.5;
    this.maxToolResultLength = 1000;
    this.tokenEstimateFactor = 2;
    
    this.nonFileTools = [
      'browser_goto', 'browser_click', 'browser_click_by_text', 'browser_type', 
      'browser_get_text', 'browser_get_page_info', 'browser_get_content',
      'browser_screenshot', 'browser_new_page', 'browser_switch_page',
      'browser_go_back', 'browser_go_forward', 'browser_refresh',
      'browser_wait_for_selector', 'browser_evaluate', 'browser_get_all_links',
      'browser_scroll_to', 'browser_scroll_to_top', 'browser_scroll_to_bottom',
      'browser_scroll_by', 'browser_wait', 'terminal_execute',
      'get_current_time', 'get_current_time_formatted', 'sleep',
      'handle_dialog', 'get_dialog_history', 'extract_table', 'extract_list',
      'extract_links', 'extract_article', 'get_cookies', 'set_cookie',
      'export_cookies', 'import_cookies', 'list_tabs', 'close_tab',
      'download_file', 'fill_form', 'press_key', 'press_enter',
      'press_ctrl_a', 'press_ctrl_c', 'press_ctrl_v', 'task_add',
      'task_schedule', 'task_schedule_ai', 'task_list', 'task_run',
      'task_pause', 'task_resume', 'task_remove', 'skill_list',
      'skill_create', 'skill_update', 'skill_delete', 'skill_detail',
      'history_clear', 'history_delete', 'history_delete_range', 'history_list'
    ];
    
    this.fileTools = [
      'file_read', 'file_write', 'file_append', 'file_create',
      'file_delete', 'file_list_dir', 'file_create_dir'
    ];
    
    this.nonFileToolTimeout = 6000;
    this.executionTimeout = 10000;
    this.fileToolTimeout = 30000;
    
    // 初始化技能管理器
    this.skillManager = new SkillManager();
    this.initSkills();
    this.skillManager.init();
  }
  
  initSkills() {
    // 注册定时任务技能
    const taskSkill = new TaskSchedulerSkill(this.taskScheduler);
    this.skillManager.registerSkill('taskScheduler', taskSkill.getHandler());
  }

  async withTimeout(promise, timeoutMs, errorMessage) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage || `操作超时 (${timeoutMs}ms)`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'browser_goto',
          description: '导航到指定URL',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '要访问的URL' }
            },
            required: ['url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_click',
          description: '点击页面元素（使用CSS选择器）',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS选择器' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_click_by_text',
          description: '通过文本内容点击元素，当无法使用CSS选择器时使用',
          parameters: {
            type: 'object',
            properties: {
              text: { type: 'string', description: '要查找的文本内容' },
              tagName: { type: 'string', description: '标签名过滤（可选，如a、button）', default: '*' }
            },
            required: ['text']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_type',
          description: '在输入框中输入文本',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS选择器' },
              text: { type: 'string', description: '要输入的文本' }
            },
            required: ['selector', 'text']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_get_text',
          description: '获取元素文本',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS选择器' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_get_page_info',
          description: '获取当前页面信息',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_get_content',
          description: '获取页面内容，包含文本和可点击元素列表',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_screenshot',
          description: '截取当前页面截图',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '保存路径（可选）' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_new_page',
          description: '创建新标签页',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_switch_page',
          description: '切换到指定标签页',
          parameters: {
            type: 'object',
            properties: {
              index: { type: 'number', description: '标签页索引' }
            },
            required: ['index']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_go_back',
          description: '返回上一页',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_go_forward',
          description: '前进到下一页',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_refresh',
          description: '刷新页面',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_wait_for_selector',
          description: '等待元素出现',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS选择器' },
              timeout: { type: 'number', description: '超时时间（毫秒）' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_evaluate',
          description: '在页面中执行JavaScript代码',
          parameters: {
            type: 'object',
            properties: {
              script: { type: 'string', description: '要执行的JavaScript代码' }
            },
            required: ['script']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_get_all_links',
          description: '获取页面所有链接',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_scroll_to',
          description: '滚动到指定元素',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS选择器' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_scroll_to_top',
          description: '滚动到页面顶部',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_scroll_to_bottom',
          description: '滚动到页面底部',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_scroll_by',
          description: '滚动指定像素数',
          parameters: {
            type: 'object',
            properties: {
              pixels: { type: 'number', description: '要滚动的像素数（正数向下，负数向上）' }
            },
            required: ['pixels']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'browser_wait',
          description: '等待指定毫秒数',
          parameters: {
            type: 'object',
            properties: {
              ms: { type: 'number', description: '等待毫秒数' }
            },
            required: ['ms']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'file_read',
          description: '读取文件内容',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '文件路径' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'file_write',
          description: '写入文件内容',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '文件路径' },
              content: { type: 'string', description: '文件内容' }
            },
            required: ['path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'file_append',
          description: '追加内容到文件',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '文件路径' },
              content: { type: 'string', description: '要追加的内容' }
            },
            required: ['path', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'file_create',
          description: '创建新文件',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '文件路径' },
              content: { type: 'string', description: '初始内容（可选）' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'file_delete',
          description: '删除文件',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '文件路径' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'file_list_dir',
          description: '列出目录内容',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '目录路径（可选）' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'file_create_dir',
          description: '创建目录',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: '目录路径' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'terminal_execute',
          description: '执行终端命令',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string', description: '要执行的命令' }
            },
            required: ['command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: '获取当前时间',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_current_time_formatted',
          description: '获取格式化的当前时间',
          parameters: {
            type: 'object',
            properties: {
              format: { type: 'string', description: '时间格式（可选）' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'sleep',
          description: '等待指定时间',
          parameters: {
            type: 'object',
            properties: {
              ms: { type: 'number', description: '等待毫秒数' }
            },
            required: ['ms']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'handle_dialog',
          description: '处理浏览器弹窗（alert、confirm、prompt）',
          parameters: {
            type: 'object',
            properties: {
              action: { 
                type: 'string', 
                description: '操作类型: accept(确认/是)、dismiss(取消/否)',
                enum: ['accept', 'dismiss']
              },
              text: { 
                type: 'string', 
                description: 'prompt弹窗的输入文本（仅prompt类型需要）',
                default: ''
              }
            },
            required: ['action']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_dialog_history',
          description: '获取弹窗处理历史',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'extract_table',
          description: '提取页面表格数据',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '表格CSS选择器', default: 'table' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'extract_list',
          description: '提取列表数据',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '列表项CSS选择器', default: 'li' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'extract_links',
          description: '提取页面所有链接',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '链接CSS选择器', default: 'a' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'extract_article',
          description: '提取文章正文内容',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '文章容器CSS选择器', default: 'article' }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_cookies',
          description: '获取所有Cookie',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'set_cookie',
          description: '设置Cookie',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Cookie名称' },
              value: { type: 'string', description: 'Cookie值' },
              domain: { type: 'string', description: '域名' },
              path: { type: 'string', description: '路径', default: '/' }
            },
            required: ['name', 'value']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'export_cookies',
          description: '导出Cookie到文件',
          parameters: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: '保存路径' }
            },
            required: ['filePath']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'import_cookies',
          description: '从文件导入Cookie',
          parameters: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Cookie文件路径' }
            },
            required: ['filePath']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_tabs',
          description: '列出所有标签页',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'close_tab',
          description: '关闭指定标签页',
          parameters: {
            type: 'object',
            properties: {
              index: { type: 'number', description: '标签页索引' }
            },
            required: ['index']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'download_file',
          description: '下载文件',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: '文件URL' },
              savePath: { type: 'string', description: '保存路径' }
            },
            required: ['url', 'savePath']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'fill_form',
          description: '自动填充表单',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '表单CSS选择器', default: 'form' },
              data: { 
                type: 'object', 
                description: '表单数据，键值对形式，如{"username": "admin", "password": "123456"}' 
              }
            },
            required: ['data']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'press_key',
          description: '在元素上按下键盘按键',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '元素CSS选择器' },
              key: { 
                type: 'string', 
                description: '按键名称',
                enum: ['Enter', 'Tab', 'Escape', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', 'F5', 'F12']
              }
            },
            required: ['selector', 'key']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'press_enter',
          description: '在元素上按下回车键（等同于点击提交）',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '元素CSS选择器，通常是输入框' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'press_ctrl_a',
          description: '在元素上按下 Ctrl+A 全选',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '元素CSS选择器' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'press_ctrl_c',
          description: '在元素上按下 Ctrl+C 复制',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '元素CSS选择器' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'press_ctrl_v',
          description: '在元素上按下 Ctrl+V 粘贴',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: '元素CSS选择器' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_add',
          description: '创建一次性任务',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '任务名称' },
              command: { type: 'string', description: '要执行的命令' }
            },
            required: ['name', 'command']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_schedule',
          description: '创建定时任务（命令任务），支持自然语言如"每5分钟"、"每小时"、"每天8点"',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '任务名称' },
              command: { type: 'string', description: '要执行的命令' },
              schedule: { type: 'string', description: '定时表达式，如"*/5"(每5分钟)、"0 */1"(每小时)、"0 8"(每天8点)' }
            },
            required: ['name', 'command', 'schedule']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_schedule_ai',
          description: '创建AI定时任务（AI子代理执行），支持自然语言如"每5分钟"、"每小时"、"每天8点"',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '任务名称' },
              prompt: { type: 'string', description: 'AI要执行的任务描述，用自然语言描述' },
              schedule: { type: 'string', description: '定时表达式，如"*/5"(每5分钟)、"0 */1"(每小时)、"0 8"(每天8点)' }
            },
            required: ['name', 'prompt', 'schedule']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_list',
          description: '列出所有任务',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_run',
          description: '立即执行任务',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '任务ID' }
            },
            required: ['id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_pause',
          description: '暂停定时任务',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '任务ID' }
            },
            required: ['id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_resume',
          description: '恢复定时任务',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '任务ID' }
            },
            required: ['id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'task_remove',
          description: '删除任务',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '任务ID' }
            },
            required: ['id']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'skill_list',
          description: '列出所有可用技能',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'skill_create',
          description: '创建新技能，AI可以自动创建自定义技能来扩展功能',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '技能名称（英文，不含空格）' },
              description: { type: 'string', description: '技能描述' },
              triggers: { 
                type: 'array', 
                description: '触发词列表，当用户输入包含这些词时会触发该技能',
                items: { type: 'string' }
              },
              actions: {
                type: 'array',
                description: '技能执行的动作列表',
                items: { type: 'object' }
              }
            },
            required: ['name', 'description', 'triggers']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'skill_update',
          description: '更新已有技能',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '技能名称' },
              description: { type: 'string', description: '新的描述' },
              triggers: { 
                type: 'array', 
                description: '新的触发词列表'
              },
              enabled: { type: 'boolean', description: '是否启用' }
            },
            required: ['name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'skill_delete',
          description: '删除技能',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '技能名称' }
            },
            required: ['name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'skill_detail',
          description: '获取技能详情',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '技能名称' }
            },
            required: ['name']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'history_clear',
          description: '清空所有对话历史',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'history_delete',
          description: '删除指定索引的对话历史记录',
          parameters: {
            type: 'object',
            properties: {
              index: { type: 'number', description: '要删除的记录索引（从0开始）' }
            },
            required: ['index']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'history_delete_range',
          description: '删除指定范围的对话历史记录',
          parameters: {
            type: 'object',
            properties: {
              start: { type: 'number', description: '起始索引（包含）' },
              end: { type: 'number', description: '结束索引（不包含）' }
            },
            required: ['start', 'end']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'history_list',
          description: '查看对话历史列表',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      }
    ];
  }

  async executeTool(name, args) {
    try {
      let result;
      let timeout = this.executionTimeout;
      
      if (this.nonFileTools.includes(name)) {
        timeout = this.nonFileToolTimeout;
      } else if (this.fileTools.includes(name)) {
        timeout = this.fileToolTimeout;
      }
      
      const executeTask = async () => {
        switch (name) {
          case 'browser_goto':
            return await this.browser.goto(args.url);
          
          case 'browser_click':
            return await this.element.click(args.selector);
          
          case 'browser_click_by_text':
            return await this.element.clickByText(args.text, args.tagName || '*');
          
          case 'browser_type':
            return await this.element.type(args.selector, args.text);
          
          case 'browser_get_text':
            return await this.element.getText(args.selector);
          
          case 'browser_get_page_info':
            return await this.browser.getPageInfo();
          
          case 'browser_get_content':
            return await this.browser.getPageContent();
          
          case 'browser_screenshot':
            return await this.browser.screenshot(args);
          
          case 'browser_new_page':
            return await this.browser.newPage();
          
          case 'browser_switch_page':
            return await this.browser.switchToPage(args.index);
          
          case 'browser_go_back':
            return await this.browser.goBack();
          
          case 'browser_go_forward':
            return await this.browser.goForward();
          
          case 'browser_refresh':
            return await this.browser.refresh();
          
          case 'browser_wait_for_selector':
            return await this.browser.waitForSelector(args.selector, args.timeout);
          
          case 'browser_evaluate':
            return await this.browser.evaluate(new Function(args.script));
          
          case 'browser_get_all_links':
            return await this.element.getAllLinks();
          
          case 'browser_scroll_to':
            return await this.element.scrollTo(args.selector);
          
          case 'browser_scroll_to_top':
            return await this.browser.scrollToTop();
          
          case 'browser_scroll_to_bottom':
            return await this.browser.scrollToBottom();
          
          case 'browser_scroll_by':
            return await this.browser.scrollBy(args.pixels);
          
          case 'browser_wait':
            return await this.browser.waitForMilliseconds(args.ms);
          
          case 'file_read':
            return await this.fileManager.readFile(args.path);
          
          case 'file_write':
            return await this.fileManager.writeFile(args.path, args.content);
          
          case 'file_append':
            return await this.fileManager.appendFile(args.path, args.content);
          
          case 'file_create':
            return await this.fileManager.createFile(args.path, args.content || '');
          
          case 'file_delete':
            return await this.fileManager.deleteFile(args.path);
          
          case 'file_list_dir':
            return await this.fileManager.listDir(args.path || '.');
          
          case 'file_create_dir':
            return await this.fileManager.createDir(args.path);
          
          case 'terminal_execute':
            return await this.terminal.execute(args.command);
        
          case 'get_current_time':
            return { success: true, result: this.utils.getCurrentTime() };
          
          case 'get_current_time_formatted':
            return { success: true, result: this.utils.getCurrentTimeFormatted(args.format) };
          
          case 'sleep':
            await this.utils.sleep(args.ms);
            return { success: true };
          
          case 'handle_dialog':
            return await this.dialogHandler.enableAutoHandle(args.action, args.text || '');
          
          case 'get_dialog_history':
            return this.dialogHandler.getDialogHistory();
          
          case 'extract_table':
            return await this.dataExtractor.extractTable(args.selector || 'table');
          
          case 'extract_list':
            return await this.dataExtractor.extractList(args.selector || 'li');
          
          case 'extract_links':
            return await this.dataExtractor.extractLinks(args.selector || 'a');
          
          case 'extract_article':
            return await this.dataExtractor.extractTextContent(args.selector || 'article');
          
          case 'get_cookies':
            return await this.cookieManager.getAllCookies();
          
          case 'set_cookie':
            return await this.cookieManager.setCookie({
              name: args.name,
              value: args.value,
              domain: args.domain,
              path: args.path || '/'
            });
          
          case 'export_cookies':
            return await this.cookieManager.exportCookies(args.filePath);
          
          case 'import_cookies':
            return await this.cookieManager.importCookies(args.filePath);
          
          case 'list_tabs':
            return await this.browser.getPageInfo();
          
          case 'close_tab':
            return await this.browser.closePage(args.index);
          
          case 'download_file':
            return await this.browser.downloadFile(args.url, args.savePath);
          
          case 'fill_form':
            return await this.fillForm(args.selector || 'form', args.data);
          
          case 'press_key':
            return await this.element.pressKey(args.selector, args.key);
          
          case 'press_enter':
            return await this.element.pressEnter(args.selector);
          
          case 'press_ctrl_a':
            return await this.element.pressCtrlA(args.selector);
          
          case 'press_ctrl_c':
            return await this.element.pressCtrlC(args.selector);
          
          case 'press_ctrl_v':
            return await this.element.pressCtrlV(args.selector);
          
          case 'task_add':
            return await this.taskScheduler.addTask(args.name, args.command);
          
          case 'task_schedule':
            return await this.taskScheduler.addSchedule(args.name, args.command, args.schedule);
          
          case 'task_schedule_ai':
            return await this.taskScheduler.addSchedule(args.name, '', args.schedule, {
              taskType: 'ai',
              prompt: args.prompt
            });
          
          case 'task_list':
            return this.taskScheduler.listTasks();
          
          case 'task_run':
            return await this.taskScheduler.runTask(args.id);
          
          case 'task_pause':
            return await this.taskScheduler.pauseSchedule(args.id);
          
          case 'task_resume':
            return await this.taskScheduler.resumeSchedule(args.id);
          
          case 'task_remove':
            return await this.taskScheduler.removeTask(args.id);
          
          case 'skill_list':
            return this.skillManager.listSkills();
          
          case 'skill_create':
            return await this.skillManager.createSkill(
              args.name,
              args.description,
              args.triggers,
              args.actions || []
            );
          
          case 'skill_update':
            return await this.skillManager.updateSkill(args.name, {
              description: args.description,
              triggers: args.triggers,
              enabled: args.enabled
            });
          
          case 'skill_delete':
            return this.skillManager.unregisterSkill(args.name);
          
          case 'skill_detail':
            return await this.skillManager.getSkillDetail(args.name);
          
          case 'history_clear':
            this.clearHistory();
            return { success: true, message: '对话历史已清空' };
          
          case 'history_delete':
            return this.deleteHistory(args.index);
          
          case 'history_delete_range':
            return this.deleteHistoryRange(args.start, args.end);
          
          case 'history_list':
            return { 
              success: true, 
              history: this.conversationHistory.map((msg, i) => ({
                index: i,
                role: msg.role,
                content: (msg.content || '').substring(0, 100)
              }))
            };
          
          default:
            throw new Error(`未知工具: ${name}`);
        }
      };
      
      try {
        result = await this.withTimeout(executeTask(), timeout, `工具调用超时: ${name} (${timeout}ms)`);
      } catch (timeoutError) {
        return { error: timeoutError.message, timeout: true };
      }
      
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          return result.result !== undefined ? result.result : { success: true };
        } else {
          return { error: result.error, selector: result.selector };
        }
      }
      
      return result;
      
    } catch (error) {
      return { error: error.message };
    }
  }

  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  buildSystemPrompt() {
    return {
      role: 'system',
      content: `你是一个强大的浏览器AI助手，可以控制浏览器、管理文件、执行终端命令的全能助手。

你的能力：
1. 浏览器控制：打开网页、点击元素、输入文本、切换标签页、执行JS等
2. 文件管理：创建、读取、写入、追加、删除文件，创建目录等
3. 终端操作：执行命令行命令
4. 工具函数：获取时间、等待等

请根据用户需求，合理使用工具完成任务。可以调用多个工具完成复杂任务。

重要提示：
- 当需要执行操作时，调用对应的工具函数
- 每个工具调用都是独立的，请根据需要合理安排调用顺序
- 完成任务后总结结果
- 用中文回复`
    };
  }

  estimateTokens(message) {
    let text = '';
    if (typeof message === 'string') {
      text = message;
    } else if (message.content) {
      text = message.content;
    } else if (message.tool_calls) {
      text = JSON.stringify(message.tool_calls);
    }

    return Math.ceil(text.length / this.tokenEstimateFactor) + 10;
  }

  estimateTotalTokens(messages) {
    let total = 0;
    for (const msg of messages) {
      total += this.estimateTokens(msg);
    }
    return total;
  }

  simplifyToolResult(result, toolName) {
    if (!result) return '成功';
    
    if (typeof result === 'string') {
      return this.truncateText(result, this.maxToolResultLength);
    }
    
    if (typeof result === 'object') {
      if (result.success === true) {
        if (result.message) {
          return result.message;
        }
        if (result.result !== undefined) {
          return this.simplifyValue(result.result, toolName);
        }
        return '成功';
      }
      
      if (result.error) {
        return `错误: ${result.error}`;
      }
    }
    
    return this.truncateText(JSON.stringify(result), this.maxToolResultLength);
  }

  simplifyValue(value, toolName) {
    if (value === null || value === undefined) return '';
    
    if (typeof value === 'string') {
      return this.truncateText(value, this.maxToolResultLength);
    }
    
    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      if (value.length <= 5) {
        const items = value.slice(0, 5).map(item => 
          typeof item === 'string' ? item.substring(0, 100) : JSON.stringify(item).substring(0, 100)
        );
        return `[${items.join(', ')}${value.length > 5 ? '...' : ''}] (${value.length}项)`;
      }
      return `[...${value.length}项]`;
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      
      const importantKeys = ['title', 'url', 'text', 'content', 'name', 'id', 'path', 'message', 'result', 'count', 'success'];
      const filtered = {};
      for (const key of importantKeys) {
        if (value[key] !== undefined) {
          filtered[key] = value[key];
        }
      }
      
      if (Object.keys(filtered).length > 0) {
        const str = JSON.stringify(filtered);
        if (str.length <= this.maxToolResultLength) {
          return str;
        }
      }
      
      return `{${keys.length}个字段}`;
    }
    
    return String(value);
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    const str = String(text);
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength) + '...';
  }

  truncateToolResult(result) {
    const strResult = typeof result === 'string' ? result : JSON.stringify(result);
    return this.truncateText(strResult, this.maxToolResultLength);
  }

  compressContext(messages) {
    const systemPrompt = messages[0];
    const history = messages.slice(1);
    
    let compressedHistory = [...history];
    let totalTokens = this.estimateTotalTokens([systemPrompt, ...compressedHistory]);
    
    while (totalTokens > this.maxTokens * this.compressionThreshold && compressedHistory.length > 6) {
      const removed = compressedHistory.shift();
      totalTokens = this.estimateTotalTokens([systemPrompt, ...compressedHistory]);
    }
    
    return [systemPrompt, ...compressedHistory];
  }

  ensureMessageContent(message) {
    if (!message.content) {
      if (message.role === 'assistant' && message.tool_calls) {
        message.content = '[工具调用]';
      } else {
        message.content = '';
      }
    }
    return message;
  }

  smartAddToHistory(message, toolName = null) {
    const safeMessage = this.ensureMessageContent({...message});
    if (safeMessage.role === 'tool' && safeMessage.content) {
      try {
        const parsed = JSON.parse(safeMessage.content);
        safeMessage.content = this.simplifyToolResult(parsed, toolName);
      } catch {
        safeMessage.content = this.truncateToolResult(safeMessage.content);
      }
    }
    this.conversationHistory.push(safeMessage);
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  async process(userInput) {
    return await this.processWithTools(userInput);
  }

  async processWithTools(userInput, onToolCall, onToolResult) {
    this.smartAddToHistory({ role: 'user', content: userInput });

    let iterationCount = 0;
    const maxIterations = 10000;

    while (iterationCount < maxIterations) {
      iterationCount++;
      
      let messages = [
        this.buildSystemPrompt(),
        ...this.conversationHistory.map(msg => this.ensureMessageContent({...msg}))
      ];
      
      const estimatedTokens = this.estimateTotalTokens(messages);
      
      if (estimatedTokens > this.maxTokens * this.compressionThreshold) {
        messages = this.compressContext(messages);
      }

      const response = await this.llm.chat(messages, {
        tools: this.getTools()
      });

      if (!response.success) {
        return `抱歉，发生错误：${response.error}`;
      }

      const message = response.message;
      this.smartAddToHistory(message);

      if (message.tool_calls && message.tool_calls.length > 0) {
        
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          let toolArgs = {};
          
          try {
            toolArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
          }
          
          if (onToolCall) {
            onToolCall({ name: toolName, args: toolArgs });
          }

          const result = await this.executeTool(toolName, toolArgs);
          
          if (onToolResult) {
            onToolResult(toolName, result);
          }

          this.smartAddToHistory({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          }, toolName);
        }
        
        continue;
      }

      if (message.content) {
        return message.content;
      }
    }

    return '任务执行次数过多，请重新开始。';
  }

  parseToolCalls(content) {
    const toolCalls = [];
    
    try {
      const funcCallRegex = /```json\s*([\s\S]*?)\s*```/g;
      let match;
      
      while ((match = funcCallRegex.exec(content)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.name && parsed.arguments) {
            toolCalls.push({
              name: parsed.name,
              args: parsed.arguments
            });
          } else if (parsed.tool_name && parsed.parameters) {
            toolCalls.push({
              name: parsed.tool_name,
              args: parsed.parameters
            });
          }
        } catch (e) {
        }
      }
    } catch (e) {
    }

    return toolCalls;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  deleteHistory(index) {
    if (index < 0 || index >= this.conversationHistory.length) {
      return { success: false, error: '索引超出范围' };
    }
    const deleted = this.conversationHistory.splice(index, 1);
    return { success: true, deleted: deleted[0] };
  }

  deleteHistoryRange(start, end) {
    if (start < 0 || end > this.conversationHistory.length || start >= end) {
      return { success: false, error: '无效的范围' };
    }
    const deleted = this.conversationHistory.splice(start, end - start);
    return { success: true, deletedCount: deleted.length };
  }

  async fillForm(selector, data) {
    try {
      const forms = await this.dataExtractor.extractFormFields(selector);
      if (!forms || forms.length === 0) {
        return { success: false, error: '未找到表单' };
      }
      
      const form = forms[0];
      const page = this.browser.getCurrentPage();
      
      for (const [key, value] of Object.entries(data)) {
        const field = form.fields.find(f => f.name === key || f.id === key);
        if (field) {
          const fieldSelector = field.id ? `#${field.id}` : `[name="${field.name}"]`;
          await page.type(fieldSelector, String(value));
        }
      }
      
      return { success: true, result: `已填充表单 ${selector}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default Agent;
