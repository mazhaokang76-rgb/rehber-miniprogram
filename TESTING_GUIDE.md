# 康复小程序功能测试指南

## 📋 测试前准备

### 1. 数据库准备

在Supabase控制台的SQL编辑器中执行以下SQL脚本：

```sql
-- 创建用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  event_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_event_id ON user_favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at DESC);

-- 启用行级安全
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "Users can view their own favorites" ON user_favorites FOR SELECT USING (true);
CREATE POLICY "Users can add favorites" ON user_favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete their own favorites" ON user_favorites FOR DELETE USING (true);
```

### 2. 验证数据库数据

确保Supabase中存在以下测试数据：
- ✅ training_videos 表有至少 5 条视频数据
- ✅ health_news 表有至少 5 条资讯数据
- ✅ community_events 表有至少 5 条活动数据
- ✅ users 表有至少 1 个测试用户

如果没有数据，请执行 `/workspace/miniprogram_init.sql` 脚本。

### 3. 微信开发者工具设置

1. 打开微信开发者工具
2. 导入项目：选择 `/workspace/miniprogram` 目录
3. 确认项目配置：
   - AppID：使用测试号或真实AppID
   - 不校验合法域名：开发阶段勾选此项
4. 确保网络连接正常

---

## 🧪 功能测试用例

### 测试模块 1：首页搜索功能

#### 测试用例 1.1：搜索按钮跳转
**步骤：**
1. 启动小程序，确保当前在首页
2. 查看右上角是否有搜索图标（放大镜）
3. 点击搜索图标

**预期结果：**
- ✅ 自动跳转到"资讯"页面
- ✅ 搜索面板自动展开显示
- ✅ 搜索输入框获得焦点（可以直接输入）
- ✅ 页面显示所有资讯内容（视频+文章）

**失败排查：**
- 检查 `home.js` 的 `handleSearch()` 方法
- 检查 `news-center.js` 的 `onLoad()` 方法是否正确处理 keyword 参数

---

#### 测试用例 1.2：搜索关键词匹配
**步骤：**
1. 在资讯页面搜索框中输入关键词："康复"
2. 点击"搜索"按钮
3. 观察搜索结果

**预期结果：**
- ✅ 显示所有标题、分类或摘要中包含"康复"的内容
- ✅ 搜索结果包括视频和文章
- ✅ 内容以瀑布流形式展示
- ✅ 每列高度基本平衡

**测试多个关键词：**
- "运动" - 应显示运动相关内容
- "训练" - 应显示训练相关内容
- "心肺" - 应显示心肺功能相关内容

**失败排查：**
- 检查 `news-center.js` 的 `handleSearch()` 方法
- 检查搜索逻辑是否正确：`title/category/summary` 模糊匹配

---

#### 测试用例 1.3：搜索无结果提示
**步骤：**
1. 在搜索框中输入不存在的关键词："xyz123测试"
2. 点击"搜索"按钮

**预期结果：**
- ✅ 清空所有内容列表
- ✅ 显示空状态提示："没有您要的主题内容，换个主题试试"
- ✅ 提示文字为灰色，居中显示
- ✅ Tab标签栏仍然可见

**失败排查：**
- 检查 `news-center.wxml` 的空状态条件渲染
- 检查 `news-center.js` 的 `showEmptyState` 变量设置

---

### 测试模块 2：首页通知功能

#### 测试用例 2.1：通知按钮跳转
**步骤：**
1. 返回首页
2. 查看右上角是否有通知图标（铃铛）
3. 点击通知图标

**预期结果：**
- ✅ 自动跳转到"社区"页面
- ✅ 页面显示收藏模式（不是普通社区活动列表）
- ✅ URL参数包含 `showFavorites=true`

**失败排查：**
- 检查 `home.js` 的 `handleNotification()` 方法
- 检查导航URL是否正确：`/pages/community/community?showFavorites=true`

---

#### 测试用例 2.2：收藏空状态显示
**前提条件：** 当前用户没有任何收藏

**步骤：**
1. 确保数据库 `user_favorites` 表为空或没有当前用户的记录
2. 从首页点击通知图标

**预期结果：**
- ✅ 跳转到社区页面
- ✅ 显示空状态提示："没有收藏的活动，去看看你感兴趣的吧！"
- ✅ 提示文字为灰色，居中显示
- ✅ 没有显示任何活动卡片

**失败排查：**
- 检查 `community.wxml` 的收藏空状态条件
- 检查 `community.js` 的 `loadEvents()` 方法处理 showFavorites 的逻辑

---

#### 测试用例 2.3：收藏列表显示
**前提条件：** 需要先手动在数据库中插入收藏数据

**准备工作（在Supabase SQL编辑器中执行）：**
```sql
-- 获取一个测试用户ID和活动ID
INSERT INTO user_favorites (user_id, event_id, event_details)
SELECT 
  (SELECT id FROM users LIMIT 1) as user_id,
  id as event_id,
  jsonb_build_object(
    'title', title,
    'location', location,
    'time', time,
    'date', date
  ) as event_details
FROM community_events
LIMIT 2;
```

**步骤：**
1. 确保数据库有收藏记录
2. 从首页点击通知图标

**预期结果：**
- ✅ 显示收藏的活动列表
- ✅ 活动按收藏时间倒序排列（最新收藏的在最上面）
- ✅ 每个活动卡片显示完整信息（标题、地点、时间等）
- ✅ 不显示空状态提示

**失败排查：**
- 检查 `userService.js` 的 `getFavorites()` 方法
- 检查 `community.js` 的数据加载和排序逻辑
- 查看控制台是否有API请求错误

---

### 测试模块 3：瀑布流布局优化

#### 测试用例 3.1：瀑布流平衡性
**步骤：**
1. 进入资讯页面
2. 确保有至少 10 条混合内容（视频+文章）
3. 观察左右两列的高度分布

**预期结果：**
- ✅ 左右两列的总高度差异较小（视觉上平衡）
- ✅ 不会出现一列明显过长的情况
- ✅ 内容动态分配到高度较小的列

**测试方法：**
- 滚动到底部，观察两列的最后一项位置是否接近
- 多次刷新页面，观察布局是否保持平衡

**失败排查：**
- 检查 `news-center.js` 的 `distributeToColumns()` 方法
- 检查高度估算逻辑是否考虑了标题长度、内容类型等因素

---

#### 测试用例 3.2：搜索后瀑布流重新布局
**步骤：**
1. 在资讯页面进行搜索（例如："康复"）
2. 观察搜索结果的瀑布流布局

**预期结果：**
- ✅ 搜索结果重新分配到两列
- ✅ 新的布局仍然保持平衡
- ✅ 没有空白列或错位

---

### 测试模块 4：Tab导航功能

#### 测试用例 4.1：TabBar显示
**步骤：**
1. 启动小程序
2. 观察底部TabBar

**预期结果：**
- ✅ 显示5个Tab：首页、资讯、社区、工具、我的
- ✅ 每个Tab有对应的图标（未激活状态）
- ✅ 当前页面的Tab图标显示激活状态（绿色）
- ✅ Tab文字显示正确

---

#### 测试用例 4.2：Tab切换功能
**步骤：**
1. 依次点击每个Tab
2. 观察页面跳转和图标状态变化

**预期结果：**
- ✅ 点击"首页"：跳转到首页，显示视频推荐
- ✅ 点击"资讯"：跳转到资讯页，显示瀑布流内容
- ✅ 点击"社区"：跳转到社区页，显示活动列表
- ✅ 点击"工具"：跳转到工具页，显示计算器工具
- ✅ 点击"我的"：跳转到个人中心
- ✅ 当前Tab图标和文字为绿色（#10b981）

---

### 测试模块 5：工具页面功能

#### 测试用例 5.1：卡路里计算器
**步骤：**
1. 进入工具页面
2. 点击"卡路里计算器"卡片
3. 在弹出的模态框中输入：
   - 性别：男
   - 年龄：30
   - 身高：175cm
   - 体重：70kg
   - 活动水平：中等活动
4. 点击"计算"按钮

**预期结果：**
- ✅ 显示每日所需卡路里（约2400-2600 kcal）
- ✅ 计算结果合理（符合Harris-Benedict公式）
- ✅ 可以点击"重新计算"清空输入

**公式验证：**
- BMR = 88.362 + (13.397 × 70) + (4.799 × 175) - (5.677 × 30) ≈ 1681
- 总消耗 = BMR × 1.55 (中等活动) ≈ 2605 kcal

---

#### 测试用例 5.2：最佳心率计算器
**步骤：**
1. 点击"最佳心率计算器"卡片
2. 输入：
   - 年龄：30岁
   - 静息心率：70 bpm
   - 运动强度：70%
3. 点击"计算"按钮

**预期结果：**
- ✅ 显示目标心率（约154 bpm）
- ✅ 计算结果合理（符合Karvonen公式）

**公式验证：**
- 最大心率 = 220 - 30 = 190
- 目标心率 = (190 - 70) × 0.7 + 70 = 154 bpm

---

### 测试模块 6：错误处理

#### 测试用例 6.1：网络错误处理
**步骤：**
1. 关闭网络或设置Supabase为错误的URL
2. 刷新首页

**预期结果：**
- ✅ 显示"网络错误，请稍后重试"提示
- ✅ 提示持续时间 ≥ 2秒
- ✅ 不显示任何内容卡片
- ✅ 页面不崩溃

---

#### 测试用例 6.2：数据为空处理
**步骤：**
1. 清空Supabase中的所有视频和资讯数据
2. 进入资讯页面

**预期结果：**
- ✅ 显示空状态提示
- ✅ 不报错或崩溃
- ✅ Tab切换仍然正常

---

## 📊 测试结果记录表

| 测试模块 | 测试用例 | 状态 | 备注 |
|---------|---------|------|------|
| 首页搜索 | 1.1 搜索按钮跳转 | ⬜ |  |
| 首页搜索 | 1.2 关键词匹配 | ⬜ |  |
| 首页搜索 | 1.3 无结果提示 | ⬜ |  |
| 首页通知 | 2.1 通知按钮跳转 | ⬜ |  |
| 首页通知 | 2.2 收藏空状态 | ⬜ |  |
| 首页通知 | 2.3 收藏列表显示 | ⬜ |  |
| 瀑布流 | 3.1 布局平衡性 | ⬜ |  |
| 瀑布流 | 3.2 搜索后重布局 | ⬜ |  |
| Tab导航 | 4.1 TabBar显示 | ⬜ |  |
| Tab导航 | 4.2 Tab切换 | ⬜ |  |
| 工具页面 | 5.1 卡路里计算器 | ⬜ |  |
| 工具页面 | 5.2 心率计算器 | ⬜ |  |
| 错误处理 | 6.1 网络错误 | ⬜ |  |
| 错误处理 | 6.2 数据为空 | ⬜ |  |

**状态说明：**
- ⬜ 未测试
- ✅ 通过
- ❌ 失败
- ⚠️ 部分通过

---

## 🐛 常见问题排查

### 问题 1：搜索按钮点击无反应
**可能原因：**
- handleSearch 方法未正确绑定
- 导航路径错误

**排查步骤：**
1. 检查 `home.wxml` 的按钮绑定：`bindtap="handleSearch"`
2. 检查 `home.js` 是否定义了 handleSearch 方法
3. 查看控制台是否有错误日志

---

### 问题 2：收藏功能不工作
**可能原因：**
- user_favorites 表未创建
- userService.js 路径错误
- Supabase配置错误

**排查步骤：**
1. 在Supabase控制台检查表是否存在
2. 检查 `community.js` 是否正确引入 userService
3. 查看网络请求是否成功（开发者工具 Network 面板）

---

### 问题 3：瀑布流不平衡
**可能原因：**
- distributeToColumns 算法问题
- 高度估算不准确

**排查步骤：**
1. 检查 `news-center.js` 的高度估算逻辑
2. 在 distributeToColumns 中添加 console.log 查看分配情况
3. 检查数据源是否包含异常数据

---

## ✅ 测试完成检查清单

完成所有测试后，请确认：

- [ ] 所有14个测试用例全部通过
- [ ] 没有控制台错误或警告
- [ ] 所有页面加载速度正常（< 2秒）
- [ ] 所有图标和图片正确显示
- [ ] 所有文字内容无乱码
- [ ] TabBar在所有页面正常显示
- [ ] 页面切换流畅无卡顿
- [ ] 真机测试（至少1台iOS或Android设备）

---

## 📝 测试报告模板

测试完成后，请提供以下信息：

**测试环境：**
- 微信开发者工具版本：
- 测试时间：
- 测试人员：

**测试结果统计：**
- 通过：X / 14
- 失败：X / 14
- 未测试：X / 14

**发现的问题：**
1. [问题描述]
2. [问题描述]

**建议改进：**
1. [改进建议]
2. [改进建议]

---

**祝测试顺利！**如有任何问题，请及时反馈。
