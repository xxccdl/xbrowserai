import fs from 'fs/promises';
import path from 'path';

class ScreenshotManager {
  constructor(browserController) {
    this.browser = browserController;
  }

  async captureScreenshot(options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const {
        savePath,
        fullPage = false,
        selector = null,
        type = 'png',
        quality = 90
      } = options;

      let screenshotOptions = {
        type: type === 'jpeg' ? 'jpeg' : 'png',
        fullPage: fullPage
      };

      if (type === 'jpeg') {
        screenshotOptions.quality = quality;
      }

      // 如果指定了选择器，截取特定元素
      if (selector) {
        const element = await page.$(selector);
        if (!element) {
          return { success: false, error: `未找到元素: ${selector}` };
        }
        screenshotOptions.clip = await element.boundingBox();
      }

      const screenshot = await page.screenshot(screenshotOptions);

      // 保存文件
      if (savePath) {
        await fs.mkdir(path.dirname(savePath), { recursive: true });
        await fs.writeFile(savePath, screenshot);
        return { 
          success: true, 
          message: `截图已保存: ${savePath}`,
          path: savePath,
          size: screenshot.length
        };
      }

      return { 
        success: true, 
        buffer: screenshot,
        size: screenshot.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async captureFullPageScreenshot(savePath, options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const { type = 'png', quality = 90 } = options;

      // 获取页面完整高度
      const dimensions = await page.evaluate(() => {
        return {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight
        };
      });

      // 分段截图并合并
      const screenshots = [];
      const viewportHeight = dimensions.viewportHeight;
      const totalHeight = dimensions.height;
      let currentHeight = 0;

      while (currentHeight < totalHeight) {
        // 滚动到指定位置
        await page.evaluate((height) => {
          window.scrollTo(0, height);
        }, currentHeight);

        // 等待滚动完成
        await page.waitForTimeout(300);

        // 截图
        const screenshot = await page.screenshot({
          type: type === 'jpeg' ? 'jpeg' : 'png',
          clip: {
            x: 0,
            y: currentHeight,
            width: dimensions.width,
            height: Math.min(viewportHeight, totalHeight - currentHeight)
          }
        });

        screenshots.push({
          buffer: screenshot,
          y: currentHeight,
          height: Math.min(viewportHeight, totalHeight - currentHeight)
        });

        currentHeight += viewportHeight;
      }

      // 恢复滚动位置
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      // 保存第一张截图（简化版，实际应该合并）
      // 这里使用 Puppeteer 的原生 fullPage 功能
      const fullScreenshot = await page.screenshot({
        type: type === 'jpeg' ? 'jpeg' : 'png',
        fullPage: true
      });

      if (savePath) {
        await fs.mkdir(path.dirname(savePath), { recursive: true });
        await fs.writeFile(savePath, fullScreenshot);
        return { 
          success: true, 
          message: `完整页面截图已保存: ${savePath}`,
          path: savePath,
          size: fullScreenshot.length,
          dimensions: {
            width: dimensions.width,
            height: dimensions.height
          }
        };
      }

      return { 
        success: true, 
        buffer: fullScreenshot,
        size: fullScreenshot.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async captureElementScreenshot(selector, savePath, options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const element = await page.$(selector);
      if (!element) {
        return { success: false, error: `未找到元素: ${selector}` };
      }

      const { type = 'png', quality = 90 } = options;

      const screenshot = await element.screenshot({
        type: type === 'jpeg' ? 'jpeg' : 'png',
        ...(type === 'jpeg' && { quality })
      });

      if (savePath) {
        await fs.mkdir(path.dirname(savePath), { recursive: true });
        await fs.writeFile(savePath, screenshot);
        return { 
          success: true, 
          message: `元素截图已保存: ${savePath}`,
          path: savePath,
          size: screenshot.length,
          selector
        };
      }

      return { 
        success: true, 
        buffer: screenshot,
        size: screenshot.length,
        selector
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async capturePDF(savePath, options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const {
        format = 'A4',
        printBackground = true,
        margin = { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      } = options;

      const pdf = await page.pdf({
        format,
        printBackground,
        margin
      });

      if (savePath) {
        await fs.mkdir(path.dirname(savePath), { recursive: true });
        await fs.writeFile(savePath, pdf);
        return { 
          success: true, 
          message: `PDF已保存: ${savePath}`,
          path: savePath,
          size: pdf.length
        };
      }

      return { 
        success: true, 
        buffer: pdf,
        size: pdf.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async compareScreenshots(screenshot1Path, screenshot2Path) {
    try {
      // 简单的文件大小比较
      const [stat1, stat2] = await Promise.all([
        fs.stat(screenshot1Path),
        fs.stat(screenshot2Path)
      ]);

      const size1 = stat1.size;
      const size2 = stat2.size;
      const diff = Math.abs(size1 - size2);
      const percentDiff = (diff / Math.max(size1, size2)) * 100;

      return {
        success: true,
        comparison: {
          screenshot1: { path: screenshot1Path, size: size1 },
          screenshot2: { path: screenshot2Path, size: size2 },
          sizeDifference: diff,
          percentDifference: percentDiff.toFixed(2) + '%',
          isSimilar: percentDiff < 5 // 小于5%差异认为是相似的
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default ScreenshotManager;
