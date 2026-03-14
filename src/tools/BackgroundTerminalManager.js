import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class BackgroundTerminalManager {
  constructor() {
    this.processes = new Map();
    this.logsDir = path.join(process.cwd(), 'logs', 'terminals');
    this.ensureLogsDir();
  }

  async ensureLogsDir() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  }

  async start(command, args = [], options = {}) {
    const id = randomUUID().slice(0, 8);
    const logFile = path.join(this.logsDir, `terminal-${id}.log`);
    
    const defaultOptions = {
      cwd: process.cwd(),
      shell: true,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    };

    const mergedOptions = { ...defaultOptions, ...options };
    
    const child = spawn(command, args, mergedOptions);
    child.unref();

    const processInfo = {
      id,
      pid: child.pid,
      command: `${command} ${args.join(' ')}`,
      startTime: new Date().toISOString(),
      logFile,
      status: 'running',
      output: []
    };

    // 写入日志文件
    const logStream = await fs.open(logFile, 'a');
    await logStream.write(`[${new Date().toISOString()}] 启动: ${processInfo.command}\n`);
    await logStream.write(`[${new Date().toISOString()}] PID: ${child.pid}\n`);
    await logStream.write('='.repeat(50) + '\n');

    child.stdout?.on('data', async (data) => {
      const line = data.toString();
      processInfo.output.push({ type: 'stdout', data: line, time: Date.now() });
      await logStream.write(`[OUT] ${line}`);
    });

    child.stderr?.on('data', async (data) => {
      const line = data.toString();
      processInfo.output.push({ type: 'stderr', data: line, time: Date.now() });
      await logStream.write(`[ERR] ${line}`);
    });

    child.on('close', async (code) => {
      processInfo.status = code === 0 ? 'completed' : 'failed';
      processInfo.exitCode = code;
      processInfo.endTime = new Date().toISOString();
      await logStream.write(`\n[${new Date().toISOString()}] 进程退出，代码: ${code}\n`);
      await logStream.close();
    });

    child.on('error', async (error) => {
      processInfo.status = 'error';
      processInfo.error = error.message;
      await logStream.write(`\n[${new Date().toISOString()}] 错误: ${error.message}\n`);
      await logStream.close();
    });

    this.processes.set(id, { child, info: processInfo, logStream });
    
    return {
      success: true,
      id,
      pid: child.pid,
      message: `后台进程已启动，ID: ${id}`
    };
  }

  async stop(id) {
    const process = this.processes.get(id);
    if (!process) {
      return { success: false, error: `未找到进程: ${id}` };
    }

    const { child, info, logStream } = process;
    
    try {
      child.kill('SIGTERM');
      
      // 等待进程结束
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          child.kill('SIGKILL');
          resolve();
        }, 5000);
        
        child.on('close', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      info.status = 'stopped';
      await logStream.write(`\n[${new Date().toISOString()}] 进程被手动停止\n`);
      await logStream.close();

      return { success: true, message: `进程 ${id} 已停止` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  list() {
    const list = [];
    for (const [id, { info }] of this.processes) {
      list.push({
        id,
        pid: info.pid,
        command: info.command,
        status: info.status,
        startTime: info.startTime,
        logFile: info.logFile
      });
    }
    return { success: true, processes: list };
  }

  async getOutput(id, lines = 50) {
    const process = this.processes.get(id);
    if (!process) {
      return { success: false, error: `未找到进程: ${id}` };
    }

    const { info } = process;
    const recentOutput = info.output.slice(-lines);
    
    return {
      success: true,
      id,
      output: recentOutput,
      totalLines: info.output.length
    };
  }

  async getLog(id) {
    const process = this.processes.get(id);
    if (!process) {
      return { success: false, error: `未找到进程: ${id}` };
    }

    try {
      const content = await fs.readFile(process.info.logFile, 'utf-8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clean() {
    const completed = [];
    for (const [id, { info }] of this.processes) {
      if (info.status === 'completed' || info.status === 'failed' || info.status === 'stopped') {
        completed.push(id);
      }
    }
    
    for (const id of completed) {
      this.processes.delete(id);
    }

    return { success: true, cleaned: completed.length };
  }
}

export default BackgroundTerminalManager;
