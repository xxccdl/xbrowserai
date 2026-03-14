class NetworkMonitor {
  constructor(browserController) {
    this.browser = browserController;
    this.requests = [];
    this.isMonitoring = false;
    this.requestHandler = null;
    this.responseHandler = null;
  }

  async startMonitoring() {
    const page = this.browser.getCurrentPage();
    if (!page) {
      return { success: false, error: '页面未初始化' };
    }

    this.requests = [];
    this.isMonitoring = true;

    // 监听请求
    this.requestHandler = (request) => {
      const requestInfo = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        timestamp: Date.now(),
        resourceType: request.resourceType()
      };
      this.requests.push({ type: 'request', data: requestInfo });
    };

    // 监听响应
    this.responseHandler = async (response) => {
      try {
        const responseInfo = {
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          timestamp: Date.now()
        };

        // 尝试获取响应体（仅对文本内容）
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json') || 
              contentType.includes('text/')) {
            responseInfo.body = await response.text();
          }
        } catch (e) {
          // 忽略无法读取的响应体
        }

        this.requests.push({ type: 'response', data: responseInfo });
      } catch (error) {
        // 忽略错误
      }
    };

    page.on('request', this.requestHandler);
    page.on('response', this.responseHandler);

    return { success: true, message: '网络监控已启动' };
  }

  async stopMonitoring() {
    const page = this.browser.getCurrentPage();
    if (!page) {
      return { success: false, error: '页面未初始化' };
    }

    if (this.requestHandler) {
      page.off('request', this.requestHandler);
    }
    if (this.responseHandler) {
      page.off('response', this.responseHandler);
    }

    this.isMonitoring = false;

    return { 
      success: true, 
      message: '网络监控已停止',
      totalRequests: this.requests.filter(r => r.type === 'request').length,
      totalResponses: this.requests.filter(r => r.type === 'response').length
    };
  }

  getRequests(filter = {}) {
    let filtered = this.requests;

    if (filter.url) {
      filtered = filtered.filter(r => r.data.url.includes(filter.url));
    }

    if (filter.method) {
      filtered = filtered.filter(r => 
        r.type === 'request' && r.data.method === filter.method
      );
    }

    if (filter.status) {
      filtered = filtered.filter(r => 
        r.type === 'response' && r.data.status === filter.status
      );
    }

    return { 
      success: true, 
      requests: filtered,
      count: filtered.length 
    };
  }

  getStats() {
    const requests = this.requests.filter(r => r.type === 'request');
    const responses = this.requests.filter(r => r.type === 'response');
    
    const statusCodes = {};
    responses.forEach(r => {
      const status = r.data.status;
      statusCodes[status] = (statusCodes[status] || 0) + 1;
    });

    const domains = {};
    requests.forEach(r => {
      try {
        const url = new URL(r.data.url);
        domains[url.hostname] = (domains[url.hostname] || 0) + 1;
      } catch (e) {}
    });

    return {
      success: true,
      stats: {
        totalRequests: requests.length,
        totalResponses: responses.length,
        statusCodes,
        domains,
        isMonitoring: this.isMonitoring
      }
    };
  }

  clear() {
    this.requests = [];
    return { success: true, message: '请求记录已清空' };
  }

  async exportToFile(filePath) {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(
        filePath, 
        JSON.stringify(this.requests, null, 2),
        'utf-8'
      );
      return { success: true, message: `已导出到: ${filePath}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default NetworkMonitor;
