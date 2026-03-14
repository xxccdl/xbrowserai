#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('📦 开始打包 xbrowserai...\n');

try {
  console.log('🔨 步骤 1: 构建项目...');
  execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
  console.log('✅ 构建完成\n');
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}

const distDir = path.join(projectRoot, 'dist');
const packageName = `xbrowserai-v1.0.0-${new Date().toISOString().slice(0, 10)}.zip`;
const outputPath = path.join(projectRoot, packageName);

console.log('📁 步骤 2: 创建压缩包...');
console.log(`   输出文件: ${packageName}`);

const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('close', () => {
  const fileSize = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`\n✅ 打包完成！`);
  console.log(`📦 文件: ${packageName}`);
  console.log(`📊 大小: ${fileSize} MB`);
  console.log(`📍 位置: ${outputPath}`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ ', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

if (fs.existsSync(distDir)) {
  archive.directory(distDir, false);
  console.log('   ✅ 添加 dist 目录');
}

if (fs.existsSync(path.join(projectRoot, 'README.md'))) {
  archive.file(path.join(projectRoot, 'README.md'), { name: 'README.md' });
  console.log('   ✅ 添加 README.md');
}

if (fs.existsSync(path.join(projectRoot, '.env.example'))) {
  archive.file(path.join(projectRoot, '.env.example'), { name: '.env.example' });
  console.log('   ✅ 添加 .env.example');
}

archive.finalize();
