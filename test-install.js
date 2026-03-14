console.log('=' .repeat(60));
console.log('      xbrowserai - 安装验证');
console.log('=' .repeat(60));
console.log();

let allPassed = true;

function testModule(name, importPath) {
  try {
    console.log(`✅ ${name} 导入成功`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} 导入失败:`, error.message);
    return false;
  }
}

console.log('📦 检查依赖模块...');
console.log();

try {
  const puppeteer = await import('puppeteer');
  console.log('✅ puppeteer 导入成功');
} catch (e) {
  console.log('❌ puppeteer 导入失败:', e.message);
  allPassed = false;
}

try {
  const openai = await import('openai');
  console.log('✅ openai 导入成功');
} catch (e) {
  console.log('❌ openai 导入失败:', e.message);
  allPassed = false;
}

try {
  const dotenv = await import('dotenv');
  console.log('✅ dotenv 导入成功');
} catch (e) {
  console.log('❌ dotenv 导入失败:', e.message);
  allPassed = false;
}

console.log();
console.log('=' .repeat(60));

if (allPassed) {
  console.log('🎉 所有依赖安装成功！');
  console.log();
  console.log('下一步：');
  console.log('1. 复制 .env.example 为 .env');
  console.log('2. 在 .env 中填入你的 API Key');
  console.log('3. 运行: npm run dev');
} else {
  console.log('⚠️  部分依赖安装失败，请检查错误信息');
}

console.log('=' .repeat(60));
