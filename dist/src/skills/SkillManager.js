import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class SkillManager {
  constructor() {
    this.skills = new Map();
    this.skillsDir = path.join(process.cwd(), 'skills');
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await this.ensureSkillsDir();
    await this.loadAllSkills();
    this.initialized = true;
  }

  async ensureSkillsDir() {
    try {
      await fs.mkdir(this.skillsDir, { recursive: true });
    } catch (error) {
    }
  }

  registerSkill(name, skill) {
    this.skills.set(name, {
      name: skill.name || name,
      description: skill.description || '',
      triggers: skill.triggers || [],
      handler: skill.handler,
      enabled: skill.enabled !== false
    });
    return { success: true, message: `技能已注册: ${name}` };
  }

  unregisterSkill(name) {
    if (this.skills.has(name)) {
      this.skills.delete(name);
      const skillPath = path.join(this.skillsDir, `${name}.json`);
      fs.unlink(skillPath).catch(() => {});
      return { success: true, message: `技能已卸载: ${name}` };
    }
    return { success: false, error: `技能不存在: ${name}` };
  }

  enableSkill(name) {
    const skill = this.skills.get(name);
    if (skill) {
      skill.enabled = true;
      this.saveSkillState(name);
      return { success: true, message: `技能已启用: ${name}` };
    }
    return { success: false, error: `技能不存在: ${name}` };
  }

  disableSkill(name) {
    const skill = this.skills.get(name);
    if (skill) {
      skill.enabled = false;
      this.saveSkillState(name);
      return { success: true, message: `技能已禁用: ${name}` };
    }
    return { success: false, error: `技能不存在: ${name}` };
  }

  listSkills() {
    const skills = [];
    for (const [name, skill] of this.skills) {
      skills.push({
        name,
        description: skill.description,
        enabled: skill.enabled,
        triggers: skill.triggers
      });
    }
    return { success: true, skills, count: skills.length };
  }

  matchSkill(input) {
    const lowerInput = input.toLowerCase();
    
    for (const [name, skill] of this.skills) {
      if (!skill.enabled) continue;
      
      for (const trigger of skill.triggers) {
        if (lowerInput.includes(trigger.toLowerCase())) {
          return { matched: true, skill: name, skillData: skill };
        }
      }
      
      if (lowerInput.includes(name.toLowerCase())) {
        return { matched: true, skill: name, skillData: skill };
      }
    }
    
    return { matched: false };
  }

  async executeSkill(name, context) {
    const skill = this.skills.get(name);
    if (!skill) {
      return { success: false, error: `技能不存在: ${name}` };
    }
    
    if (!skill.enabled) {
      return { success: false, error: `技能已禁用: ${name}` };
    }
    
    try {
      const result = await skill.handler(context);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async saveSkill(name, skillData) {
    try {
      const skillPath = path.join(this.skillsDir, `${name}.json`);
      await fs.writeFile(skillPath, JSON.stringify(skillData, null, 2));
      return { success: true, path: skillPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async saveSkillState(name) {
    const skill = this.skills.get(name);
    if (!skill) return;
    try {
      const skillPath = path.join(this.skillsDir, `${name}.json`);
      const existing = await fs.readFile(skillPath, 'utf-8').catch(() => null);
      const data = existing ? JSON.parse(existing) : {};
      data.enabled = skill.enabled;
      data.updatedAt = new Date().toISOString();
      await fs.writeFile(skillPath, JSON.stringify(data, null, 2));
    } catch (error) {
    }
  }

  async loadSkill(name) {
    try {
      const skillPath = path.join(this.skillsDir, `${name}.json`);
      const content = await fs.readFile(skillPath, 'utf-8');
      return { success: true, data: JSON.parse(content) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadAllSkills() {
    try {
      const files = await fs.readdir(this.skillsDir);
      const loaded = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const name = path.basename(file, '.json');
          const result = await this.loadSkill(name);
          if (result.success) {
            this.registerSkill(name, {
              ...result.data,
              handler: async (context) => {
                const results = [];
                if (result.data.actions) {
                  for (const action of result.data.actions) {
                    results.push({ action, timestamp: new Date().toISOString() });
                  }
                }
                return { success: true, actions: results };
              }
            });
            loaded.push(name);
          }
        }
      }
      
      return { success: true, loaded, count: loaded.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createSkill(name, description, triggers, actions) {
    try {
      const skillData = {
        name,
        description,
        triggers: triggers || [name.toLowerCase()],
        actions,
        enabled: true,
        createdAt: new Date().toISOString(),
        type: 'ai-created'
      };

      const saveResult = await this.saveSkill(name, skillData);
      if (!saveResult.success) {
        return saveResult;
      }

      this.registerSkill(name, {
        ...skillData,
        handler: async (context) => {
          const results = [];
          for (const action of actions) {
            results.push({ action, timestamp: new Date().toISOString() });
          }
          return { success: true, actions: results };
        }
      });

      return {
        success: true,
        message: `技能 "${name}" 创建成功`,
        path: saveResult.path,
        skill: skillData
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateSkill(name, updates) {
    try {
      const loadResult = await this.loadSkill(name);
      if (!loadResult.success) {
        return loadResult;
      }

      const skillData = { ...loadResult.data, ...updates, updatedAt: new Date().toISOString() };
      
      const saveResult = await this.saveSkill(name, skillData);
      if (!saveResult.success) {
        return saveResult;
      }

      this.registerSkill(name, {
        ...skillData,
        handler: async (context) => {
          const results = [];
          if (skillData.actions) {
            for (const action of skillData.actions) {
              results.push({ action, timestamp: new Date().toISOString() });
            }
          }
          return { success: true, actions: results };
        }
      });

      return {
        success: true,
        message: `技能 "${name}" 更新成功`,
        skill: skillData
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getSkillDetail(name) {
    const skill = this.skills.get(name);
    if (!skill) {
      return { success: false, error: `技能不存在: ${name}` };
    }

    return {
      success: true,
      skill: {
        name: skill.name,
        description: skill.description,
        triggers: skill.triggers,
        enabled: skill.enabled
      }
    };
  }
}

export default SkillManager;
