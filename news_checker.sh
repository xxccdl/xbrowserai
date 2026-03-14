#!/bin/bash
echo "=== 百度新闻检查 ==="
echo "检查时间: $(date)"
echo "正在访问百度新闻..."

# 获取百度新闻页面标题
curl -s "https://news.baidu.com/" | grep -o '<title>[^<]*</title>' | sed 's/<title>//g' | sed 's/<\/title>//g'

echo "新闻检查完成"
echo "=================="