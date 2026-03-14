import 'dotenv/config';
import BrowserController from './src/controllers/BrowserController.js';
import ElementController from './src/controllers/ElementController.js';

console.log('=' .repeat(60));
console.log('       xbrowserai - 浏览器功能测试');
console.log('=' .repeat(60));
console.log();

async function demo() {
  const browser = new BrowserController();
  const element = new ElementController(browser);

  try {
    console.log('🚀 正在启动浏览器...');
    await browser.launch(false);

    console.log();
    console.log('🌐 正在访问 example.com...');
    await browser.goto('https://example.com');

    console.log();
    console.log('📄 获取页面标题...');
    const title = await element.getText('h1');
    console.log('   标题:', title);

    console.log();
    console.log('🔗 获取所有链接...');
    const links = await element.getAllLinks();
    console.log('   找到', links.length, '个链接');
    links.forEach((link, i) => {
      console.log(`   ${i + 1}. ${link.text} - ${link.href}`);
    });

    console.log();
    console.log('✅ 浏览器功能正常！');
    console.log();
    console.log('按 Ctrl+C 退出，或等待5秒后自动关闭...');

    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    console.log();
    console.log('👋 正在关闭浏览器...');
    await browser.close();
  }
}

demo();
