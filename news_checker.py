#!/usr/bin/env python3
"""
定时新闻检查脚本
每分钟自动打开新闻网站查看最新新闻
"""

import time
import webbrowser
import schedule
import threading
from datetime import datetime

def check_news():
    """检查新闻的主要函数"""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{current_time}] 正在检查新闻...")
    
    # 这里可以添加您想要查看的新闻网站
    news_sites = [
        "https://news.baidu.com",  # 百度新闻
        "https://www.163.com",     # 网易新闻
        "https://www.sina.com.cn", # 新浪新闻
        "https://www.sohu.com",    # 搜狐新闻
    ]
    
    # 打开第一个新闻网站
    try:
        webbrowser.open(news_sites[0])
        print(f"已打开新闻网站: {news_sites[0]}")
    except Exception as e:
        print(f"打开新闻网站时出错: {e}")

def run_schedule():
    """运行定时任务"""
    # 设置每分钟执行一次
    schedule.every(1).minutes.do(check_news)
    
    # 立即执行一次
    check_news()
    
    print("定时新闻检查已启动，每分钟检查一次新闻...")
    print("按 Ctrl+C 停止程序")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n程序已停止")

if __name__ == "__main__":
    # 创建一个线程来运行定时任务
    schedule_thread = threading.Thread(target=run_schedule, daemon=True)
    schedule_thread.start()
    
    # 保持主线程运行
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n程序已停止")