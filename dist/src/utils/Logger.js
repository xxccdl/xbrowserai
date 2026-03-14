import fs from 'fs/promises';
import path from 'path';

class Logger {
  constructor(logDir = './logs') {
    this.logDir = logDir;
    this.sessionId = Date.now();
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };
    this.minLevel = this.levels.INFO;
  }

  async ensureLogDir() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let msg = `[${timestamp}] [${level}] ${message}`;
    if (data !== null) {
      msg += `\n${JSON.stringify(data, null, 2)}`;
    }
    return msg;
  }

  async log(level, message, data = null) {
    const levelNum = this.levels[level] || this.levels.INFO;
    if (levelNum < this.minLevel) return;

    const formattedMessage = this.formatMessage(level, message, data);
    
    await this.ensureLogDir();
    const logFile = path.join(this.logDir, `${this.sessionId}.log`);
    await fs.appendFile(logFile, formattedMessage + '\n', 'utf-8');
  }

  async debug(message, data = null) {
    await this.log('DEBUG', message, data);
  }

  async info(message, data = null) {
    await this.log('INFO', message, data);
  }

  async warn(message, data = null) {
    await this.log('WARN', message, data);
  }

  async error(message, data = null) {
    await this.log('ERROR', message, data);
  }

  async exportLog(filename = null) {
    await this.ensureLogDir();
    const logFile = path.join(this.logDir, `${this.sessionId}.log`);
    const content = await fs.readFile(logFile, 'utf-8');
    
    if (filename) {
      const exportPath = path.join(this.logDir, filename);
      await fs.writeFile(exportPath, content, 'utf-8');
      return exportPath;
    }
    
    return content;
  }

  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.minLevel = this.levels[level];
    }
  }
}

export default Logger;
