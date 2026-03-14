@echo off
echo 新闻检查脚本启动于: %date% %time%
echo 正在打开新闻网站...

REM 打开百度新闻
start https://news.baidu.com

REM 等待3秒钟
timeout /t 3 /nobreak >nul

echo 新闻检查完成于: %date% %time%
pause