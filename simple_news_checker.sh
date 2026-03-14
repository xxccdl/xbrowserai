#!/bin/bash
# 简单的新闻检查脚本

echo "新闻检查脚本启动于: $(date)"
echo "正在打开新闻网站..."

# 打开百度新闻
open https://news.baidu.com

# 等待几秒钟
sleep 3

echo "新闻检查完成于: $(date)"