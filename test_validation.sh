#!/bin/bash

echo "=================================="
echo "  小程序项目自动化验证脚本"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
PASS=0
FAIL=0

# 检查文件是否存在
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗${NC} $1 (缺失)"
        ((FAIL++))
        return 1
    fi
}

echo "1. 文件完整性检查"
echo "-----------------------------------"
check_file "pages/news-center/news-center.wxml"
check_file "pages/news-center/news-center.wxss"
check_file "pages/news-center/news-center.js"
check_file "pages/news-center/news-center.json"
check_file "pages/tools/tools.wxml"
check_file "pages/tools/tools.wxss"
check_file "pages/tools/tools.js"
check_file "pages/tools/tools.json"
check_file "assets/icons/news.png"
check_file "assets/icons/news-active.png"
check_file "assets/icons/tools.png"
check_file "assets/icons/tools-active.png"

echo ""
echo "2. 配置文件验证"
echo "-----------------------------------"

# 检查app.json中是否包含新页面
if grep -q "pages/news-center/news-center" app.json; then
    echo -e "${GREEN}✓${NC} app.json包含资讯中心页面路径"
    ((PASS++))
else
    echo -e "${RED}✗${NC} app.json缺少资讯中心页面路径"
    ((FAIL++))
fi

if grep -q "pages/tools/tools" app.json; then
    echo -e "${GREEN}✓${NC} app.json包含工具页面路径"
    ((PASS++))
else
    echo -e "${RED}✗${NC} app.json缺少工具页面路径"
    ((FAIL++))
fi

# 检查TabBar配置
TAB_COUNT=$(grep -c '"text"' app.json)
if [ "$TAB_COUNT" -eq 5 ]; then
    echo -e "${GREEN}✓${NC} TabBar配置正确（5个tab）"
    ((PASS++))
else
    echo -e "${RED}✗${NC} TabBar配置错误（应为5个tab，实际$TAB_COUNT个）"
    ((FAIL++))
fi

echo ""
echo "3. 代码质量检查"
echo "-----------------------------------"

# 检查是否移除了模拟数据回退
if ! grep -q "resolve(this.getMockVideos" services/cloudService.js; then
    echo -e "${GREEN}✓${NC} 已移除视频模拟数据回退"
    ((PASS++))
else
    echo -e "${RED}✗${NC} 仍存在视频模拟数据回退"
    ((FAIL++))
fi

if ! grep -q "resolve(this.getMockNews" services/cloudService.js; then
    echo -e "${GREEN}✓${NC} 已移除资讯模拟数据回退"
    ((PASS++))
else
    echo -e "${RED}✗${NC} 仍存在资讯模拟数据回退"
    ((FAIL++))
fi

# 检查错误提示
if grep -q "网络错误，请稍后重试" pages/home/home.js; then
    echo -e "${GREEN}✓${NC} 首页错误提示已更新"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} 首页错误提示需要检查"
    ((FAIL++))
fi

if grep -q "网络错误，请稍后重试" pages/news-center/news-center.js; then
    echo -e "${GREEN}✓${NC} 资讯页错误提示已更新"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} 资讯页错误提示需要检查"
    ((FAIL++))
fi

# 检查瀑布流优化
if grep -q "leftHeight" pages/news-center/news-center.js; then
    echo -e "${GREEN}✓${NC} 瀑布流算法已优化（基于高度平衡）"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} 瀑布流算法可能需要优化"
    ((FAIL++))
fi

echo ""
echo "4. 文件统计"
echo "-----------------------------------"
echo "WXML文件: $(find pages/news-center pages/tools -name "*.wxml" | wc -l)"
echo "WXSS文件: $(find pages/news-center pages/tools -name "*.wxss" | wc -l)"
echo "JS文件: $(find pages/news-center pages/tools -name "*.js" | wc -l)"
echo "JSON文件: $(find pages/news-center pages/tools -name "*.json" | wc -l)"
echo "图标文件: $(ls assets/icons/news*.png assets/icons/tools*.png 2>/dev/null | wc -l)"

echo ""
echo "=================================="
echo "  检查结果汇总"
echo "=================================="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 所有自动化检查通过！${NC}"
    echo ""
    echo "下一步："
    echo "1. 在微信开发者工具中打开项目"
    echo "2. 参考 CHECK_LIST.md 进行手动功能测试"
    echo "3. 测试所有TabBar导航和页面功能"
    exit 0
else
    echo -e "${RED}✗ 部分检查未通过，请修复后重试${NC}"
    exit 1
fi
