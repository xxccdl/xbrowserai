import puppeteer from 'puppeteer';
import { existsSync } from 'fs';

class BrowserController {
  constructor() {
    this.browser = null;
    this.pages = [];
    this.currentPageIndex = 0;
  }

  findChromePath() {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`
    ];

    for (const chromePath of possiblePaths) {
      if (chromePath && existsSync(chromePath)) {
        return chromePath;
      }
    }
    return null;
  }

  async launch(headless = false) {
    const launchOptions = {
      headless,
      defaultViewport: null,
      args: [
        '--start-maximized',
        // 禁用GPU加速，减少资源占用
        '--disable-gpu',
        // 禁用软件光栅化
        '--disable-software-rasterizer',
        // 禁用扩展
        '--disable-extensions',
        // 禁用后台网络
        '--disable-background-networking',
        // 禁用后台定时器节流
        '--disable-background-timer-throttling',
        // 禁用后台模式
        '--disable-background-mode',
        // 禁用默认应用
        '--disable-default-apps',
        // 禁用挂起监视器
        '--disable-hang-monitor',
        // 禁用弹出窗口阻止
        '--disable-popup-blocking',
        // 禁用提示
        '--disable-prompt-on-repost',
        // 禁用同步
        '--disable-sync',
        // 禁用翻译
        '--disable-translate',
        // 禁用Web安全（仅用于测试）
        // '--disable-web-security',
        // 减少内存使用
        '--js-flags=--max-old-space-size=2048',
        // 减少磁盘缓存
        '--disk-cache-size=104857600',
        // 媒体缓存大小
        '--media-cache-size=52428800',
        // 无沙盒（在某些环境需要）
        '--no-sandbox',
        // 无第一运行
        '--no-first-run',
        // 无默认浏览器检查
        '--no-default-browser-check',
        // 密码存储为none
        '--password-store=basic',
        // 使用模拟键盘
        '--use-mock-keychain',
        // 启用简单缓存后端
        '--enable-simple-cache-backend',
        // 禁用平滑滚动（提高性能）
        '--disable-smooth-scrolling',
        // 禁用动画
        '--disable-features=Animation',
        // 禁用合成
        '--disable-composited-antialiasing'
      ]
    };

    const chromePath = this.findChromePath();
    if (chromePath) {
      launchOptions.executablePath = chromePath;
    }

    try {
      this.browser = await puppeteer.launch(launchOptions);
    } catch (error) {
      delete launchOptions.executablePath;
      this.browser = await puppeteer.launch(launchOptions);
    }

    this.pages = await this.browser.pages();
    if (this.pages.length === 0) {
      this.pages.push(await this.browser.newPage());
    }
    this.currentPageIndex = 0;
    return this.browser;
  }

  async goto(url, options = {}) {
    const page = this.getCurrentPage();
    const { 
      waitUntil = 'domcontentloaded',
      timeout = 30000
    } = options;

    try {
      const startTime = Date.now();
      await page.goto(url, { 
        waitUntil, 
        timeout 
      });
      const loadTime = Date.now() - startTime;

      const title = await page.title();
      return { 
        success: true, 
        title, 
        url,
        loadTime: `${loadTime}ms`
      };
    } catch (error) {
      // 如果失败，尝试更宽松的策略
      try {
        await page.goto(url, { 
          waitUntil: 'load', 
          timeout: 20000 
        });
        const title = await page.title();
        return { 
          success: true, 
          title, 
          url,
          warning: '使用备用加载策略'
        };
      } catch (fallbackError) {
        return { 
          success: false, 
          error: error.message,
          url 
        };
      }
    }
  }

  async scrollToTop() {
    const page = this.getCurrentPage();
    await page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom() {
    const page = this.getCurrentPage();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async scrollBy(pixels) {
    const page = this.getCurrentPage();
    await page.evaluate((p) => window.scrollBy(0, p), pixels);
  }

  async waitForMilliseconds(ms) {
    const page = this.getCurrentPage();
    await page.waitForTimeout(ms);
  }

  async newPage() {
    const page = await this.browser.newPage();
    this.pages.push(page);
    this.currentPageIndex = this.pages.length - 1;
    return page;
  }

  async switchToPage(index) {
    if (index >= 0 && index < this.pages.length) {
      this.currentPageIndex = index;
      await this.pages[index].bringToFront();
      return true;
    }
    return false;
  }

  async closePage(index) {
    if (index >= 0 && index < this.pages.length && this.pages.length > 1) {
      await this.pages[index].close();
      this.pages.splice(index, 1);
      if (this.currentPageIndex >= this.pages.length) {
        this.currentPageIndex = this.pages.length - 1;
      }
      return true;
    }
    return false;
  }

  async goBack() {
    const page = this.getCurrentPage();
    await page.goBack({ waitUntil: 'networkidle2' });
  }

  async goForward() {
    const page = this.getCurrentPage();
    await page.goForward({ waitUntil: 'networkidle2' });
  }

  async refresh() {
    const page = this.getCurrentPage();
    await page.reload({ waitUntil: 'networkidle2' });
  }

  async waitForNavigation(timeout = 30000) {
    const page = this.getCurrentPage();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
  }

  async waitForSelector(selector, timeout = 30000) {
    const page = this.getCurrentPage();
    await page.waitForSelector(selector, { timeout });
  }

  async waitForFunction(fn, options = {}) {
    const page = this.getCurrentPage();
    await page.waitForFunction(fn, options);
  }

  getCurrentPage() {
    return this.pages[this.currentPageIndex];
  }

  async getPageInfo() {
    const page = this.getCurrentPage();
    return {
      title: await page.title(),
      url: page.url(),
      pageCount: this.pages.length,
      currentIndex: this.currentPageIndex
    };
  }

  async screenshot(options = {}) {
    const page = this.getCurrentPage();
    const buffer = await page.screenshot(options);
    return buffer;
  }

  async getPageContent() {
    const page = this.getCurrentPage();
    return await page.evaluate(() => {
      const result = {
        pageTitle: document.title,
        pageUrl: window.location.href,
        textContent: document.body.innerText,
        clickableElements: []
      };

      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'input[type="button"]:not([disabled])',
        'input[type="submit"]:not([disabled])',
        'input[type="reset"]:not([disabled])',
        '[role="button"]:not([disabled])',
        '[onclick]',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'input:not([type="hidden"]):not([disabled])'
      ];

      const elements = new Set();
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!elements.has(el)) {
            elements.add(el);
            const tagName = el.tagName.toLowerCase();
            const text = el.textContent?.trim() || '';
            const href = el.href || '';
            const id = el.id || '';
            const classes = el.className || '';
            
            let cssSelector = tagName;
            if (id) cssSelector += `#${id}`;
            if (classes) {
              const classList = classes.split(' ').filter(c => c);
              if (classList.length > 0) {
                cssSelector += `.${classList.slice(0, 3).join('.')}`;
              }
            }
            
            result.clickableElements.push({
              tag: tagName,
              text: text.substring(0, 100),
              href: href,
              id: id,
              classes: classes,
              selector: cssSelector
            });
          }
        });
      });

      result.clickableElements = result.clickableElements.slice(0, 100);

      return result;
    });
  }

  async evaluate(fn, ...args) {
    const page = this.getCurrentPage();
    return await page.evaluate(fn, ...args);
  }

  async downloadFile(url, savePath) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }
      
      const buffer = await response.arrayBuffer();
      await fs.writeFile(savePath, Buffer.from(buffer));
      
      return { success: true, result: `文件已下载到: ${savePath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.pages = [];
      this.currentPageIndex = 0;
    }
  }
}

export default BrowserController;
