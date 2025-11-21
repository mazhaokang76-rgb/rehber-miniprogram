#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase连接测试和表验证脚本
"""

import requests
import json

# Supabase配置
SUPABASE_URL = "https://sabkqmcgvtpfcicqxfpt.supabase.co"
SUPABASE_KEY = "sb_publishable_Xvg2opObWAWmpT_pIO5AkQ_Dx9hSRk1"

def test_connection():
    """测试Supabase连接"""
    print("=" * 70)
    print("Supabase连接测试")
    print("=" * 70)
    print()
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # 测试1: 检查community_events表
    print("1. 测试community_events表...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/community_events?limit=3",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            events = response.json()
            print(f"   ✅ community_events表存在，包含 {len(events)} 条数据")
            if events:
                print(f"   示例数据: {events[0].get('title', 'N/A')}")
        else:
            print(f"   ❌ 请求失败: {response.status_code}")
            print(f"   响应: {response.text}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    print()
    
    # 测试2: 检查user_favorites表
    print("2. 测试user_favorites表...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/user_favorites?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            favorites = response.json()
            print(f"   ✅ user_favorites表存在，包含 {len(favorites)} 条数据")
        elif response.status_code == 404:
            print("   ❌ user_favorites表不存在（需要创建）")
        elif response.status_code == 406:
            print("   ⚠️  表可能存在但返回406错误")
            print("   响应: " + response.text[:200])
        else:
            print(f"   ❌ 请求失败: {response.status_code}")
            print(f"   响应: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    print()
    
    # 测试3: 检查users表
    print("3. 测试users表...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/users?limit=1",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            users = response.json()
            print(f"   ✅ users表存在，包含 {len(users)} 条数据")
        else:
            print(f"   ❌ 请求失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    print()
    
    # 测试4: 检查training_videos表
    print("4. 测试training_videos表...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/training_videos?limit=2",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            videos = response.json()
            print(f"   ✅ training_videos表存在，包含 {len(videos)} 条数据")
        else:
            print(f"   ❌ 请求失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    print()
    
    # 测试5: 检查health_news表
    print("5. 测试health_news表...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/health_news?limit=2",
            headers=headers,
            timeout=10
        )
        if response.status_code == 200:
            news = response.json()
            print(f"   ✅ health_news表存在，包含 {len(news)} 条数据")
        else:
            print(f"   ❌ 请求失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    print()
    print("=" * 70)
    print("测试完成")
    print("=" * 70)
    print()
    print("📋 下一步操作：")
    print()
    print("如果user_favorites表不存在，请在Supabase控制台执行：")
    print("   文件路径: /workspace/user_favorites_table.sql")
    print()
    print("或访问: https://supabase.com/dashboard/project/sabkqmcgvtpfcicqxfpt/editor")
    print()

if __name__ == "__main__":
    test_connection()
