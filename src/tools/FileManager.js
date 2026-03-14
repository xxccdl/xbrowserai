import fs from 'fs/promises';
import path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import pkg from 'glob';
const { glob } = pkg;

class FileManager {
  constructor(basePath = process.cwd()) {
    this.basePath = basePath;
  }

  resolvePath(filePath) {
    return path.resolve(this.basePath, filePath);
  }

  async fileExists(filePath) {
    try {
      await fs.access(this.resolvePath(filePath));
      return true;
    } catch {
      return false;
    }
  }

  async createFile(filePath, content = '') {
    const fullPath = this.resolvePath(filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return { success: true, path: fullPath };
  }

  async readFile(filePath, encoding = 'utf-8') {
    try {
      const fullPath = this.resolvePath(filePath);
      const content = await fs.readFile(fullPath, encoding);
      return { success: true, content, path: fullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async readFileLines(filePath, startLine = 0, endLine = null) {
    try {
      const fullPath = this.resolvePath(filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');
      const selectedLines = lines.slice(startLine, endLine || lines.length);
      return { 
        success: true, 
        lines: selectedLines, 
        totalLines: lines.length,
        path: fullPath 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async writeFile(filePath, content) {
    try {
      const fullPath = this.resolvePath(filePath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      return { success: true, path: fullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async appendFile(filePath, content) {
    try {
      const fullPath = this.resolvePath(filePath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(fullPath, content, 'utf-8');
      return { success: true, path: fullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteFile(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
      await fs.unlink(fullPath);
      return { success: true, path: fullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createDir(dirPath, recursive = true) {
    try {
      const fullPath = this.resolvePath(dirPath);
      await fs.mkdir(fullPath, { recursive });
      return { success: true, path: fullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteDir(dirPath, recursive = true) {
    try {
      const fullPath = this.resolvePath(dirPath);
      await fs.rm(fullPath, { recursive, force: true });
      return { success: true, path: fullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listDir(dirPath = '.', options = {}) {
    try {
      const fullPath = this.resolvePath(dirPath);
      const { recursive = false, includeHidden = false } = options;
      
      if (recursive) {
        const entries = await glob('**/*', { 
          cwd: fullPath, 
          dot: includeHidden,
          absolute: true 
        });
        return { success: true, entries };
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
        path: fullPath
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async copyFile(srcPath, destPath) {
    try {
      const srcFullPath = this.resolvePath(srcPath);
      const destFullPath = this.resolvePath(destPath);
      const destDir = path.dirname(destFullPath);
      await fs.mkdir(destDir, { recursive: true });
      await fs.copyFile(srcFullPath, destFullPath);
      return { success: true, src: srcFullPath, dest: destFullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async copyDir(srcPath, destPath) {
    try {
      const srcFullPath = this.resolvePath(srcPath);
      const destFullPath = this.resolvePath(destPath);
      
      await fs.mkdir(destFullPath, { recursive: true });
      const entries = await fs.readdir(srcFullPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcEntry = path.join(srcFullPath, entry.name);
        const destEntry = path.join(destFullPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDir(srcEntry, destEntry);
        } else {
          await fs.copyFile(srcEntry, destEntry);
        }
      }
      
      return { success: true, src: srcFullPath, dest: destFullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async moveFile(srcPath, destPath) {
    try {
      const srcFullPath = this.resolvePath(srcPath);
      const destFullPath = this.resolvePath(destPath);
      const destDir = path.dirname(destFullPath);
      await fs.mkdir(destDir, { recursive: true });
      await fs.rename(srcFullPath, destFullPath);
      return { success: true, src: srcFullPath, dest: destFullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async renameFile(oldPath, newPath) {
    return await this.moveFile(oldPath, newPath);
  }

  async getFileStats(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
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
      return { success: false, error: error.message };
    }
  }

  async searchFiles(pattern, dirPath = '.') {
    try {
      const fullPath = this.resolvePath(dirPath);
      const files = await glob(pattern, { cwd: fullPath, absolute: true });
      return { success: true, files, count: files.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async searchInFiles(query, dirPath = '.', filePattern = '*') {
    try {
      const fullPath = this.resolvePath(dirPath);
      const files = await glob(filePattern, { cwd: fullPath, absolute: true, nodir: true });
      const results = [];
      
      for (const file of files) {
        try {
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
              results.push({ file, matches });
            }
          }
        } catch {
          // 跳过无法读取的文件
        }
      }
      
      return { success: true, results, count: results.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getDiskUsage(dirPath = '.') {
    try {
      const fullPath = this.resolvePath(dirPath);
      const stats = await fs.stat(fullPath);
      
      if (!stats.isDirectory()) {
        return { success: false, error: '路径不是目录' };
      }

      let totalSize = 0;
      let fileCount = 0;
      let dirCount = 0;

      const calculateSize = async (currentPath) => {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const entryPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            dirCount++;
            await calculateSize(entryPath);
          } else {
            fileCount++;
            const fileStats = await fs.stat(entryPath);
            totalSize += fileStats.size;
          }
        }
      };

      await calculateSize(fullPath);

      return {
        success: true,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        fileCount,
        dirCount,
        path: fullPath
      };
    } catch (error) {
      return { success: false, error: error.message };
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
      return { success: true, data: JSON.parse(result.content) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async writeJson(filePath, data, pretty = true) {
    try {
      const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      return await this.writeFile(filePath, content);
    } catch (error) {
      return { success: false, error: error.message };
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
      return { success: false, error: error.message };
    }
  }

  async streamCopy(srcPath, destPath) {
    try {
      const srcFullPath = this.resolvePath(srcPath);
      const destFullPath = this.resolvePath(destPath);
      const destDir = path.dirname(destFullPath);
      
      await fs.mkdir(destDir, { recursive: true });
      
      await pipeline(
        createReadStream(srcFullPath),
        createWriteStream(destFullPath)
      );
      
      return { success: true, src: srcFullPath, dest: destFullPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default FileManager;
