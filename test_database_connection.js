// test_database_connection.js
const CloudService = require('./services/cloudService');

/**
 * 简单测试数据库连接
 */
async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...');
  
  const cloudService = new CloudService();
  
  // 等待初始化完成
  setTimeout(async () => {
    try {
      console.log('1. 测试训练视频表连接...');
      const videos = await cloudService.getVideosFromSupabase();
      console.log('✅ 视频表连接成功，获取到', videos?.length || 0, '条数据');
      
      console.log('2. 测试健康资讯表连接...');
      const news = await cloudService.getNewsFromSupabase();
      console.log('✅ 资讯表连接成功，获取到', news?.length || 0, '条数据');
      
      console.log('3. 测试活动表连接...');
      const events = await cloudService.getEventsFromSupabase();
      console.log('✅ 活动表连接成功，获取到', events?.length || 0, '条数据');
      
      console.log('4. 测试健康语句表连接...');
      const quotes = await cloudService.getHealthQuotesFromSupabase(5);
      console.log('✅ 健康语句表连接成功，获取到', quotes?.length || 0, '条数据');
      
      console.log('🎉 所有数据库表连接测试完成！');
      
    } catch (error) {
      console.error('❌ 数据库连接测试失败:', error);
      console.error('错误详情:', error.message);
    }
  }, 2000); // 等待2秒初始化
}

// 执行测试
testDatabaseConnection();
