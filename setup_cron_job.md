# 设置每分钟查看新闻的定时任务

## 方法一：使用crontab（Linux/Mac）

### 步骤：
1. 打开终端
2. 编辑crontab：
   ```bash
   crontab -e
   ```
3. 添加以下行（每分钟执行一次）：
   ```bash
   * * * * * /path/to/your/simple_news_checker.sh
   ```
4. 保存并退出

## 方法二：使用Windows任务计划程序

### 步骤：
1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器为"每天"，然后选择"重复任务间隔"为1分钟
4. 操作为"启动程序"，选择脚本文件
5. 完成设置

## 方法三：使用Python脚本（跨平台）

### 安装依赖：
```bash
pip install schedule
```

### 运行Python脚本：
```bash
python news_checker.py
```

## 推荐的新闻网站：

1. **百度新闻** - https://news.baidu.com
2. **网易新闻** - https://www.163.com
3. **新浪新闻** - https://www.sina.com.cn
4. **搜狐新闻** - https://www.sohu.com
5. **腾讯新闻** - https://news.qq.com
6. **今日头条** - https://www.toutiao.com

## 自定义设置：

您可以修改 `simple_news_checker.sh` 或 `news_checker.py` 文件中的新闻网站URL，选择您感兴趣的新闻源。

## 注意事项：

- 定时任务会每分钟打开浏览器，可能会影响您的工作
- 建议在工作时间设置，避免影响休息
- 可以调整时间间隔，如每5分钟或每10分钟检查一次