// app.js
const { UserManager } = require('./utils/userManager');
const { CloudService } = require('./services/cloudService');

App({
  globalData: {
    user: null,
    isLogin: false,
    isInitialized: false
  },

  onLaunch(options) {
    console.log('App launch', options);
    
    // 初始化云服务
    this.initCloudService();
    
    // 检查用户登录状态
    this.checkLoginStatus();
  },

  onShow(options) {
    console.log('App show', options);
  },

  onHide() {
    console.log('App hide');
  },

  onError(msg) {
    console.error('App error:', msg);
  },

  // 初始化云服务
  initCloudService() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'your-cloud-env-id', // 请替换为你的云环境ID
        traceUser: true,
      });
      
      CloudService.initialize();
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    return new Promise((resolve, reject) => {
      try {
        const userManager = new UserManager();
        const savedUser = userManager.getSavedUser();
        
        if (savedUser) {
          this.globalData.user = savedUser;
          this.globalData.isLogin = true;
          
          // 验证用户是否仍然有效
          userManager.validateUser(savedUser)
            .then(isValid => {
              if (isValid) {
                console.log('用户已登录:', savedUser.name);
                this.globalData.isInitialized = true;
                resolve(savedUser);
              } else {
                // 用户数据无效，清除本地存储
                this.logout();
                resolve(null);
              }
            })
            .catch(error => {
              console.error('验证用户失败:', error);
              this.logout();
              reject(error);
            });
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
        this.logout();
        reject(error);
      }
    });
  },

  // 登录
  login(phone, name) {
    return new Promise((resolve, reject) => {
      wx.showLoading({
        title: '登录中...',
        mask: true
      });

      const userManager = new UserManager();
      userManager.login(phone, name)
        .then(user => {
          this.globalData.user = user;
          this.globalData.isLogin = true;
          
          wx.hideLoading();
          wx.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          });

          resolve(user);
        })
        .catch(error => {
          wx.hideLoading();
          console.error('登录失败:', error);
          
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none',
            duration: 2000
          });
          
          reject(error);
        });
    });
  },

  // 登出
  logout() {
    const userManager = new UserManager();
    userManager.clearUser();
    
    this.globalData.user = null;
    this.globalData.isLogin = false;
    this.globalData.isInitialized = false;
    
    console.log('用户已登出');
  },

  // 更新用户信息
  updateUser(user) {
    this.globalData.user = user;
    
    const userManager = new UserManager();
    userManager.saveUser(user);
  },

  // 获取当前用户
  getCurrentUser() {
    return this.globalData.user;
  },

  // 检查是否已登录
  isLoggedIn() {
    return this.globalData.isLogin && this.globalData.user;
  },

  // 检查是否已初始化
  isAppInitialized() {
    return this.globalData.isInitialized;
  }
});