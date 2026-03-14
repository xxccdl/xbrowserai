import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import iconv from 'iconv-lite';

class TaskScheduler {
  constructor(aiTaskExecutor = null) {
    this.tasks = new Map();
    this.schedules = new Map();
    this.logsDir = path.join(process.cwd(), 'logs', 'tasks');
    this.dataDir = path.join(process.cwd(), 'data');
    this.tasksFile = path.join(this.dataDir, 'tasks.json');
    this.isWindows = process.platform === 'win32';
    this.aiTaskExecutor = aiTaskExecutor;
    this.initialized = false;
  }

  decodeBuffer(buffer) {
    if (!buffer) return '';
    
    const encodings = ['utf-8', 'gbk', 'gb2312', 'cp936'];
    
    for (const encoding of encodings) {
      try {
        const decoded = iconv.decode(buffer, encoding);
        if (!decoded.includes('����') && !decoded.includes('�')) {
          return decoded;
        }
      } catch (e) {
      }
    }
    
    return buffer.toString('utf-8');
  }

  async init() {
    if (this.initialized) return;
    await this.ensureLogsDir();
    await this.ensureDataDir();
    await this.loadTasks();
    this.initialized = true;
  }

  async ensureLogsDir() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
    }
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
    }
  }

  async saveTasks() {
    try {
      const tasksData = [];
      const schedulesData = [];

      for (const [id, task] of this.tasks) {
        tasksData.push({ id, ...task });
      }

      for (const [id, schedule] of this.schedules) {
        const { timer, ...scheduleInfo } = schedule;
        schedulesData.push({ id, ...scheduleInfo });
      }

      const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tasks: tasksData,
        schedules: schedulesData
      };

      await fs.writeFile(this.tasksFile, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadTasks() {
    try {
      const content = await fs.readFile(this.tasksFile, 'utf-8');
      const data = JSON.parse(content);

      this.tasks.clear();
      if (data.tasks) {
        for (const task of data.tasks) {
          this.tasks.set(task.id, task);
        }
      }

      this.schedules.clear();
      if (data.schedules) {
        for (const schedule of data.schedules) {
          this.schedules.set(schedule.id, {
            ...schedule,
            timer: null
          });
          if (schedule.status === 'active') {
            this.startScheduleTimer(schedule.id);
          }
        }
      }

      console.log(`[TaskScheduler] 已加载 ${this.tasks.size} 个一次性任务和 ${this.schedules.size} 个定时任务`);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: false, error: '无任务数据' };
      }
      return { success: false, error: error.message };
    }
  }

  async addTask(name, command, options = {}) {
    const id = randomUUID().slice(0, 8);
    const task = {
      id,
      name,
      command,
      type: 'once',
      taskType: options.taskType || 'command',
      prompt: options.prompt,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...options
    };

    this.tasks.set(id, task);
    await this.saveTasks();
    return { success: true, id, message: `任务已创建: ${name}` };
  }

  async addSchedule(name, command, schedule, options = {}) {
    const id = randomUUID().slice(0, 8);
    
    const scheduleParts = schedule.trim().split(/\s+/);
    let minute = '*';
    let hour = '*';
    let day = '*';
    
    if (scheduleParts.length >= 1) minute = scheduleParts[0];
    if (scheduleParts.length >= 2) hour = scheduleParts[1];
    if (scheduleParts.length >= 3) day = scheduleParts[2];

    const scheduledTask = {
      id,
      name,
      command,
      type: 'scheduled',
      taskType: options.taskType || 'command',
      prompt: options.prompt,
      schedule: { minute, hour, day },
      status: 'active',
      lastRun: null,
      nextRun: this.calculateNextRun(minute, hour, day),
      runCount: 0,
      createdAt: new Date().toISOString(),
      ...options
    };

    this.schedules.set(id, scheduledTask);
    this.startScheduleTimer(id);
    await this.saveTasks();

    const taskTypeText = scheduledTask.taskType === 'ai' ? 'AI任务' : '命令任务';
    console.log(`[定时任务] 已创建: ${name} (${id}) [${taskTypeText}], 下次运行: ${new Date(scheduledTask.nextRun).toLocaleString('zh-CN')}`);

    return { 
      success: true, 
      id, 
      message: `定时任务已创建: ${name}`,
      nextRun: scheduledTask.nextRun
    };
  }

  calculateNextRun(minute, hour, day) {
    const now = new Date();
    let next = new Date(now);
    
    if (minute !== '*') {
      if (minute.startsWith('*/')) {
        const interval = parseInt(minute.replace('*/', ''));
        next = new Date(now.getTime() + interval * 60 * 1000);
      } else {
        const targetMin = parseInt(minute);
        next.setMinutes(targetMin);
        next.setSeconds(0);
        next.setMilliseconds(0);
        if (next <= now) {
          next.setHours(next.getHours() + 1);
        }
      }
    } else {
      next = new Date(now.getTime() + 60 * 1000);
    }

    if (hour !== '*' && !minute.startsWith('*/')) {
      const targetHour = parseInt(hour);
      next.setHours(targetHour);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    }

    if (day !== '*') {
      const targetDay = parseInt(day);
      next.setDate(targetDay);
      next.setHours(0);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next.toISOString();
  }

  startScheduleTimer(id) {
    const schedule = this.schedules.get(id);
    if (!schedule || schedule.status !== 'active') return;

    if (schedule.timer) {
      clearInterval(schedule.timer);
    }

    const checkInterval = setInterval(async () => {
      const currentSchedule = this.schedules.get(id);
      if (!currentSchedule) {
        clearInterval(checkInterval);
        return;
      }

      if (currentSchedule.status !== 'active') {
        return;
      }

      const now = new Date();
      const nextRun = new Date(currentSchedule.nextRun);

      if (now >= nextRun) {
        await this.executeScheduledTask(id);
      }
    }, 5000);

    schedule.timer = checkInterval;
  }

  async executeScheduledTask(id) {
    const schedule = this.schedules.get(id);
    if (!schedule) return;

    if (schedule.status === 'running') {
      console.log(`[定时任务] 任务 ${schedule.name} 正在运行中，跳过本次执行`);
      return;
    }

    schedule.runCount++;
    schedule.status = 'running';
    schedule.lastRun = new Date().toISOString();
    schedule.nextRun = this.calculateNextRun(
      schedule.schedule.minute,
      schedule.schedule.hour,
      schedule.schedule.day
    );
    await this.saveTasks();

    const taskTypeText = schedule.taskType === 'ai' ? 'AI任务' : '命令任务';
    console.log(`[定时任务] 开始执行: ${schedule.name} (${id}) [${taskTypeText}], 第${schedule.runCount}次`);

    const logFile = path.join(this.logsDir, `task-${id}-${Date.now()}.log`);
    
    try {
      let logContent = `[${new Date().toISOString()}] 执行任务: ${schedule.name}\n`;
      logContent += `[${new Date().toISOString()}] 类型: ${taskTypeText}\n`;
      
      if (schedule.taskType === 'ai' && this.aiTaskExecutor && schedule.prompt) {
        logContent += `[${new Date().toISOString()}] 提示词: ${schedule.prompt}\n`;
        
        const result = await this.aiTaskExecutor.execute(schedule.prompt, schedule.name);
        
        if (result.success) {
          logContent += `[${new Date().toISOString()}] AI执行结果: ${result.result}\n`;
          console.log(`[AI任务] ${schedule.name} 结果: ${result.result}`);
        } else {
          logContent += `[${new Date().toISOString()}] AI执行失败: ${result.error}\n`;
          console.error(`[AI任务] ${schedule.name} 失败: ${result.error}`);
        }
        
        schedule.status = 'active';
        logContent += `[${new Date().toISOString()}] 任务完成\n`;
        await fs.writeFile(logFile, logContent, 'utf-8');
        await this.saveTasks();
        console.log(`[定时任务] 完成: ${schedule.name}, 下次运行: ${new Date(schedule.nextRun).toLocaleString('zh-CN')}`);
        
      } else {
        logContent += `[${new Date().toISOString()}] 命令: ${schedule.command}\n`;
        
        const args = this.isWindows ? ['/c', schedule.command] : ['-c', schedule.command];
        const shell = this.isWindows ? 'cmd.exe' : '/bin/bash';
        
        const child = spawn(shell, args, {
          cwd: process.cwd(),
          shell: false
        });

        child.stdout?.on('data', (data) => {
          const str = this.decodeBuffer(data);
          logContent += `[OUT] ${str}`;
          console.log(`[定时任务][${schedule.name}] ${str.trim()}`);
        });

        child.stderr?.on('data', (data) => {
          const str = this.decodeBuffer(data);
          logContent += `[ERR] ${str}`;
          console.error(`[定时任务][${schedule.name}] ${str.trim()}`);
        });

        child.on('close', async (code) => {
          schedule.status = 'active';
          logContent += `[${new Date().toISOString()}] 任务完成，退出码: ${code}\n`;
          try {
            await fs.writeFile(logFile, logContent, 'utf-8');
          } catch (e) {
            console.error(`[定时任务] 写入日志失败: ${e.message}`);
          }
          await this.saveTasks();
          console.log(`[定时任务] 完成: ${schedule.name}, 退出码: ${code}, 下次运行: ${new Date(schedule.nextRun).toLocaleString('zh-CN')}`);
        });

        child.on('error', async (error) => {
          schedule.status = 'active';
          logContent += `[${new Date().toISOString()}] 任务错误: ${error.message}\n`;
          try {
            await fs.writeFile(logFile, logContent, 'utf-8');
          } catch (e) {
            console.error(`[定时任务] 写入日志失败: ${e.message}`);
          }
          await this.saveTasks();
          console.error(`[定时任务] 错误: ${schedule.name}, ${error.message}`);
        });
      }

    } catch (error) {
      schedule.status = 'active';
      console.error(`[定时任务] 执行失败 ${id}:`, error);
    }
  }

  async runTask(id) {
    const task = this.tasks.get(id) || this.schedules.get(id);
    if (!task) {
      return { success: false, error: '任务不存在' };
    }

    const logFile = path.join(this.logsDir, `task-${id}-${Date.now()}.log`);
    
    return new Promise(async (resolve) => {
      try {
        if (task.taskType === 'ai' && this.aiTaskExecutor && task.prompt) {
          const result = await this.aiTaskExecutor.execute(task.prompt, task.name);
          await fs.writeFile(logFile, `AI任务执行结果:\n${JSON.stringify(result, null, 2)}`, 'utf-8');
          resolve(result);
        } else {
          const args = this.isWindows ? ['/c', task.command] : ['-c', task.command];
          const shell = this.isWindows ? 'cmd.exe' : '/bin/bash';
          
          const child = spawn(shell, args, {
            cwd: process.cwd(),
            shell: false
          });

          let output = '';
          let errorOutput = '';
          let logContent = `[${new Date().toISOString()}] 执行任务: ${task.name}\n`;
          logContent += `[${new Date().toISOString()}] 命令: ${task.command}\n`;

          child.stdout?.on('data', (data) => {
            const str = this.decodeBuffer(data);
            output += str;
            logContent += `[OUT] ${str}`;
          });

          child.stderr?.on('data', (data) => {
            const str = this.decodeBuffer(data);
            errorOutput += str;
            logContent += `[ERR] ${str}`;
          });

          child.on('close', async (code) => {
            logContent += `[${new Date().toISOString()}] 退出码: ${code}\n`;
            await fs.writeFile(logFile, logContent, 'utf-8');

            resolve({
              success: code === 0,
              exitCode: code,
              output,
              error: errorOutput,
              logFile
            });
          });

          child.on('error', async (error) => {
            logContent += `[${new Date().toISOString()}] 错误: ${error.message}\n`;
            await fs.writeFile(logFile, logContent, 'utf-8');
            resolve({ success: false, error: error.message });
          });
        }
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  async removeTask(id) {
    const task = this.tasks.get(id);
    if (task) {
      this.tasks.delete(id);
      await this.saveTasks();
      return { success: true, message: '任务已删除' };
    }

    const schedule = this.schedules.get(id);
    if (schedule) {
      if (schedule.timer) {
        clearInterval(schedule.timer);
      }
      this.schedules.delete(id);
      await this.saveTasks();
      console.log(`[定时任务] 已删除: ${schedule.name}`);
      return { success: true, message: '定时任务已删除' };
    }

    return { success: false, error: '任务不存在' };
  }

  async pauseSchedule(id) {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return { success: false, error: '定时任务不存在' };
    }

    if (schedule.timer) {
      clearInterval(schedule.timer);
      schedule.timer = null;
    }
    schedule.status = 'paused';
    await this.saveTasks();
    console.log(`[定时任务] 已暂停: ${schedule.name}`);

    return { success: true, message: '定时任务已暂停' };
  }

  async resumeSchedule(id) {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      return { success: false, error: '定时任务不存在' };
    }

    schedule.status = 'active';
    schedule.nextRun = this.calculateNextRun(
      schedule.schedule.minute,
      schedule.schedule.hour,
      schedule.schedule.day
    );
    this.startScheduleTimer(id);
    await this.saveTasks();
    console.log(`[定时任务] 已恢复: ${schedule.name}, 下次运行: ${new Date(schedule.nextRun).toLocaleString('zh-CN')}`);

    return { success: true, message: '定时任务已恢复' };
  }

  listTasks() {
    const tasks = [];
    const schedules = [];

    for (const [id, task] of this.tasks) {
      tasks.push({ id, ...task });
    }

    for (const [id, schedule] of this.schedules) {
      const { timer, ...scheduleInfo } = schedule;
      schedules.push({ id, ...scheduleInfo });
    }

    return {
      success: true,
      tasks,
      schedules,
      total: tasks.length + schedules.length
    };
  }

  async getTaskLogs(id) {
    try {
      const files = await fs.readdir(this.logsDir);
      const taskLogs = files.filter(f => f.startsWith(`task-${id}`));
      
      return {
        success: true,
        logs: taskLogs.map(f => path.join(this.logsDir, f))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async cleanCompleted() {
    const completed = [];
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
        completed.push(id);
      }
    }

    return { success: true, cleaned: completed.length };
  }
}

export default TaskScheduler;
