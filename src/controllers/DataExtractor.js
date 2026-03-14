class DataExtractor {
  constructor(browserController, elementController) {
    this.browser = browserController;
    this.element = elementController;
  }

  get page() {
    return this.browser.getCurrentPage();
  }

  async extractTable(selector) {
    console.log(`提取表格: ${selector}`);
    const data = await this.page.$$eval(selector, (tables) => {
      if (!tables || tables.length === 0) return null;
      
      const table = tables[0];
      const rows = Array.from(table.querySelectorAll('tr'));
      
      const result = [];
      let headers = [];
      
      rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const cellData = cells.map(cell => cell.textContent.trim());
        
        if (rowIndex === 0 && row.querySelector('th')) {
          headers = cellData;
        } else {
          if (headers.length > 0) {
            const rowObj = {};
            headers.forEach((header, index) => {
              rowObj[header] = cellData[index] || '';
            });
            result.push(rowObj);
          } else {
            result.push(cellData);
          }
        }
      });
      
      return { headers, data: result };
    });
    
    return data;
  }

  async extractList(selector) {
    console.log(`提取列表: ${selector}`);
    const items = await this.page.$$eval(selector, (elements) => {
      return elements.map(el => ({
        text: el.textContent.trim(),
        html: el.innerHTML,
        tagName: el.tagName
      }));
    });
    return items;
  }

  async extractLinks(selector = 'a') {
    console.log(`提取链接: ${selector}`);
    const links = await this.page.$$eval(selector, (anchors) => {
      return anchors.map(a => ({
        text: a.textContent.trim(),
        href: a.href,
        title: a.title || ''
      })).filter(link => link.href && link.href !== '');
    });
    return links;
  }

  async extractImages(selector = 'img') {
    console.log(`提取图片: ${selector}`);
    const images = await this.page.$$eval(selector, (imgs) => {
      return imgs.map(img => ({
        src: img.src,
        alt: img.alt || '',
        title: img.title || '',
        width: img.width,
        height: img.height
      })).filter(img => img.src);
    });
    return images;
  }

  async extractMetadata() {
    console.log('提取页面元数据');
    const metadata = await this.page.evaluate(() => {
      const getMeta = (name) => {
        const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return el ? el.getAttribute('content') : '';
      };
      
      return {
        title: document.title,
        url: window.location.href,
        description: getMeta('description'),
        keywords: getMeta('keywords'),
        author: getMeta('author'),
        ogTitle: getMeta('og:title'),
        ogDescription: getMeta('og:description'),
        ogImage: getMeta('og:image'),
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        charset: document.characterSet,
        lang: document.documentElement.lang
      };
    });
    return metadata;
  }

  async extractTextContent(selector = 'body') {
    console.log(`提取文本内容: ${selector}`);
    const text = await this.page.$eval(selector, (el) => {
      return el.innerText || el.textContent;
    });
    return text;
  }

  async extractByPattern(pattern, selector = 'body') {
    console.log(`按模式提取: ${pattern}`);
    const content = await this.extractTextContent(selector);
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex);
    return matches || [];
  }

  async extractEmails(selector = 'body') {
    console.log('提取邮箱地址');
    return await this.extractByPattern('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', selector);
  }

  async extractPhoneNumbers(selector = 'body') {
    console.log('提取电话号码');
    return await this.extractByPattern('(?:\\+?86)?1[3-9]\\d{9}|\\d{3,4}-\\d{7,8}', selector);
  }

  async extractUrls(selector = 'body') {
    console.log('提取URL');
    return await this.extractByPattern('https?://[^\\s<>"\']+', selector);
  }

  async extractJSONLD() {
    console.log('提取JSON-LD数据');
    const jsonLdData = await this.page.$$eval('script[type="application/ld+json"]', (scripts) => {
      return scripts.map(script => {
        try {
          return JSON.parse(script.textContent);
        } catch {
          return null;
        }
      }).filter(data => data !== null);
    });
    return jsonLdData;
  }

  async extractFormFields(selector = 'form') {
    console.log(`提取表单字段: ${selector}`);
    const forms = await this.page.$$eval(selector, (forms) => {
      return forms.map((form, index) => {
        const fields = Array.from(form.querySelectorAll('input, select, textarea'));
        return {
          formIndex: index,
          id: form.id || '',
          name: form.name || '',
          action: form.action || '',
          method: form.method || 'GET',
          fields: fields.map(field => ({
            tagName: field.tagName,
            type: field.type || 'text',
            name: field.name || '',
            id: field.id || '',
            value: field.value || '',
            placeholder: field.placeholder || '',
            required: field.required,
            disabled: field.disabled
          }))
        };
      });
    });
    return forms;
  }

  async scrollToBottom() {
    console.log('滚动到页面底部');
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.browser.waitForNavigation(1000);
  }

  async scrollToTop() {
    console.log('滚动到页面顶部');
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }

  async infiniteScroll(maxScrolls = 5, delay = 1000) {
    console.log(`无限滚动: 最多${maxScrolls}次`);
    let previousHeight;
    let scrollCount = 0;
    
    while (scrollCount < maxScrolls) {
      previousHeight = await this.page.evaluate('document.body.scrollHeight');
      await this.scrollToBottom();
      await this.browser.waitForNavigation(delay);
      
      const newHeight = await this.page.evaluate('document.body.scrollHeight');
      if (newHeight === previousHeight) break;
      
      scrollCount++;
    }
    
    console.log(`滚动完成: ${scrollCount}次`);
    return scrollCount;
  }

  async getAllElementsInfo(selector = '*') {
    console.log(`获取所有元素信息: ${selector}`);
    const elements = await this.page.$$eval(selector, (elements) => {
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        id: el.id || '',
        className: el.className || '',
        text: el.textContent?.trim().substring(0, 100) || '',
        xpath: (() => {
          if (!el) return '';
          let path = '';
          while (el && el.nodeType === Node.ELEMENT_NODE) {
            let index = 0;
            let sibling = el.previousSibling;
            while (sibling) {
              if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === el.tagName) {
                index++;
              }
              sibling = sibling.previousSibling;
            }
            const tagName = el.tagName.toLowerCase();
            const pathIndex = index > 0 ? `[${index + 1}]` : '';
            path = '/' + tagName + pathIndex + path;
            el = el.parentNode;
          }
          return path;
        })()
      }));
    });
    return elements;
  }
}

export default DataExtractor;
