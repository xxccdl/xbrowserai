#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const distDir = path.join(projectRoot, 'dist');

console.log('🔨 开始构建 xbrowserai...\n');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ 创建 dist 目录');
}

const copyFiles = [
  { src: 'src', dest: 'dist/src' },
  { src: 'bin', dest: 'dist/bin' },
  { src: 'package.json', dest: 'dist/package.json' },
  { src: 'README.md', dest: 'dist/README.md' },
  { src: '.env.example', dest: 'dist/.env.example' },
  { src: '.npmrc', dest: 'dist/.npmrc' }
];

console.log('📋 复制文件:');
copyFiles.forEach(({ src, dest }) => {
  const srcPath = path.join(projectRoot, src);
  const destPath = path.join(projectRoot, dest);
  
  if (fs.existsSync(srcPath)) {
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
      console.log(`   📁 ${src} -> ${dest}`);
    } else {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
      console.log(`   📄 ${src} -> ${dest}`);
    }
  }
});

// 确保 dist/package.json 有 type: module
const distPackageJsonPath = path.join(distDir, 'package.json');
if (fs.existsSync(distPackageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(distPackageJsonPath, 'utf-8'));
  packageJson.type = 'module';
  fs.writeFileSync(distPackageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('   ✅ 更新 package.json type: module');
}

console.log('\n✅ 构建完成！');
console.log(`📦 输出目录: ${distDir}`);

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
