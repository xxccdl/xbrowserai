#!/usr/bin/env python3
"""
简单的新闻检查脚本
每分钟自动打开新闻网站
"""

import time
import webbrowser
import os
from datetime import datetime

def open_news():
    """打开新闻网站"""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{current_time}] 正在打开新闻网站...")
    
    # 新闻网站列表
    news_sites = [
        "https://news.baidu.com",      # 百度新闻
        "https://www.163.com",         # 网易新闻
        "https://www.sina.com.cn",     # 新浪新闻
        "https://news.qq.com",         # 腾讯新闻
        "https://www.sohu.com",        # 搜狐新闻
    ]
    
    # 打开第一个新闻网站
    try:
        webbrowser.open(news_sites[0])
        print(f"已打开: {news_sites[0]}")
        return True
    except Exception as e:
        print(f"打开新闻网站时出错: {e}")
        return False

def main():
    """主函数"""
    print("=" * 50)
    print("新闻自动检查程序")
    print("每分钟自动打开新闻网站查看最新新闻")
    print("按 Ctrl+C 停止程序")
    print("=" * 50)
    
    # 立即执行一次
    open_news()
    
    # 设置检查间隔（秒）
    check_interval = 60  # 1分钟
    
    try:
        while True:
            # 等待指定时间
            print(f"\n等待 {check_interval} 秒后再次检查...")
            time.sleep(check_interval)
            
            # 再次检查新闻
            open_news()
            
    except KeyboardInterrupt:
        print("\n\n程序已停止")
        print("感谢使用新闻自动检查程序！")

if __name__ == "__main__":
    main()