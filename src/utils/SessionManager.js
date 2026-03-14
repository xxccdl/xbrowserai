import fs from 'fs/promises';
import path from 'path';

class SessionManager {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.sessionFile = path.join(this.dataDir, 'session.json');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.ensureDataDir();
    this.initialized = true;
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
    }
  }

  async saveSession(conversationHistory, extra = {}) {
    try {
      const sessionData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        conversationHistory: conversationHistory,
        ...extra
      };
      await fs.writeFile(this.sessionFile, JSON.stringify(sessionData, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadSession() {
    try {
      const content = await fs.readFile(this.sessionFile, 'utf-8');
      const sessionData = JSON.parse(content);
      return { success: true, data: sessionData };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: false, error: '无会话数据' };
      }
      return { success: false, error: error.message };
    }
  }

  async saveConversationHistory(history) {
    return await this.saveSession(history);
  }

  async loadConversationHistory() {
    const result = await this.loadSession();
    if (result.success && result.data && result.data.conversationHistory) {
      return { success: true, history: result.data.conversationHistory };
    }
    return { success: false, error: result.error || '无会话历史' };
  }

  async clearSession() {
    try {
      await fs.unlink(this.sessionFile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async exportSession(filePath) {
    try {
      const content = await fs.readFile(this.sessionFile, 'utf-8');
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async importSession(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(this.sessionFile, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default SessionManager;
