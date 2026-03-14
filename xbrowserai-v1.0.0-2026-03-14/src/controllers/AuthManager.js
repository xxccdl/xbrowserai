import fs from 'fs/promises';
import path from 'path';

class AuthManager {
  constructor(browserController) {
    this.browser = browserController;
    this.authDir = path.join(process.cwd(), 'auth');
    this.ensureAuthDir();
  }

  async ensureAuthDir() {
    try {
      await fs.mkdir(this.authDir, { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  }

  async saveLoginState(siteName) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      // 获取当前页面的 cookies、localStorage 和 sessionStorage
      const state = await page.evaluate(() => {
        return {
          url: window.location.href,
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage }
        };
      });

      // 获取 cookies
      const cookies = await page.cookies();

      const authData = {
        siteName,
        url: state.url,
        timestamp: new Date().toISOString(),
        cookies,
        localStorage: state.localStorage,
        sessionStorage: state.sessionStorage
      };

      // 保存到文件
      const authFile = path.join(this.authDir, `${siteName}.json`);
      await fs.writeFile(authFile, JSON.stringify(authData, null, 2));

      return { 
        success: true, 
        message: `登录状态已保存: ${siteName}`,
        path: authFile,
        url: state.url
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async restoreLoginState(siteName) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const authFile = path.join(this.authDir, `${siteName}.json`);
      
      // 检查文件是否存在
      try {
        await fs.access(authFile);
      } catch {
        return { success: false, error: `未找到登录状态: ${siteName}` };
      }

      // 读取登录状态
      const authData = JSON.parse(await fs.readFile(authFile, 'utf-8'));

      // 导航到保存的 URL
      await page.goto(authData.url, { waitUntil: 'networkidle2' });

      // 恢复 cookies
      if (authData.cookies && authData.cookies.length > 0) {
        for (const cookie of authData.cookies) {
          try {
            await page.setCookie(cookie);
          } catch (e) {
            // 忽略设置失败的 cookie
          }
        }
      }

      // 恢复 localStorage
      if (authData.localStorage) {
        await page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value);
          }
        }, authData.localStorage);
      }

      // 恢复 sessionStorage
      if (authData.sessionStorage) {
        await page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            sessionStorage.setItem(key, value);
          }
        }, authData.sessionStorage);
      }

      // 刷新页面以应用状态
      await page.reload({ waitUntil: 'networkidle2' });

      return { 
        success: true, 
        message: `登录状态已恢复: ${siteName}`,
        url: authData.url,
        timestamp: authData.timestamp
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listSavedLogins() {
    try {
      const files = await fs.readdir(this.authDir);
      const logins = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.authDir, file), 'utf-8');
            const data = JSON.parse(content);
            logins.push({
              siteName: data.siteName,
              url: data.url,
              timestamp: data.timestamp,
              file: file
            });
          } catch (e) {
            // 忽略解析失败的文件
          }
        }
      }

      return { success: true, logins };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteLoginState(siteName) {
    try {
      const authFile = path.join(this.authDir, `${siteName}.json`);
      await fs.unlink(authFile);
      return { success: true, message: `登录状态已删除: ${siteName}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async isLoggedIn(checkSelector = null) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      if (checkSelector) {
        const element = await page.$(checkSelector);
        return { 
          success: true, 
          isLoggedIn: !!element,
          selector: checkSelector
        };
      }

      // 默认检查：查找常见的登录状态指示器
      const loginIndicators = [
        '.user-menu',
        '.user-profile',
        '.avatar',
        '[data-testid="user-menu"]',
        '.account-dropdown',
        '.logged-in',
        '.user-name',
        '.logout-button'
      ];

      for (const selector of loginIndicators) {
        const element = await page.$(selector);
        if (element) {
          return { 
            success: true, 
            isLoggedIn: true,
            indicator: selector
          };
        }
      }

      return { 
        success: true, 
        isLoggedIn: false
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async autoLogin(siteName, loginUrl, credentials, options = {}) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      const {
        usernameSelector = 'input[type="email"], input[name="username"], input[name="email"]',
        passwordSelector = 'input[type="password"]',
        submitSelector = 'button[type="submit"], input[type="submit"], .login-button',
        successSelector = null,
        waitTime = 3000
      } = options;

      // 首先尝试恢复登录状态
      const restoreResult = await this.restoreLoginState(siteName);
      if (restoreResult.success) {
        // 检查是否仍然登录
        const loginCheck = await this.isLoggedIn(successSelector);
        if (loginCheck.success && loginCheck.isLoggedIn) {
          return { 
            success: true, 
            message: '通过保存的状态自动登录成功',
            method: 'restored'
          };
        }
      }

      // 需要重新登录
      await page.goto(loginUrl, { waitUntil: 'networkidle2' });

      // 填写用户名
      await page.waitForSelector(usernameSelector);
      await page.type(usernameSelector, credentials.username);

      // 填写密码
      await page.waitForSelector(passwordSelector);
      await page.type(passwordSelector, credentials.password);

      // 点击登录按钮
      await page.click(submitSelector);

      // 等待登录完成
      await page.waitForTimeout(waitTime);

      // 检查登录是否成功
      if (successSelector) {
        try {
          await page.waitForSelector(successSelector, { timeout: 5000 });
        } catch {
          return { success: false, error: '登录可能失败，未找到成功指示器' };
        }
      }

      // 保存新的登录状态
      await this.saveLoginState(siteName);

      return { 
        success: true, 
        message: '登录成功并已保存状态',
        method: 'fresh'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default AuthManager;
