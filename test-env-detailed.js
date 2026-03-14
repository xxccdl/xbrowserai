import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=' .repeat(70));
console.log('           超级详细环境变量测试');
console.log('=' .repeat(70));
console.log();

console.log('📍 项目目录:', __dirname);
console.log();

console.log('📖 1. 读取 .env 文件原始内容...');
try {
  const envPath = path.join(__dirname, '.env');
  const content = await fs.readFile(envPath, 'utf-8');
  console.log('✅ 读取成功！');
  console.log('   文件内容:');
  console.log('-' .repeat(70));
  console.log(content);
  console.log('-' .repeat(70));
  console.log();

  console.log('📋 2. 解析 .env 内容...');
  const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  console.log('   找到', lines.length, '行配置');
  
  const parsed = {};
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      parsed[key.trim()] = valueParts.join('=').trim();
      console.log(`   ${key.trim()} = ${valueParts.join('=').trim().substring(0, 30)}...`);
    }
  });
  console.log();

  console.log('🔧 3. 使用 dotenv 加载...');
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('✅ dotenv.config() 执行完成');
  console.log();

  console.log('🌍 4. 检查 process.env...');
  console.log('   AI_PROVIDER:', process.env.AI_PROVIDER);
  console.log('   DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 
    (process.env.DEEPSEEK_API_KEY.substring(0, 20) + '... (' + process.env.DEEPSEEK_API_KEY.length + ' chars)') : 
    '❌ 未设置');
  console.log('   Key 末尾:', process.env.DEEPSEEK_API_KEY ? 
    process.env.DEEPSEEK_API_KEY.slice(-10) : 'N/A');
  console.log();

  console.log('🤝 5. 对比...');
  console.log('   文件中的DEEPSEEK_API_KEY:', parsed.DEEPSEEK_API_KEY ? 
    parsed.DEEPSEEK_API_KEY.substring(0, 20) + '...' : 'N/A');
  console.log('   process.env.DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 
    process.env.DEEPSEEK_API_KEY.substring(0, 20) + '...' : 'N/A');
  console.log('   匹配?', parsed.DEEPSEEK_API_KEY === process.env.DEEPSEEK_API_KEY ? '✅ YES' : '❌ NO');
  console.log();

} catch (error) {
  console.error('❌ 错误:', error);
}

console.log('=' .repeat(70));
