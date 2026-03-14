# 定时新闻检查程序

这是一个简单的定时新闻检查程序，可以每分钟自动打开新闻网站查看最新新闻。

## 文件说明

1. **simple_news.py** - Python脚本版本（推荐）
2. **news_checker.bat** - Windows批处理版本
3. **simple_news_checker.sh** - Linux/Mac Shell脚本版本
4. **news_checker.py** - 高级Python版本（需要安装schedule库）
5. **windows_task_setup.md** - Windows任务计划程序设置指南
6. **setup_cron_job.md** - Linux/Mac crontab设置指南

## 快速开始

### 方法1：使用Python脚本（最简单）

1. 确保已安装Python 3
2. 运行命令：
   ```bash
   python simple_news.py
   ```
3. 程序将每分钟自动打开新闻网站
4. 按 `Ctrl+C` 停止程序

### 方法2：Windows批处理文件

1. 双击运行 `news_checker.bat`
2. 脚本会立即打开新闻网站
3. 要设置定时任务，请参考 `windows_task_setup.md`

### 方法3：设置系统定时任务

#### Windows系统：
- 参考 `windows_task_setup.md` 设置任务计划程序

#### Linux/Mac系统：
- 参考 `setup_cron_job.md` 设置crontab

## 自定义设置

### 修改新闻网站：
编辑脚本文件，修改以下部分：

**Python版本：**
```python
news_sites = [
    "https://news.baidu.com",      # 修改为您喜欢的新闻网站
    "https://www.163.com",
    # 添加更多网站...
]
```

**批处理版本：**
```batch
start https://news.baidu.com  # 修改为您喜欢的新闻网站
```

### 修改检查间隔：
**Python版本：**
```python
check_interval = 60  # 修改为想要的秒数，如300表示5分钟
```

## 推荐的新闻网站

1. **综合新闻**：
   - 百度新闻：https://news.baidu.com
   - 网易新闻：https://www.163.com
   - 新浪新闻：https://www.sina.com.cn

2. **科技新闻**：
   - 36氪：https://36kr.com
   - 虎嗅：https://www.huxiu.com
   - 钛媒体：https://www.tmtpost.com

3. **财经新闻**：
   - 东方财富：https://www.eastmoney.com
   - 华尔街见闻：https://wallstreetcn.com

## 注意事项

1. **网络连接**：需要稳定的网络连接
2. **浏览器设置**：确保默认浏览器正常工作
3. **系统资源**：频繁打开网页可能占用较多资源
4. **工作时间**：建议在工作时间使用，避免影响休息
5. **隐私考虑**：新闻网站可能会记录访问信息

## 故障排除

1. **无法打开网页**：
   - 检查网络连接
   - 检查浏览器设置
   - 尝试手动访问新闻网站

2. **脚本无法运行**：
   - 确保Python已正确安装
   - 检查文件路径是否正确
   - 尝试以管理员身份运行

3. **定时任务不执行**：
   - 检查系统时间设置
   - 确认任务计划程序服务正在运行
   - 检查任务触发条件设置

## 更新日志

- v1.0：初始版本，支持基本功能
- 支持多平台：Windows、Linux、Mac
- 提供多种实现方式