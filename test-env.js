import 'dotenv/config';

console.log('=' .repeat(60));
console.log('       环境变量测试');
console.log('=' .repeat(60));
console.log();

console.log('📋 加载的环境变量:');
console.log('   AI_PROVIDER:', process.env.AI_PROVIDER);
console.log('   DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ 已设置' : '❌ 未设置');
console.log('   PUPPETEER_SKIP_DOWNLOAD:', process.env.PUPPETEER_SKIP_DOWNLOAD);
console.log();

if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here') {
  console.log('✅ DeepSeek API Key 加载成功！');
  console.log('   前10位:', process.env.DEEPSEEK_API_KEY.substring(0, 10) + '...');
} else {
  console.log('❌ DeepSeek API Key 未正确设置！');
}

console.log();
console.log('=' .repeat(60));
