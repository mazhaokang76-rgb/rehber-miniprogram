// pages/login/login.js
const app = getApp();
const { UserManager } = require('../../utils/userManager');
const { HealthQuotesService } = require('../../services/healthQuotesService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: false,
    // 健康语录相关
    healthQuote: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否已经登录
    if (app.isLoggedIn()) {
      this.redirectToHome();
      return;
    }

    // 如果是从分享或其他页面跳转过来，带有参数
    if (options && options.from) {
      console.log('从', options.from, '页面跳转而来');
    }

    // 加载健康语录
    this.loadHealthQuote();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '锐汗步 Rehaber - 轻康复资讯平台',
      path: '/pages/login/login',
      imageUrl: '/assets/share-cover.png'
    };
  },

  // ========== 事件处理函数 ==========

  /**
   * 微信一键登录 - 生成符合格式的手机号
   */
  handleWeChatLogin() {
    this.setData({ loading: true });

    try {
      // 生成符合中国手机号格式的假手机号
      const timestamp = Date.now();
      const randomSuffix = timestamp.toString().slice(-8); // 取时间戳后8位
      const fakePhone = `138${randomSuffix}`; // 138开头 + 8位数字 = 11位手机号
      const userName = `微信用户${timestamp.toString().slice(-4)}`;
      
      console.log('开始微信登录:', { fakePhone, userName });
      
      // 直接调用登录
      this.performSimpleLogin(fakePhone, userName);
      
    } catch (error) {
      console.error('登录初始化失败:', error);
      this.showLoginError('登录初始化失败');
      this.setData({ loading: false });
    }
  },

  /**
   * 执行简单登录
   */
  performSimpleLogin(phoneId, userName) {
    console.log('执行简单登录:', { phoneId, userName });
    
    // 调用app的登录方法
    app.login(phoneId, userName)
      .then(user => {
        console.log('登录成功:', user);
        
        // 显示成功提示
        wx.showToast({
          title: '登录成功！',
          icon: 'success',
          duration: 1500
        });
        
        // 跳转到首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/home',
            success: () => {
              console.log('跳转到首页成功');
            },
            fail: (error) => {
              console.error('跳转失败:', error);
              // 如果switchTab失败，尝试reLaunch
              wx.reLaunch({
                url: '/pages/home/home'
              });
            }
          });
        }, 1600);
        
      })
      .catch(error => {
        console.error('登录失败:', error);
        
        // 检查是否是用户已存在的情况
        if (error.isUserExists || 
            (error.message && error.message.includes('409')) ||
            (error.message && error.message.includes('duplicate'))) {
          
          console.log('用户已存在，视为登录成功');
          
          wx.showToast({
            title: '登录成功！',
            icon: 'success',
            duration: 1500
          });
          
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/home/home'
            });
          }, 1600);
          
        } else {
          this.showLoginError(error.message || '登录失败，请重试');
        }
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 显示登录错误
   */
  showLoginError(message) {
    this.setData({ loading: false });
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  },

  // ========== 工具方法 ==========

  /**
   * 跳转到首页
   */
  redirectToHome() {
    wx.switchTab({
      url: '/pages/home/home',
      fail: (error) => {
        console.error('跳转首页失败:', error);
        // 如果 switchTab 失败，使用普通跳转
        wx.navigateTo({
          url: '/pages/home/home'
        });
      }
    });
  },

  /**
   * 显示用户协议
   */
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '感谢您选择锐汗步康复平台。我们致力于为用户提供专业的康复训练服务，保护用户隐私，遵守相关法律法规。使用本服务即表示您同意我们的用户协议和隐私政策。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  /**
   * 显示隐私政策
   */
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们非常重视您的隐私保护。您的个人信息仅用于提供更好的康复服务，我们不会向第三方泄露您的个人信息。我们会采取合理的安全措施保护您的数据安全。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // ========== 健康语录相关 ==========

  /**
   * 加载健康语录
   */
  loadHealthQuote() {
    console.log('开始加载登录页健康语录...');
    
    HealthQuotesService.getTodayQuote()
      .then(quote => {
        console.log('登录页健康语录加载成功:', quote);
        this.setData({ healthQuote: quote });
      })
      .catch(error => {
        console.error('登录页健康语录加载失败:', error);
        // 设置默认语录
        this.setData({
          healthQuote: {
            id: 'default',
            content: '今天也要保持健康活力！',
            author: '健康小助手',
            category: '康复励志',
            tags: ['健康', '活力']
          }
        });
      });
  }
});