class SmartWait {
  constructor(browserController) {
    this.browser = browserController;
  }

  async waitForPageLoad(options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const {
        timeout = 30000,
        waitForNetwork = true,
        waitForDOM = true
      } = options;

      const startTime = Date.now();
      let loadState = {
        domContentLoaded: false,
        load: false,
        networkIdle: false
      };

      // 等待 DOMContentLoaded
      if (waitForDOM) {
        try {
          await page.waitForFunction(() => {
            return document.readyState === 'interactive' || document.readyState === 'complete';
          }, { timeout });
          loadState.domContentLoaded = true;
        } catch (e) {
          // 超时继续
        }
      }

      // 等待 load 事件
      try {
        await page.waitForFunction(() => {
          return document.readyState === 'complete';
        }, { timeout: timeout - (Date.now() - startTime) });
        loadState.load = true;
      } catch (e) {
        // 超时继续
      }

      // 等待网络空闲
      if (waitForNetwork) {
        try {
          await page.waitForNetworkIdle({ 
            idleTime: 500, 
            timeout: timeout - (Date.now() - startTime) 
          });
          loadState.networkIdle = true;
        } catch (e) {
          // 超时继续
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        loadState,
        duration,
        message: `页面加载完成，耗时 ${duration}ms`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async waitForElement(selector, options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const {
        timeout = 10000,
        visible = true,
        hidden = false
      } = options;

      const startTime = Date.now();

      if (hidden) {
        await page.waitForSelector(selector, { 
          hidden: true, 
          timeout 
        });
      } else if (visible) {
        await page.waitForSelector(selector, { 
          visible: true, 
          timeout 
        });
      } else {
        await page.waitForSelector(selector, { timeout });
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        selector,
        duration,
        message: `元素已出现，耗时 ${duration}ms`
      };
    } catch (error) {
      return { 
        success: false, 
        error: `等待元素超时: ${selector}`,
        selector
      };
    }
  }

  async waitForText(text, options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const { timeout = 10000, selector = 'body' } = options;

      const startTime = Date.now();

      await page.waitForFunction(
        (searchText, searchSelector) => {
          const element = document.querySelector(searchSelector);
          if (!element) return false;
          return element.textContent.includes(searchText);
        },
        { timeout },
        text,
        selector
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        text,
        selector,
        duration,
        message: `文本已出现，耗时 ${duration}ms`
      };
    } catch (error) {
      return { 
        success: false, 
        error: `等待文本超时: ${text}`,
        text
      };
    }
  }

  async waitForNavigation(options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const { timeout = 30000, waitUntil = 'networkidle2' } = options;

      const startTime = Date.now();

      await page.waitForNavigation({ 
        waitUntil, 
        timeout 
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        duration,
        message: `页面导航完成，耗时 ${duration}ms`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async waitForFunction(fn, options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const { timeout = 10000, args = [] } = options;

      const startTime = Date.now();

      await page.waitForFunction(fn, { timeout }, ...args);

      const duration = Date.now() - startTime;

      return {
        success: true,
        duration,
        message: `条件已满足，耗时 ${duration}ms`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async waitForImages(options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const { timeout = 30000 } = options;

      const startTime = Date.now();

      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img');
        for (const img of images) {
          if (!img.complete) return false;
        }
        return true;
      }, { timeout });

      const duration = Date.now() - startTime;

      return {
        success: true,
        duration,
        message: `所有图片加载完成，耗时 ${duration}ms`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async waitForStable(options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const { 
        timeout = 30000, 
        checkInterval = 500,
        stabilityThreshold = 3 
      } = options;

      const startTime = Date.now();
      let stableCount = 0;
      let lastDOMState = '';

      while (Date.now() - startTime < timeout) {
        const currentDOMState = await page.evaluate(() => {
          return document.body.innerHTML.length;
        });

        if (currentDOMState === lastDOMState) {
          stableCount++;
          if (stableCount >= stabilityThreshold) {
            const duration = Date.now() - startTime;
            return {
              success: true,
              duration,
              message: `页面已稳定，耗时 ${duration}ms`
            };
          }
        } else {
          stableCount = 0;
          lastDOMState = currentDOMState;
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }

      return { 
        success: false, 
        error: '等待页面稳定超时' 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async smartWaitForLoad(options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const startTime = Date.now();
      const results = [];

      // 1. 等待页面基本加载
      const pageLoadResult = await this.waitForPageLoad({
        timeout: options.timeout || 30000
      });
      results.push({ step: 'pageLoad', ...pageLoadResult });

      // 2. 等待图片加载
      const imagesResult = await this.waitForImages({
        timeout: 10000
      });
      results.push({ step: 'images', ...imagesResult });

      // 3. 等待页面稳定
      const stableResult = await this.waitForStable({
        timeout: 10000,
        stabilityThreshold: 2
      });
      results.push({ step: 'stable', ...stableResult });

      const duration = Date.now() - startTime;

      return {
        success: true,
        duration,
        results,
        message: `智能等待完成，总耗时 ${duration}ms`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default SmartWait;
