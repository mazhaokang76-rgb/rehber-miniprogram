// pages/test-api/test-api.js
const { CloudService } = require('../../services/cloudService');

Page({
  data: {
    testResults: [],
    isLoading: false
  },

  onLoad() {
    this.cloudService = CloudService;
  },

  // 测试Supabase连接
  testSupabaseConnection() {
    this.setData({ isLoading: true });
    
    // 连续测试所有API
    Promise.resolve()
      .then(() => {
        return new Promise((resolve, reject) => {
          this.cloudService.getVideos()
            .then(resolve)
            .catch(reject);
        });
      })
      .then(videos => {
        console.log('测试获取视频结果:', videos);
        return new Promise((resolve, reject) => {
          this.cloudService.getNews()
            .then(news => {
              resolve({ videos, news });
            })
            .catch(reject);
        });
      })
      .then(({ videos, news }) => {
        return new Promise((resolve, reject) => {
          this.cloudService.getEvents()
            .then(events => {
              resolve({ videos, news, events });
            })
            .catch(reject);
        });
      })
      .then(({ videos, news, events }) => {
        const results = [
          {
            name: '训练视频数据',
            status: videos && videos.length > 0 ? '✅ 成功' : '❌ 失败',
            count: videos ? videos.length : 0,
            data: videos && videos.length > 0 ? videos[0] : null
          },
          {
            name: '健康资讯数据', 
            status: news && news.length > 0 ? '✅ 成功' : '❌ 失败',
            count: news ? news.length : 0,
            data: news && news.length > 0 ? news[0] : null
          },
          {
            name: '社区活动数据',
            status: events && events.length > 0 ? '✅ 成功' : '❌ 失败', 
            count: events ? events.length : 0,
            data: events && events.length > 0 ? events[0] : null
          }
        ];
        
        this.setData({
          testResults: results,
          isLoading: false
        });
        
        wx.showToast({
          title: '测试完成',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('API测试失败:', error);
        this.setData({
          testResults: [{
            name: '测试失败',
            status: '❌ 错误',
            count: 0,
            error: error.message || error
          }],
          isLoading: false
        });
        
        wx.showToast({
          title: '测试失败',
          icon: 'error'
        });
      });
  },

  // 测试用户创建
  testUserCreation() {
    this.setData({ isLoading: true });
    
    // 使用固定的测试手机号
    const testUser = {
      name: '测试用户',
      phone: '13800138000',
      avatar: '',
      login_count: 1,
      subscriptions: ['运动复健', '核心训练']
    };
    
    console.log('开始测试用户创建，手机号:', testUser.phone);
    
    // 直接尝试创建用户，处理409错误
    this.cloudService.createUser(testUser)
      .then(result => {
        console.log('✅ 用户创建成功:', result);
        wx.showToast({
          title: '✅ 用户创建成功',
          icon: 'success'
        });
        this.setData({ isLoading: false });
      })
      .catch(error => {
        console.log('错误详情:', error);
        
        // 检查是否是409错误（用户已存在）
        if (error.message && error.message.includes('409')) {
          console.log('✅ 用户已存在，这是正常情况');
          wx.showToast({
            title: '✅ 用户已存在（正常）',
            icon: 'success',
            duration: 2000
          });
        } 
        // 检查是否是duplicate key错误
        else if (error.message && error.message.includes('duplicate key')) {
          console.log('✅ 用户已存在，这是正常情况');
          wx.showToast({
            title: '✅ 用户已存在（正常）',
            icon: 'success', 
            duration: 2000
          });
        }
        // 其他真正的错误
        else {
          console.error('❌ 真正的错误:', error);
          wx.showToast({
            title: '❌ 创建失败',
            icon: 'error'
          });
        }
        
        this.setData({ isLoading: false });
      });
  }
});