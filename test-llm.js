import 'dotenv/config';
import LLMProvider from './src/ai/LLMProvider.js';

console.log('=' .repeat(60));
console.log('          LLM Provider 测试');
console.log('=' .repeat(60));
console.log();

try {
  console.log('🔧 初始化 LLMProvider...');
  const llm = new LLMProvider();
  
  console.log('✅ 初始化成功！');
  console.log('   Provider:', llm.provider);
  console.log('   Base URL:', llm.baseURL);
  console.log('   Model:', llm.model);
  console.log('   API Key:', llm.apiKey.substring(0, 10) + '...');
  console.log();
  
  console.log('💬 发送测试消息到 DeepSeek...');
  const result = await llm.chat([
    { role: 'user', content: '你好！请回复"测试成功"三个字' }
  ], { max_tokens: 50 });
  
  if (result.success) {
    console.log('✅ LLM 调用成功！');
    console.log('   回复:', result.content);
    console.log();
    console.log('🎉 一切正常！可以运行 npm run dev 了！');
  } else {
    console.log('❌ LLM 调用失败:', result.error);
  }
} catch (error) {
  console.log('❌ 错误:', error);
}

console.log();
console.log('=' .repeat(60));
