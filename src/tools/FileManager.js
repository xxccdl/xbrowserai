import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'glob';
const { glob } = pkg;

class FileManager {
  constructor(basePath = process.cwd()) {
    this.basePath = basePath;
    this.maxFileSize = 50 * 1024 * 1024;
  }

  resolvePath(filePath) {
    try {
      const resolved = path.resolve(this.basePath, filePath);
      const normalized = path.normalize(resolved);
      
      if (!normalized.startsWith(path.resolve(this.basePath))) {
        throw new Error('路径超出允许范围');
      }
      
      return normalized;
    } catch (error) {
      throw new Error(`路径解析失败: ${error.message}`);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  sanitizePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('路径必须是有效的字符串');
    }
    return filePath.trim();
  }

  async createFile(filePath, content = '') {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = this.resolvePath(safePath);
      const dir = path.dirname(fullPath);
      
      await fs.mkdir(dir, { recursive: true });
      
      const contentStr = String(content || '');
      if (contentStr.length > this.maxFileSize) {
        return { success: false, error: '文件内容过大，超过50MB限制' };
      }
      
      await fs.writeFile(fullPath, contentStr, 'utf-8');
      return { success: true, path: fullPath, message: '文件创建成功' };
    } catch (error) {
      return { success: false, error: `创建文件失败: ${error.message}` };
    }
  }

  async readFile(filePath, encoding = 'utf-8') {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = this.resolvePath(safePath);
      
      const stats = await fs.stat(fullPath);
      if (stats.size > this.maxFileSize) {
        return { success: false, error: '文件过大，超过50MB限制' };
      }
      
      const content = await fs.readFile(fullPath, encoding);
      return { success: true, content, path: fullPath, size: stats.size };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: false, error: '文件不存在' };
      }
      if (error.code === 'EACCES') {
        return { success: false, error: '没有权限读取该文件' };
      }
      return { success: false, error: `读取文件失败: ${error.message}` };
    }
  }

  async readFileLines(filePath, startLine = 0, endLine = null) {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = this.resolvePath(safePath);
      
      const stats = await fs.stat(fullPath);
      if (stats.size > this.maxFileSize) {
        return { success: false, error: '文件过大，超过50MB限制' };
      }
      
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      const start = Math.max(0, startLine || 0);
      const end = endLine !== null ? Math.min(lines.length, endLine) : lines.length;
      
      const selectedLines = lines.slice(start, end);
      return { 
        success: true, 
        lines: selectedLines, 
        totalLines: lines.length,
        path: fullPath,
        startLine: start,
        endLine: end
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: false, error: '文件不存在' };
      }
      return { success: false, error: `读取文件失败: ${error.message}` };
    }
  }

  async writeFile(filePath, content) {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = this.resolvePath(safePath);
      const dir = path.dirname(fullPath);
      
      await fs.mkdir(dir, { recursive: true });
      
      const contentStr = String(content || '');
      if (contentStr.length > this.maxFileSize) {
        return { success: false, error: '文件内容过大，超过50MB限制' };
      }
      
      await fs.writeFile(fullPath, contentStr, 'utf-8');
      return { success: true, path: fullPath, message: '文件写入成功' };
    } catch (error) {
      if (error.code === 'EACCES') {
        return { success: false, error: '没有权限写入该文件' };
      }
      return { success: false, error: `写入文件失败: ${error.message}` };
    }
  }

  async appendFile(filePath, content) {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = this.resolvePath(safePath);
      const dir = path.dirname(fullPath);
      
      await fs.mkdir(dir, { recursive: true });
      
      const contentStr = String(content || '');
      
      const exists = await this.fileExists(safePath);
      if (exists) {
        const stats = await fs.stat(fullPath);
        if (stats.size + contentStr.length > this.maxFileSize) {
          return { success: false, error: '追加后文件将超过50MB限制' };
        }
      }
      
      await fs.appendFile(fullPath, contentStr, 'utf-8');
      return { success: true, path: fullPath, message: '内容追加成功' };
    } catch (error) {
      if (error.code === 'EACCES') {
        return { success: false, error: '没有权限写入该文件' };
      }
      return { success: false, error: `追加内容失败: ${error.message}` };
    }
  }

  async deleteFile(filePath) {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = this.resolvePath(safePath);
      
      const exists = await this.fileExists(safePath);
      if (!exists) {
        return { success: true, path: fullPath, message: '文件不存在，无需删除' };
      }
      
      await fs.unlink(fullPath);
      return { success: true, path: fullPath, message: '文件删除成功' };
    } catch (error) {
      if (error.code === 'EACCES') {
        return { success: false, error: '没有权限删除该文件' };
      }
      return { success: false, error: `删除文件失败: ${error.message}` };
    }
  }

  async createDir(dirPath, recursive = true) {
    try {
      const safePath = this.sanitizePath(dirPath);
      const fullPath = this.resolvePath(safePath);
      
      const exists = await this.fileExists(safePath);
      if (exists) {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          return { success: true, path: fullPath, message: '目录已存在' };
        } else {
          return { success: false, error: '路径已存在但不是目录' };
        }
      }
      
      await fs.mkdir(fullPath, { recursive });
      return { success: true, path: fullPath, message: '目录创建成功' };
    } catch (error) {
      if (error.code === 'EACCES') {
        return { success: false, error: '没有权限创建目录' };
      }
      return { success: false, error: `创建目录失败: ${error.message}` };
    }
  }

  async deleteDir(dirPath, recursive = true) {
    try {
      const safePath = this.sanitizePath(dirPath);
      const fullPath = this.resolvePath(safePath);
      
      const exists = await this.fileExists(safePath);
      if (!exists) {
        return { success: true, path: fullPath, message: '目录不存在，无需删除' };
      }
      
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        return { success: false, error: '路径不是目录' };
      }
      
      await fs.rm(fullPath, { recursive, force: true });
      return { success: true, path: fullPath, message: '目录删除成功' };
    } catch (error) {
      if (error.code === 'EACCES') {
        return { success: false, error: '没有权限删除目录' };
      }
      return { success: false, error: `删除目录失败: ${error.message}` };
    }
  }

  async listDir(dirPath = '.', options = {}) {
    try {
      const safePath = this.sanitizePath(dirPath);
      const fullPath = this.resolvePath(safePath);
      const { recursive = false, includeHidden = false, maxDepth = 1 } = options;
      
      const exists = await this.fileExists(safePath);
      if (!exists) {
        return { success: false, error: '目录不存在' };
      }
      
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        return { success: false, error: '路径不是目录' };
      }
      
      if (recursive) {
        const entries = await glob('**/*', { 
          cwd: fullPath, 
          dot: includeHidden,
          absolute: true,
          maxDepth: maxDepth
        });
        return { success: true, entries, count: entries.length, path: fullPath };
      }
      
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const filtered = includeHidden ? entries : entries.filter(e => !e.name.startsWith('.'));
      
      return { 
        success: true, 
        entries: filtered.map(entry => ({
          name: entry.name,
          isFile: entry.isFile(),
          isDirectory: entry.isDirectory(),
          isSymbolicLink: entry.isSymbolicLink()
        })),
        count: filtered.length,
        path: fullPath
      };
    } catch (error) {
      if (error.code === 'EACCES') {
        return { success: false, error: '没有权限读取目录' };
      }
      return { success: false, error: `列出目录失败: ${error.message}` };
    }
  }

  async copyFile(srcPath, destPath) {
    try {
      const srcSafePath = this.sanitizePath(srcPath);
      const destSafePath = this.sanitizePath(destPath);
      
      const srcFullPath = this.resolvePath(srcSafePath);
      const destFullPath = this.resolvePath(destSafePath);
      
      const srcExists = await this.fileExists(srcSafePath);
      if (!srcExists) {
        return { success: false, error: '源文件不存在' };
      }
      
      const srcStats = await fs.stat(srcFullPath);
      if (!srcStats.isFile()) {
        return { success: false, error: '源路径不是文件' };
      }
      
      const destDir = path.dirname(destFullPath);
      await fs.mkdir(destDir, { recursive: true });
      
      await fs.copyFile(srcFullPath, destFullPath);
      return { success: true, src: srcFullPath, dest: destFullPath, message: '文件复制成功' };
    } catch (error) {
      return { success: false, error: `复制文件失败: ${error.message}` };
    }
  }

  async copyDir(srcPath, destPath) {
    try {
      const srcSafePath = this.sanitizePath(srcPath);
      const destSafePath = this.sanitizePath(destPath);
      
      const srcFullPath = this.resolvePath(srcSafePath);
      const destFullPath = this.resolvePath(destSafePath);
      
      const srcExists = await this.fileExists(srcSafePath);
      if (!srcExists) {
        return { success: false, error: '源目录不存在' };
      }
      
      const srcStats = await fs.stat(srcFullPath);
      if (!srcStats.isDirectory()) {
        return { success: false, error: '源路径不是目录' };
      }
      
      await fs.mkdir(destFullPath, { recursive: true });
      const entries = await fs.readdir(srcFullPath, { withFileTypes: true });
      
      let copiedCount = 0;
      for (const entry of entries) {
        const srcEntry = path.join(srcFullPath, entry.name);
        const destEntry = path.join(destFullPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDir(srcEntry, destEntry);
        } else {
          await fs.copyFile(srcEntry, destEntry);
        }
        copiedCount++;
      }
      
      return { success: true, src: srcFullPath, dest: destFullPath, copiedCount, message: '目录复制成功' };
    } catch (error) {
      return { success: false, error: `复制目录失败: ${error.message}` };
    }
  }

  async moveFile(srcPath, destPath) {
    try {
      const srcSafePath = this.sanitizePath(srcPath);
      const destSafePath = this.sanitizePath(destPath);
      
      const srcFullPath = this.resolvePath(srcSafePath);
      const destFullPath = this.resolvePath(destSafePath);
      
      const srcExists = await this.fileExists(srcSafePath);
      if (!srcExists) {
        return { success: false, error: '源文件不存在' };
      }
      
      const destDir = path.dirname(destFullPath);
      await fs.mkdir(destDir, { recursive: true });
      
      await fs.rename(srcFullPath, destFullPath);
      return { success: true, src: srcFullPath, dest: destFullPath, message: '文件移动成功' };
    } catch (error) {
      if (error.code === 'EXDEV') {
        try {
          await this.copyFile(srcPath, destPath);
          await this.deleteFile(srcPath);
          return { success: true, message: '文件跨设备移动成功' };
        } catch (copyError) {
          return { success: false, error: `跨设备移动失败: ${copyError.message}` };
        }
      }
      return { success: false, error: `移动文件失败: ${error.message}` };
    }
  }

  async renameFile(oldPath, newPath) {
    return await this.moveFile(oldPath, newPath);
  }

  async getFileStats(filePath) {
    try {
      const safePath = this.sanitizePath(filePath);
      const fullPath = this.resolvePath(safePath);
      
      const stats = await fs.stat(fullPath);
      return {
        success: true,
        stats: {
          size: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          accessedAt: stats.atime,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          isSymbolicLink: stats.isSymbolicLink()
        },
        path: fullPath
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: false, error: '文件不存在' };
      }
      return { success: false, error: `获取文件信息失败: ${error.message}` };
    }
  }

  async searchFiles(pattern, dirPath = '.') {
    try {
      const safePath = this.sanitizePath(dirPath);
      const fullPath = this.resolvePath(safePath);
      
      const files = await glob(pattern, { cwd: fullPath, absolute: true, nodir: true });
      return { success: true, files, count: files.length };
    } catch (error) {
      return { success: false, error: `搜索文件失败: ${error.message}` };
    }
  }

  async searchInFiles(query, dirPath = '.', filePattern = '*') {
    try {
      const safePath = this.sanitizePath(dirPath);
      const fullPath = this.resolvePath(safePath);
      
      const files = await glob(filePattern, { cwd: fullPath, absolute: true, nodir: true });
      const results = [];
      const maxFiles = 100;
      const processedFiles = Math.min(files.length, maxFiles);
      
      for (let i = 0; i < processedFiles; i++) {
        const file = files[i];
        try {
          const stats = await fs.stat(file);
          if (stats.size > this.maxFileSize) continue;
          
          const content = await fs.readFile(file, 'utf-8');
          if (content.includes(query)) {
            const lines = content.split('\n');
            const matches = [];
            lines.forEach((line, index) => {
              if (line.includes(query)) {
                matches.push({ line: index + 1, content: line.trim() });
              }
            });
            if (matches.length > 0) {
              results.push({ file, matches, matchCount: matches.length });
            }
          }
        } catch {
        }
      }
      
      return { 
        success: true, 
        results, 
        count: results.length,
        scannedFiles: processedFiles,
        totalFiles: files.length
      };
    } catch (error) {
      return { success: false, error: `搜索内容失败: ${error.message}` };
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async readJson(filePath) {
    try {
      const result = await this.readFile(filePath);
      if (!result.success) return result;
      
      try {
        const data = JSON.parse(result.content);
        return { success: true, data };
      } catch (parseError) {
        return { success: false, error: `JSON解析失败: ${parseError.message}` };
      }
    } catch (error) {
      return { success: false, error: `读取JSON文件失败: ${error.message}` };
    }
  }

  async writeJson(filePath, data, pretty = true) {
    try {
      const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      return await this.writeFile(filePath, content);
    } catch (error) {
      return { success: false, error: `写入JSON文件失败: ${error.message}` };
    }
  }

  async appendJson(filePath, data) {
    try {
      const result = await this.readJson(filePath);
      let existingData = [];
      
      if (result.success && Array.isArray(result.data)) {
        existingData = result.data;
      }
      
      existingData.push(data);
      return await this.writeJson(filePath, existingData);
    } catch (error) {
      return { success: false, error: `追加JSON数据失败: ${error.message}` };
    }
  }

  async streamCopy(srcPath, destPath) {
    try {
      const srcSafePath = this.sanitizePath(srcPath);
      const destSafePath = this.sanitizePath(destPath);
      
      const srcFullPath = this.resolvePath(srcSafePath);
      const destFullPath = this.resolvePath(destSafePath);
      
      const srcExists = await this.fileExists(srcSafePath);
      if (!srcExists) {
        return { success: false, error: '源文件不存在' };
      }
      
      const destDir = path.dirname(destFullPath);
      await fs.mkdir(destDir, { recursive: true });
      
      await pipeline(
        createReadStream(srcFullPath),
        createWriteStream(destFullPath)
      );
      
      return { success: true, src: srcFullPath, dest: destFullPath, message: '流式复制成功' };
    } catch (error) {
      return { success: false, error: `流式复制失败: ${error.message}` };
    }
  }
}

export default FileManager;
