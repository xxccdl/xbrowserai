class ElementController {
  constructor(browserController) {
    this.browserController = browserController;
  }

  get page() {
    return this.browserController.getCurrentPage();
  }

  async safeElementOperation(selector, operation, operationName) {
    try {
      const element = await this.page.$(selector);
      if (!element) {
        console.log(`[警告] 未找到元素: ${selector}`);
        return {
          success: false,
          error: `未找到元素: ${selector}`,
          selector: selector
        };
      }

      const result = await operation(element);
      console.log(`[成功] ${operationName}: ${selector}`);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      console.log(`[失败] ${operationName}: ${selector} - ${error.message}`);
      return {
        success: false,
        error: error.message,
        selector: selector
      };
    }
  }

  async findElement(selector) {
    const element = await this.page.$(selector);
    if (element) {
      console.log(`找到元素: ${selector}`);
    } else {
      console.log(`未找到元素: ${selector}`);
    }
    return element;
  }

  async findElements(selector) {
    const elements = await this.page.$$(selector);
    console.log(`找到 ${elements.length} 个元素: ${selector}`);
    return elements;
  }

  async findElementByXPath(xpath) {
    const elements = await this.page.$x(xpath);
    if (elements.length > 0) {
      console.log(`通过XPath找到元素: ${xpath}`);
      return elements[0];
    }
    console.log(`未通过XPath找到元素: ${xpath}`);
    return null;
  }

  async click(selector, options = {}) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click(options);
        return true;
      },
      '点击元素'
    );
  }

  async clickElement(element, options = {}) {
    await element.click(options);
    return true;
  }

  async type(selector, text, options = {}) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.type(text, options);
        return true;
      },
      '输入文本'
    );
  }

  async fill(selector, text) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.fill(text);
        return true;
      },
      '填充文本'
    );
  }

  async clear(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('A');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');
        return true;
      },
      '清除内容'
    );
  }

  async select(selector, value) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await this.page.select(selector, value);
        return true;
      },
      '选择选项'
    );
  }

  async check(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await this.page.check(selector);
        return true;
      },
      '勾选元素'
    );
  }

  async uncheck(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await this.page.uncheck(selector);
        return true;
      },
      '取消勾选'
    );
  }

  async hover(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.hover();
        return true;
      },
      '悬停元素'
    );
  }

  async focus(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.focus();
        return true;
      },
      '聚焦元素'
    );
  }

  async dragAndDrop(sourceSelector, targetSelector) {
    console.log(`拖拽 ${sourceSelector} 到 ${targetSelector}`);
    const source = await this.findElement(sourceSelector);
    const target = await this.findElement(targetSelector);
    
    if (source && target) {
      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();
      
      if (sourceBox && targetBox) {
        await this.page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
        await this.page.mouse.down();
        await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
        await this.page.mouse.up();
        console.log('拖拽完成');
        return { success: true };
      }
    }
    return { success: false, error: '源或目标元素未找到' };
  }

  async getText(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        const text = await element.evaluate(el => el.textContent);
        console.log(`${selector} 的文本: ${text}`);
        return text;
      },
      '获取文本'
    );
  }

  async getAttribute(selector, attribute) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        const value = await element.evaluate((el, attr) => el.getAttribute(attr), attribute);
        console.log(`${selector} 的 ${attribute}: ${value}`);
        return value;
      },
      '获取属性'
    );
  }

  async getInnerHTML(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        return await element.evaluate(el => el.innerHTML);
      },
      '获取HTML'
    );
  }

  async isVisible(selector) {
    const element = await this.findElement(selector);
    if (!element) return { success: false, visible: false };
    const box = await element.boundingBox();
    return { success: true, visible: box !== null };
  }

  async isEnabled(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        return await element.evaluate(el => !el.disabled);
      },
      '检查启用状态'
    );
  }

  async scrollTo(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.evaluate(el => el.scrollIntoView({ behavior: 'smooth' }));
        return true;
      },
      '滚动到元素'
    );
  }

  async takeElementScreenshot(selector, options = {}) {
    const element = await this.findElement(selector);
    if (element) {
      return { success: true, result: await element.screenshot(options) };
    }
    return { success: false, error: '元素未找到' };
  }

  async getAllLinks() {
    try {
      const links = await this.page.$$eval('a', anchors => {
        return anchors.map(a => ({
          text: a.textContent.trim(),
          href: a.href
        })).filter(link => link.href);
      });
      return { success: true, result: links };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllButtons() {
    try {
      const buttons = await this.page.$$eval('button, input[type="button"], input[type="submit"]', btns => {
        return btns.map(btn => ({
          text: btn.textContent?.trim() || btn.value || '',
          tag: btn.tagName,
          type: btn.type
        }));
      });
      return { success: true, result: buttons };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllInputs() {
    try {
      const inputs = await this.page.$$eval('input, textarea, select', fields => {
        return fields.map(field => ({
          tag: field.tagName,
          type: field.type || 'text',
          name: field.name || '',
          id: field.id || '',
          placeholder: field.placeholder || ''
        }));
      });
      return { success: true, result: inputs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async clickByText(text, tagName = '*') {
    try {
      const priorityTags = ['button', 'a', 'input[type="submit"]', 'input[type="button"]'];
      
      const matchElement = (elText, searchText) => {
        const elTextTrim = elText.trim();
        const searchLower = searchText.toLowerCase();
        const elTextLower = elTextTrim.toLowerCase();
        
        if (elTextTrim === searchText) return 4;
        if (elTextLower === searchLower) return 3;
        if (elTextTrim.includes(searchText)) return 2;
        if (elTextLower.includes(searchLower)) return 1;
        return 0;
      };
      
      for (const priorityTag of priorityTags) {
        const selector = tagName === '*' ? priorityTag : `${tagName}${priorityTag.includes('[') ? '' : ',' + priorityTag}`;
        
        try {
          const elements = await this.page.$$(selector);
          
          let bestMatch = null;
          let bestScore = 0;
          let bestElement = null;
          
          for (const el of elements) {
            try {
              const isVisible = await el.isVisible().catch(() => false);
              if (!isVisible) continue;
              
              const elText = await el.evaluate(e => e.textContent).catch(() => '');
              const score = matchElement(elText, text);
              
              if (score > bestScore) {
                bestScore = score;
                bestMatch = elText;
                bestElement = el;
              }
            } catch (e) {
              continue;
            }
          }
          
          if (bestElement) {
            const tag = await bestElement.evaluate(e => e.tagName).catch(() => 'UNKNOWN');
            const elText = (bestMatch || '').trim();
            await bestElement.click().catch(async () => {
              await this.page.evaluate((el) => el.click(), bestElement).catch(() => {});
            });
            console.log(`[成功] 点击 ${tag}: ${elText.substring(0, 50)}`);
            return { success: true, result: `点击了 ${tag} 元素: "${elText.substring(0, 50)}${elText.length > 50 ? '...' : ''}"` };
          }
        } catch (e) {
          continue;
        }
      }
      
      try {
        const allElements = await this.page.$$(tagName);
        
        let bestMatch = null;
        let bestScore = 0;
        let bestElement = null;
        
        for (const el of allElements) {
          try {
            const isVisible = await el.isVisible().catch(() => false);
            if (!isVisible) continue;
            
            const elText = await el.evaluate(e => e.textContent).catch(() => '');
            const score = matchElement(elText, text);
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = elText;
              bestElement = el;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (bestElement) {
          const tag = await bestElement.evaluate(e => e.tagName).catch(() => 'UNKNOWN');
          const elText = (bestMatch || '').trim();
          await bestElement.click().catch(async () => {
            await this.page.evaluate((el) => el.click(), bestElement).catch(() => {});
          });
          console.log(`[成功] 点击 ${tag}: ${elText.substring(0, 50)}`);
          return { success: true, result: `点击了 ${tag} 元素: "${elText.substring(0, 50)}${elText.length > 50 ? '...' : ''}"` };
        }
      } catch (e) {
      }
      
      return { success: false, error: `未找到包含文本 "${text}" 的元素` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async findElementByText(text, tagName = '*') {
    try {
      const priorityTags = ['button', 'a', 'input[type="submit"]', 'input[type="button"]'];
      
      const matchElement = (elText, searchText) => {
        const elTextTrim = elText.trim();
        const searchLower = searchText.toLowerCase();
        const elTextLower = elTextTrim.toLowerCase();
        
        if (elTextTrim === searchText) return 4;
        if (elTextLower === searchLower) return 3;
        if (elTextTrim.includes(searchText)) return 2;
        if (elTextLower.includes(searchLower)) return 1;
        return 0;
      };
      
      for (const priorityTag of priorityTags) {
        const selector = tagName === '*' ? priorityTag : `${tagName}${priorityTag.includes('[') ? '' : ',' + priorityTag}`;
        
        try {
          const elements = await this.page.$$(selector);
          
          let bestMatch = null;
          let bestScore = 0;
          let bestElement = null;
          
          for (const el of elements) {
            try {
              const isVisible = await el.isVisible().catch(() => false);
              if (!isVisible) continue;
              
              const elText = await el.evaluate(e => e.textContent).catch(() => '');
              const score = matchElement(elText, text);
              
              if (score > bestScore) {
                bestScore = score;
                bestMatch = elText;
                bestElement = el;
              }
            } catch (e) {
              continue;
            }
          }
          
          if (bestElement) {
            const tag = await bestElement.evaluate(e => e.tagName).catch(() => 'UNKNOWN');
            const elText = (bestMatch || '').trim();
            console.log(`[成功] 找到 ${tag}: ${elText.substring(0, 50)}`);
            return { 
              success: true, 
              result: { tag, text: elText.substring(0, 100) }
            };
          }
        } catch (e) {
          continue;
        }
      }
      
      try {
        const allElements = await this.page.$$(tagName);
        
        let bestMatch = null;
        let bestScore = 0;
        let bestElement = null;
        
        for (const el of allElements) {
          try {
            const isVisible = await el.isVisible().catch(() => false);
            if (!isVisible) continue;
            
            const elText = await el.evaluate(e => e.textContent).catch(() => '');
            const score = matchElement(elText, text);
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = elText;
              bestElement = el;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (bestElement) {
          const tag = await bestElement.evaluate(e => e.tagName).catch(() => 'UNKNOWN');
          const elText = (bestMatch || '').trim();
          console.log(`[成功] 找到 ${tag}: ${elText.substring(0, 50)}`);
          return { 
            success: true, 
            result: { tag, text: elText.substring(0, 100) }
          };
        }
      } catch (e) {
      }
      
      return { success: false, error: `未找到包含文本 "${text}" 的元素` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async pressKey(selector, key, options = {}) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.press(key, options);
        return true;
      },
      `按键: ${key}`
    );
  }

  async pressEnter(selector) {
    return await this.pressKey(selector, 'Enter');
  }

  async pressTab(selector) {
    return await this.pressKey(selector, 'Tab');
  }

  async pressEscape(selector) {
    return await this.pressKey(selector, 'Escape');
  }

  async pressSpace(selector) {
    return await this.pressKey(selector, 'Space');
  }

  async pressArrowDown(selector) {
    return await this.pressKey(selector, 'ArrowDown');
  }

  async pressArrowUp(selector) {
    return await this.pressKey(selector, 'ArrowUp');
  }

  async pressArrowLeft(selector) {
    return await this.pressKey(selector, 'ArrowLeft');
  }

  async pressArrowRight(selector) {
    return await this.pressKey(selector, 'ArrowRight');
  }

  async pressBackspace(selector) {
    return await this.pressKey(selector, 'Backspace');
  }

  async pressDelete(selector) {
    return await this.pressKey(selector, 'Delete');
  }

  async pressHome(selector) {
    return await this.pressKey(selector, 'Home');
  }

  async pressEnd(selector) {
    return await this.pressKey(selector, 'End');
  }

  async pressPageUp(selector) {
    return await this.pressKey(selector, 'PageUp');
  }

  async pressPageDown(selector) {
    return await this.pressKey(selector, 'PageDown');
  }

  async pressCtrlA(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('A');
        await this.page.keyboard.up('Control');
        return true;
      },
      '全选 (Ctrl+A)'
    );
  }

  async pressCtrlC(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('C');
        await this.page.keyboard.up('Control');
        return true;
      },
      '复制 (Ctrl+C)'
    );
  }

  async pressCtrlV(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('V');
        await this.page.keyboard.up('Control');
        return true;
      },
      '粘贴 (Ctrl+V)'
    );
  }

  async pressCtrlX(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('X');
        await this.page.keyboard.up('Control');
        return true;
      },
      '剪切 (Ctrl+X)'
    );
  }

  async pressCtrlZ(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('Z');
        await this.page.keyboard.up('Control');
        return true;
      },
      '撤销 (Ctrl+Z)'
    );
  }

  async pressCtrlY(selector) {
    return await this.safeElementOperation(
      selector,
      async (element) => {
        await element.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('Y');
        await this.page.keyboard.up('Control');
        return true;
      },
      '重做 (Ctrl+Y)'
    );
  }

  async pressF5(selector) {
    return await this.pressKey(selector, 'F5');
  }

  async pressF12(selector) {
    return await this.pressKey(selector, 'F12');
  }
}

export default ElementController;
