class CookieManager {
  constructor(browserController) {
    this.browser = browserController;
  }

  get page() {
    return this.browser.getCurrentPage();
  }

  async getAllCookies() {
    console.log('获取所有Cookie');
    const cookies = await this.page.cookies();
    return cookies;
  }

  async getCookie(name) {
    console.log(`获取Cookie: ${name}`);
    const cookies = await this.page.cookies();
    return cookies.find(c => c.name === name) || null;
  }

  async setCookie(cookie) {
    console.log(`设置Cookie: ${cookie.name}`);
    await this.page.setCookie(cookie);
    return true;
  }

  async setCookies(cookies) {
    console.log(`设置${cookies.length}个Cookie`);
    await this.page.setCookie(...cookies);
    return true;
  }

  async deleteCookie(name) {
    console.log(`删除Cookie: ${name}`);
    const cookies = await this.page.cookies();
    const cookieToDelete = cookies.find(c => c.name === name);
    if (cookieToDelete) {
      await this.page.deleteCookie({ name, url: cookieToDelete.url });
      return true;
    }
    return false;
  }

  async deleteAllCookies() {
    console.log('删除所有Cookie');
    const client = await this.page.createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.detach();
    return true;
  }

  async exportCookies(filePath) {
    console.log(`导出Cookie到: ${filePath}`);
    const cookies = await this.getAllCookies();
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, JSON.stringify(cookies, null, 2), 'utf-8');
    return cookies;
  }

  async importCookies(filePath) {
    console.log(`从文件导入Cookie: ${filePath}`);
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const cookies = JSON.parse(content);
    await this.setCookies(cookies);
    return cookies;
  }

  async getSessionStorage() {
    console.log('获取Session Storage');
    const data = await this.page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        items[key] = sessionStorage.getItem(key);
      }
      return items;
    });
    return data;
  }

  async getLocalStorage() {
    console.log('获取Local Storage');
    const data = await this.page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    return data;
  }

  async setLocalStorage(key, value) {
    console.log(`设置Local Storage: ${key}`);
    await this.page.evaluate((k, v) => {
      localStorage.setItem(k, v);
    }, key, value);
    return true;
  }

  async clearLocalStorage() {
    console.log('清除Local Storage');
    await this.page.evaluate(() => {
      localStorage.clear();
    });
    return true;
  }

  async clearSessionStorage() {
    console.log('清除Session Storage');
    await this.page.evaluate(() => {
      sessionStorage.clear();
    });
    return true;
  }

  async clearAllStorage() {
    console.log('清除所有存储');
    await this.deleteAllCookies();
    await this.clearLocalStorage();
    await this.clearSessionStorage();
    return true;
  }
}

export default CookieManager;
