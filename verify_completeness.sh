#!/bin/bash

# 康复小程序完整性验证脚本
# 用于验证所有代码文件是否完整且符合预期

echo "=================================="
echo "康复小程序完整性验证"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 检查函数
check_file() {
    local file=$1
    local desc=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $desc"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $desc - 文件不存在"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_content() {
    local file=$1
    local pattern=$2
    local desc=$3
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file" ]; then
        if grep -q "$pattern" "$file"; then
            echo -e "${GREEN}✓${NC} $desc"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            return 0
        else
            echo -e "${RED}✗${NC} $desc - 内容不匹配"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $desc - 文件不存在"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

echo "1. 检查核心配置文件"
echo "-------------------"
check_file "/workspace/miniprogram/app.json" "app.json 配置文件"
check_content "/workspace/miniprogram/app.json" "news-center" "资讯页面已添加到配置"
check_content "/workspace/miniprogram/app.json" "tools" "工具页面已添加到配置"
check_content "/workspace/miniprogram/app.json" '"list".*\[.*\]' "TabBar配置存在"
echo ""

echo "2. 检查资讯中心页面"
echo "-------------------"
check_file "/workspace/miniprogram/pages/news-center/news-center.wxml" "资讯页面 WXML"
check_file "/workspace/miniprogram/pages/news-center/news-center.wxss" "资讯页面 WXSS"
check_file "/workspace/miniprogram/pages/news-center/news-center.js" "资讯页面 JS"
check_file "/workspace/miniprogram/pages/news-center/news-center.json" "资讯页面 JSON"
check_content "/workspace/miniprogram/pages/news-center/news-center.js" "distributeToColumns" "瀑布流布局函数"
check_content "/workspace/miniprogram/pages/news-center/news-center.js" "handleSearch" "搜索功能实现"
check_content "/workspace/miniprogram/pages/news-center/news-center.wxml" "没有您要的主题内容" "搜索空状态提示"
echo ""

echo "3. 检查工具页面"
echo "-------------------"
check_file "/workspace/miniprogram/pages/tools/tools.wxml" "工具页面 WXML"
check_file "/workspace/miniprogram/pages/tools/tools.wxss" "工具页面 WXSS"
check_file "/workspace/miniprogram/pages/tools/tools.js" "工具页面 JS"
check_file "/workspace/miniprogram/pages/tools/tools.json" "工具页面 JSON"
check_content "/workspace/miniprogram/pages/tools/tools.js" "calculateCalories" "卡路里计算器"
check_content "/workspace/miniprogram/pages/tools/tools.js" "calculateHeartRate" "心率计算器"
echo ""

echo "4. 检查图标资源"
echo "-------------------"
check_file "/workspace/miniprogram/assets/icons/news.png" "资讯图标（未激活）"
check_file "/workspace/miniprogram/assets/icons/news-active.png" "资讯图标（激活）"
check_file "/workspace/miniprogram/assets/icons/tools.png" "工具图标（未激活）"
check_file "/workspace/miniprogram/assets/icons/tools-active.png" "工具图标（激活）"
echo ""

echo "5. 检查服务层"
echo "-------------------"
check_file "/workspace/miniprogram/services/cloudService.js" "云服务文件"
check_file "/workspace/miniprogram/services/userService.js" "用户服务文件"
check_content "/workspace/miniprogram/services/cloudService.js" "getVideosSupabase" "Supabase视频服务"
check_content "/workspace/miniprogram/services/cloudService.js" "getNewsSupabase" "Supabase资讯服务"
check_content "/workspace/miniprogram/services/userService.js" "addFavorite" "添加收藏功能"
check_content "/workspace/miniprogram/services/userService.js" "getFavorites" "获取收藏功能"
echo ""

echo "6. 检查首页搜索和通知功能"
echo "-------------------"
check_content "/workspace/miniprogram/pages/home/home.js" "handleSearch" "首页搜索功能"
check_content "/workspace/miniprogram/pages/home/home.js" "handleNotification" "首页通知功能"
check_content "/workspace/miniprogram/pages/home/home.js" "news-center" "搜索跳转到资讯页"
check_content "/workspace/miniprogram/pages/home/home.js" "showFavorites=true" "通知跳转到收藏页"
echo ""

echo "7. 检查社区收藏功能"
echo "-------------------"
check_content "/workspace/miniprogram/pages/community/community.js" "showFavorites" "收藏模式支持"
check_content "/workspace/miniprogram/pages/community/community.js" "UserService" "用户服务引入"
check_content "/workspace/miniprogram/pages/community/community.wxml" "没有收藏的活动" "收藏空状态提示"
echo ""

echo "8. 检查错误处理改进"
echo "-------------------"
check_content "/workspace/miniprogram/services/cloudService.js" "reject(error)" "错误处理（不使用mock）"
check_content "/workspace/miniprogram/pages/home/home.js" "网络错误" "首页错误提示"
check_content "/workspace/miniprogram/pages/news-center/news-center.js" "网络错误" "资讯页错误提示"
echo ""

echo "=================================="
echo "验证结果汇总"
echo "=================================="
echo -e "总检查项: $TOTAL_CHECKS"
echo -e "${GREEN}通过: $PASSED_CHECKS${NC}"
echo -e "${RED}失败: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查项通过！项目完整性良好。${NC}"
    echo ""
    echo "下一步："
    echo "1. 在Supabase中执行 /workspace/user_favorites_table.sql"
    echo "2. 在微信开发者工具中打开 /workspace/miniprogram"
    echo "3. 参考 TESTING_GUIDE.md 进行完整测试"
    exit 0
else
    echo -e "${YELLOW}⚠ 有 $FAILED_CHECKS 项检查未通过，请检查上述问题。${NC}"
    exit 1
fi
