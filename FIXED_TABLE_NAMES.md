# 数据库表名修复报告

## 问题诊断
小程序出现404错误是因为代码中使用的表名与实际创建的表名不匹配。

## 修复内容
已在 `miniprogram/services/cloudService.js` 中修复以下表名：

### 修复前 → 修复后
- `videos` → `training_videos`
- `community_events` → `events`

### 具体修复位置
1. **第247行**：`/rest/v1/videos?select=*&is_active=eq.true&order=views.desc` 
   → `/rest/v1/training_videos?select=*&order=views.desc`
   
2. **第1340行**：`/rest/v1/videos?select=*&is_active=eq.true&order=views.desc&limit=5`
   → `/rest/v1/training_videos?select=*&order=views.desc&limit=5`
   
3. **第638行**：`/rest/v1/videos?id=eq.${videoId}&select=*`
   → `/rest/v1/training_videos?id=eq.${videoId}&select=*`
   
4. **第674行**：`/rest/v1/videos?category=eq.${category}&select=*&order=views.desc&limit=${limit}`
   → `/rest/v1/training_videos?category=eq.${category}&select=*&order=views.desc&limit=${limit}`
   
5. **第745行**：`/rest/v1/videos?id=eq.${videoId}`
   → `/rest/v1/training_videos?id=eq.${videoId}`
   
6. **第1342行**：`/rest/v1/community_events?select=*&order=date.desc&limit=3`
   → `/rest/v1/events?select=*&order=date.desc&limit=3`
   
7. **第427行**：`/rest/v1/community_events?select=*&order=date.desc&limit=10`
   → `/rest/v1/events?select=*&order=date.desc&limit=10`

## 数据库验证结果
所有相关表都存在且有数据：

| 表名 | 数据量 | 状态 |
|------|--------|------|
| training_videos | 8条 | ✅ 正常 |
| content | 10条 | ✅ 正常（包含article类型） |
| events | 5条 | ✅ 正常 |
| health_quotes | 26条 | ✅ 正常 |

## 预期效果
修复后应该解决：
- ❌ `404: Could not find the table 'public.community_events'`
- ❌ Supabase API连接失败
- ❌ 新闻/视频详情页面无法加载

## 下一步测试
请重新编译小程序并测试：
1. 首页推荐内容加载
2. 点击新闻进入详情页
3. 点击视频播放
4. 资讯中心内容加载
