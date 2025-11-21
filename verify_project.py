#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
康复小程序完整性验证脚本
验证所有文件是否完整以及关键功能是否已实现
"""

import os
import json

def check_file(path, desc):
    """检查文件是否存在"""
    exists = os.path.exists(path)
    status = "✅" if exists else "❌"
    print(f"{status} {desc}: {os.path.basename(path)}")
    return exists

def check_content(path, keyword, desc):
    """检查文件内容是否包含关键词"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            if keyword in content:
                print(f"   ✅ {desc}")
                return True
            else:
                print(f"   ❌ {desc} - 未找到")
                return False
    except:
        print(f"   ❌ {desc} - 读取失败")
        return False

def main():
    print("=" * 70)
    print("康复小程序完整性验证")
    print("=" * 70)
    print()

    total = 0
    passed = 0

    # 1. 核心配置
    print("1. 核心配置文件")
    print("-" * 70)
    total += 1
    if check_file("/workspace/miniprogram/app.json", "应用配置"):
        passed += 1
        total += 1
        if check_content("/workspace/miniprogram/app.json", "news-center", "资讯页面已配置"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/app.json", "tools", "工具页面已配置"):
            passed += 1

    # 2. 资讯页面
    print()
    print("2. 资讯中心页面")
    print("-" * 70)
    files = [
        ("/workspace/miniprogram/pages/news-center/news-center.wxml", "WXML模板"),
        ("/workspace/miniprogram/pages/news-center/news-center.wxss", "WXSS样式"),
        ("/workspace/miniprogram/pages/news-center/news-center.js", "JS逻辑"),
        ("/workspace/miniprogram/pages/news-center/news-center.json", "JSON配置"),
    ]
    for path, desc in files:
        total += 1
        if check_file(path, desc):
            passed += 1
    
    # 检查资讯页核心功能
    if os.path.exists("/workspace/miniprogram/pages/news-center/news-center.js"):
        total += 1
        if check_content("/workspace/miniprogram/pages/news-center/news-center.js", 
                        "distributeToColumns", "瀑布流布局算法"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/pages/news-center/news-center.js",
                        "handleSearch", "搜索功能"):
            passed += 1
    
    if os.path.exists("/workspace/miniprogram/pages/news-center/news-center.wxml"):
        total += 1
        if check_content("/workspace/miniprogram/pages/news-center/news-center.wxml",
                        "没有您要的主题内容", "搜索空状态提示"):
            passed += 1

    # 3. 工具页面
    print()
    print("3. 工具页面")
    print("-" * 70)
    files = [
        ("/workspace/miniprogram/pages/tools/tools.wxml", "WXML模板"),
        ("/workspace/miniprogram/pages/tools/tools.wxss", "WXSS样式"),
        ("/workspace/miniprogram/pages/tools/tools.js", "JS逻辑"),
        ("/workspace/miniprogram/pages/tools/tools.json", "JSON配置"),
    ]
    for path, desc in files:
        total += 1
        if check_file(path, desc):
            passed += 1
    
    # 检查工具页核心功能
    if os.path.exists("/workspace/miniprogram/pages/tools/tools.js"):
        total += 1
        if check_content("/workspace/miniprogram/pages/tools/tools.js",
                        "calculateCalories", "卡路里计算器"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/pages/tools/tools.js",
                        "calculateHeartRate", "心率计算器"):
            passed += 1

    # 4. 图标资源
    print()
    print("4. 图标资源")
    print("-" * 70)
    files = [
        ("/workspace/miniprogram/assets/icons/news.png", "资讯图标"),
        ("/workspace/miniprogram/assets/icons/news-active.png", "资讯激活图标"),
        ("/workspace/miniprogram/assets/icons/tools.png", "工具图标"),
        ("/workspace/miniprogram/assets/icons/tools-active.png", "工具激活图标"),
    ]
    for path, desc in files:
        total += 1
        if check_file(path, desc):
            passed += 1

    # 5. 服务层
    print()
    print("5. 服务层")
    print("-" * 70)
    total += 1
    if check_file("/workspace/miniprogram/services/cloudService.js", "云服务"):
        passed += 1
        total += 1
        if check_content("/workspace/miniprogram/services/cloudService.js",
                        "reject(error)", "错误处理（移除mock）"):
            passed += 1
    
    total += 1
    if check_file("/workspace/miniprogram/services/userService.js", "用户服务"):
        passed += 1
        total += 1
        if check_content("/workspace/miniprogram/services/userService.js",
                        "addFavorite", "添加收藏功能"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/services/userService.js",
                        "getFavorites", "获取收藏功能"):
            passed += 1

    # 6. 首页功能
    print()
    print("6. 首页搜索和通知功能")
    print("-" * 70)
    if os.path.exists("/workspace/miniprogram/pages/home/home.js"):
        total += 1
        if check_content("/workspace/miniprogram/pages/home/home.js",
                        "handleSearch", "搜索按钮功能"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/pages/home/home.js",
                        "handleNotification", "通知按钮功能"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/pages/home/home.js",
                        "news-center", "跳转到资讯页"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/pages/home/home.js",
                        "showFavorites", "跳转到收藏页"):
            passed += 1

    # 7. 社区收藏功能
    print()
    print("7. 社区收藏功能")
    print("-" * 70)
    if os.path.exists("/workspace/miniprogram/pages/community/community.js"):
        total += 1
        if check_content("/workspace/miniprogram/pages/community/community.js",
                        "showFavorites", "收藏模式"):
            passed += 1
        total += 1
        if check_content("/workspace/miniprogram/pages/community/community.js",
                        "UserService", "用户服务引入"):
            passed += 1
    
    if os.path.exists("/workspace/miniprogram/pages/community/community.wxml"):
        total += 1
        if check_content("/workspace/miniprogram/pages/community/community.wxml",
                        "没有收藏的活动", "收藏空状态提示"):
            passed += 1

    # 总结
    print()
    print("=" * 70)
    print(f"验证结果: {passed}/{total} 项通过 ({int(passed/total*100)}%)")
    print("=" * 70)
    print()

    if passed == total:
        print("✅ 所有检查通过！项目完整性良好。")
        print()
        print("📋 下一步操作：")
        print()
        print("1️⃣  创建数据库表")
        print("   在Supabase控制台的SQL编辑器中执行:")
        print("   文件路径: /workspace/user_favorites_table.sql")
        print()
        print("2️⃣  打开微信开发者工具")
        print("   项目路径: /workspace/miniprogram")
        print()
        print("3️⃣  进行完整功能测试")
        print("   测试指南: /workspace/miniprogram/TESTING_GUIDE.md")
        print()
        return 0
    else:
        print(f"⚠️  有 {total - passed} 项检查未通过，请检查上述问题。")
        print()
        return 1

if __name__ == "__main__":
    exit(main())
