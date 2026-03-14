class DialogHandler {
  constructor(browserController) {
    this.browser = browserController;
    this.dialogHistory = [];
    this.autoHandleEnabled = false;
    this.defaultAction = 'accept'; // 'accept' | 'dismiss'
    this.dialogListener = null;
  }

  async enableAutoHandle(action = 'accept', promptText = '') {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      this.autoHandleEnabled = true;
      this.defaultAction = action;

      // 移除旧的监听器
      if (this.dialogListener) {
        page.off('dialog', this.dialogListener);
      }

      // 设置新的监听器
      this.dialogListener = async (dialog) => {
        const dialogInfo = {
          type: dialog.type(),
          message: dialog.message(),
          defaultValue: dialog.defaultValue(),
          url: page.url(),
          timestamp: new Date().toISOString()
        };

        this.dialogHistory.push(dialogInfo);

        console.log(`[弹窗] ${dialog.type()}: ${dialog.message()}`);

        try {
          if (dialog.type() === 'prompt') {
            // 输入框弹窗
            const inputText = promptText || dialog.defaultValue() || '';
            await dialog.accept(inputText);
            dialogInfo.handled = true;
            dialogInfo.action = 'accept';
            dialogInfo.input = inputText;
          } else if (this.defaultAction === 'accept') {
            await dialog.accept();
            dialogInfo.handled = true;
            dialogInfo.action = 'accept';
          } else {
            await dialog.dismiss();
            dialogInfo.handled = true;
            dialogInfo.action = 'dismiss';
          }
        } catch (error) {
          dialogInfo.error = error.message;
          console.error('[弹窗处理错误]', error.message);
        }
      };

      page.on('dialog', this.dialogListener);

      return {
        success: true,
        message: `自动处理弹窗已启用，默认操作: ${action}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async disableAutoHandle() {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      this.autoHandleEnabled = false;

      if (this.dialogListener) {
        page.off('dialog', this.dialogListener);
        this.dialogListener = null;
      }

      return { success: true, message: '自动处理弹窗已禁用' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async handleCurrentDialog(action, text = '') {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      // 注意：Puppeteer 的 dialog 事件是异步的，这里无法直接获取当前弹窗
      // 需要通过其他方式处理，比如先禁用自动处理，然后手动处理

      return {
        success: false,
        error: '请使用 enableAutoHandle 设置自动处理方式，弹窗会自动处理'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getDialogHistory() {
    return {
      success: true,
      history: this.dialogHistory,
      count: this.dialogHistory.length
    };
  }

  clearHistory() {
    this.dialogHistory = [];
    return { success: true, message: '弹窗历史已清空' };
  }

  async waitForDialog(timeout = 5000) {
    try {
      const page = this.browser.getCurrentPage();
      if (!page) {
        return { success: false, error: '页面未初始化' };
      }

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve({ success: false, error: '等待弹窗超时' });
        }, timeout);

        const handler = (dialog) => {
          clearTimeout(timer);
          page.off('dialog', handler);
          resolve({
            success: true,
            type: dialog.type(),
            message: dialog.message(),
            defaultValue: dialog.defaultValue()
          });
        };

        page.once('dialog', handler);
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 处理常见的弹窗场景
  async handleConfirm(shouldAccept = true) {
    return this.enableAutoHandle(shouldAccept ? 'accept' : 'dismiss');
  }

  async handlePrompt(text) {
    return this.enableAutoHandle('accept', text);
  }

  async handleAlert() {
    return this.enableAutoHandle('accept');
  }
}

export default DialogHandler;
