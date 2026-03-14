import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class LLMProvider {
  constructor(config = {}) {
    this.envConfig = this.loadEnvFromFile();
    
    this.provider = config.provider || this.envConfig.AI_PROVIDER || 'deepseek';
    this.apiKey = config.apiKey || this.getDefaultApiKey();
    this.baseURL = config.baseURL || this.getDefaultBaseURL();
    this.model = config.model || this.getDefaultModel();
    

    
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseURL,
      dangerouslyAllowBrowser: false
    });
  }

  loadEnvFromFile() {
    try {
      const envPath = path.join(__dirname, '../../.env');
      const content = fs.readFileSync(envPath, 'utf-8');
      
      const config = {};
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex > 0) {
            const key = trimmed.substring(0, eqIndex).trim();
            const value = trimmed.substring(eqIndex + 1).trim();
            config[key] = value;
          }
        }
      }
      

      return config;
    } catch (error) {
      console.warn('⚠️  无法直接读取 .env，回退到 process.env');
      return process.env;
    }
  }

  getDefaultApiKey() {
    if (this.provider === 'deepseek') {
      return this.envConfig.DEEPSEEK_API_KEY;
    }
    return this.envConfig.OPENAI_API_KEY;
  }

  getDefaultBaseURL() {
    if (this.provider === 'deepseek') {
      return 'https://api.deepseek.com/v1';
    }
    return 'https://api.openai.com/v1';
  }

  getDefaultModel() {
    if (this.provider === 'deepseek') {
      return 'deepseek-chat';
    }
    return 'gpt-4';
  }

  async chat(messages, options = {}) {
    try {
      const completion = await this.client.chat.completions.create({
      model: options.model || this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 4000,
      stream: options.stream || false,
      ...options
    });

      return {
        success: true,
        message: completion.choices[0].message,
        usage: completion.usage
      };
    } catch (error) {
      console.error('LLM调用失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async chatStream(messages, options = {}, onChunk) {
    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 4000,
        stream: true,
        ...options
      });

      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        if (onChunk) {
          onChunk(content);
        }
      }

      return {
        success: true,
        content: fullContent
      };
    } catch (error) {
      console.error('LLM流式调用失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default LLMProvider;
