import TaskScheduler from '../tools/TaskScheduler.js';

class TaskSchedulerSkill {
  constructor(taskScheduler) {
    this.scheduler = taskScheduler;
    this.name = '定时任务';
    this.description = '创建和管理定时任务，支持一次性任务和周期性任务';
    this.triggers = ['定时', '任务', 'schedule', 'task', '定时器', 'cron'];
    this.enabled = true;
  }

  getHandler() {
    return {
      name: this.name,
      description: this.description,
      triggers: this.triggers,
      enabled: this.enabled,
      handler: async (context) => {
        const { action, params } = context;
        
        switch (action) {
          case 'add':
            return await this.addTask(params);
          case 'schedule':
            return await this.addSchedule(params);
          case 'list':
            return this.scheduler.listTasks();
          case 'run':
            return await this.scheduler.runTask(params.id);
          case 'pause':
            return await this.scheduler.pauseSchedule(params.id);
          case 'resume':
            return await this.scheduler.resumeSchedule(params.id);
          case 'remove':
            return await this.scheduler.removeTask(params.id);
          case 'logs':
            return await this.scheduler.getTaskLogs(params.id);
          case 'clean':
            return await this.scheduler.cleanCompleted();
          default:
            return { success: false, error: '未知的定时任务操作' };
        }
      }
    };
  }

  async addTask(params) {
    const { name, command, options = {} } = params;
    return await this.scheduler.addTask(name, command, options);
  }

  async addSchedule(params) {
    const { name, command, schedule, options = {} } = params;
    // schedule 格式: "*/5" (每5分钟), "0 */1" (每小时), "0 0 *" (每天)
    return await this.scheduler.addSchedule(name, command, schedule, options);
  }

  // 工具函数：解析自然语言时间
  parseScheduleExpression(text) {
    const patterns = [
      { regex: /每(\d+)分钟/, schedule: (n) => `*/${n}` },
      { regex: /每(\d+)小时/, schedule: (n) => `0 */${n} *` },
      { regex: /每天(\d+)点/, schedule: (n) => `0 ${n} *` },
      { regex: /每天/, schedule: () => `0 0 *` },
      { regex: /每小时/, schedule: () => `0 */1 *` },
      { regex: /每分钟/, schedule: () => `*/1` }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const num = match[1] ? parseInt(match[1]) : 1;
        return pattern.schedule(num);
      }
    }

    return null;
  }
}

export default TaskSchedulerSkill;
