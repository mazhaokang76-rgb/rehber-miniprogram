// test_video_loading.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { cloudService } = require('./services/cloudService.js');

async function testVideoLoading() {
  console.log('🔍 开始测试视频内容加载来源...');
  
  // 使用导出的cloudService实例
  
  try {
    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n1. 测试数据库连接状态...');
    const connectionStatus = await cloudService.checkDatabaseConnection();
    console.log('连接状态:', connectionStatus);
    
    console.log('\n2. 获取视频数据...');
    const videos = await cloudService.getVideos();
    console.log('✅ 获取到视频数量:', videos.length);
    
    console.log('\n3. 视频数据详情:');
    videos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title} (ID: ${video.id})`);
      console.log(`      分类: ${video.category} | 时长: ${video.duration} | 观看: ${video.views}`);
    });
    
    console.log('\n4. 数据来源判断:');
    if (connectionStatus.connected) {
      console.log('✅ 数据来源: Supabase数据库 (连接正常)');
      console.log(`   响应时间: ${connectionStatus.responseTime}ms`);
    } else {
      console.log('⚠️ 数据来源: Mock数据 (数据库连接失败)');
      console.log(`   失败原因: ${connectionStatus.error}`);
    }
    
    console.log('\n5. 验证降级机制:');
    if (videos.length > 0 && videos[0].id && videos[0].id.startsWith('xxxxxxxx')) {
      console.log('✅ 检测到UUID格式ID，确认使用Mock数据');
    } else if (videos.length > 0 && videos[0].id) {
      console.log('✅ 检测到数据库格式ID，确认使用Supabase数据');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 执行测试
testVideoLoading();