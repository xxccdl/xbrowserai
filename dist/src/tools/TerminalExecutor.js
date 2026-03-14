import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import iconv from 'iconv-lite';

const execAsync = promisify(exec);

class TerminalExecutor {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.defaultEncoding = this.isWindows ? 'gbk' : 'utf-8';
  }

  // 解码缓冲区，处理中文乱码
  decodeBuffer(buffer) {
    if (!buffer) return '';
    
    // 尝试多种编码
    const encodings = ['utf-8', 'gbk', 'gb2312', 'cp936'];
    
    for (const encoding of encodings) {
      try {
        const decoded = iconv.decode(buffer, encoding);
        // 检查是否还有乱码字符
        if (!decoded.includes('����') && !decoded.includes('�')) {
          return decoded;
        }
      } catch (e) {
        // 继续尝试下一个编码
      }
    }
    
    // 如果都失败了，返回 utf-8
    return buffer.toString('utf-8');
  }

  async execute(command, options = {}) {
    const defaultOptions = {
      cwd: process.cwd(),
      timeout: 30000,
      encoding: 'buffer' // 使用 buffer 以便正确处理编码
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    console.log(`执行命令: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, mergedOptions);
      
      // 解码输出
      const decodedStdout = this.decodeBuffer(stdout);
      const decodedStderr = this.decodeBuffer(stderr);
      
      if (decodedStderr) {
        console.warn(`命令警告: ${decodedStderr}`);
      }
      
      console.log(`命令输出:\n${decodedStdout}`);
      return {
        success: true,
        stdout: decodedStdout,
        stderr: decodedStderr
      };
    } catch (error) {
      // 解码错误输出
      const decodedStdout = this.decodeBuffer(error.stdout);
      const decodedStderr = this.decodeBuffer(error.stderr);
      const decodedMessage = this.decodeBuffer(Buffer.from(error.message));
      
      console.error(`命令执行失败: ${decodedMessage}`);
      return {
        success: false,
        error: decodedMessage,
        stdout: decodedStdout,
        stderr: decodedStderr
      };
    }
  }

  async executePowerShell(command, options = {}) {
    if (this.isWindows) {
      const psCommand = `powershell -Command "${command.replace(/"/g, '\\"')}"`;
      return await this.execute(psCommand, options);
    }
    return {
      success: false,
      error: 'PowerShell is only available on Windows'
    };
  }

  spawn(command, args = [], options = {}) {
    const defaultOptions = {
      cwd: process.cwd(),
      shell: true
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    console.log(`启动进程: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, mergedOptions);

    return {
      child,
      onStdout: (callback) => {
        child.stdout?.on('data', (data) => {
          callback(this.decodeBuffer(data));
        });
      },
      onStderr: (callback) => {
        child.stderr?.on('data', (data) => {
          callback(this.decodeBuffer(data));
        });
      },
      onClose: (callback) => child.on('close', callback),
      onError: (callback) => child.on('error', callback),
      kill: () => child.kill()
    };
  }

  async dir(path = '.') {
    if (this.isWindows) {
      return await this.execute(`dir "${path}"`);
    }
    return await this.execute(`ls -la "${path}"`);
  }

  async cd(path) {
    process.chdir(path);
    console.log(`当前目录已切换到: ${process.cwd()}`);
    return process.cwd();
  }

  async pwd() {
    return process.cwd();
  }

  async echo(text) {
    return await this.execute(`echo ${text}`);
  }

  async npm(args, options = {}) {
    return await this.execute(`npm ${args}`, options);
  }

  async node(args, options = {}) {
    return await this.execute(`node ${args}`, options);
  }

  // 跨平台命令转换
  convertCommand(command) {
    if (!this.isWindows) return command;

    // Windows 不支持的 Linux 命令转换
    const conversions = {
      'chmod +x': 'echo "Windows does not support chmod"',
      'chmod': 'echo "Windows does not support chmod"',
      'ls -la': 'dir',
      'ls': 'dir',
      'cat': 'type',
      'rm -rf': 'rmdir /s /q',
      'rm': 'del',
      'cp -r': 'xcopy /s /e /i /y',
      'cp': 'copy /y',
      'mv': 'move /y',
      'touch': 'type nul >',
      'mkdir -p': 'mkdir',
      'grep': 'findstr',
      'pwd': 'cd'
    };

    let converted = command;
    for (const [linuxCmd, windowsCmd] of Object.entries(conversions)) {
      if (command.startsWith(linuxCmd)) {
        converted = command.replace(linuxCmd, windowsCmd);
        break;
      }
    }

    return converted;
  }

  // 智能执行命令（自动转换跨平台命令）
  async executeSmart(command, options = {}) {
    const convertedCommand = this.convertCommand(command);
    
    if (convertedCommand !== command) {
      console.log(`命令已转换: ${command} -> ${convertedCommand}`);
    }
    
    return await this.execute(convertedCommand, options);
  }
}

export default TerminalExecutor;
