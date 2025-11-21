// pages/profile/profile.js
const app = getApp();
const { UserManager, Category } = require('../../utils/types');
const { UserService } = require('../../services/userService');
const { HealthQuotesService } = require('../../services/healthQuotesService');

Page({
  /**
   * 重定向到登录页面
   */
  redirectToLogin() {
    wx.showToast({
      title: '请先登录',
      icon: 'none'
    });
    // 延迟跳转到登录页面
    setTimeout(() => {
      wx.reLaunch({
        url: '/pages/auth/login/login'
      });
    }, 1500);
  },

  /**
   * 页面的初始数据
   */
  data: {
    user: {},
    userProfile: {}, // 用户个人资料（来自Supabase）
    userStats: {
      loginDays: 0,
      subscriptions: 0,
      favoriteCount: 0
    },
    showNicknameModal: false, // 昵称编辑弹窗
    newNickname: '', // 新昵称输入值
    // 健康语录相关
    healthQuote: null, // 当前显示的健康语录
    showQuoteRefresh: false, // 是否显示语录刷新按钮
    categories: [
      { value: Category.REHAB, label: Category.REHAB },
      { value: Category.CORE, label: Category.CORE },
      { value: Category.CARDIO, label: Category.CARDIO },
      { value: Category.OTHER, label: Category.OTHER }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('个人页面加载:', options);
    
    // 检查登录状态
    if (!app.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }

    this.initializePage();
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
    // 页面显示时刷新用户信息
    if (app.isLoggedIn()) {
      this.refreshUserData();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏时的清理工作
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
    this.refreshUserData();
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
      title: '锐汗步 Rehaber - 我的康复训练记录',
      path: '/pages/profile/profile',
      imageUrl: '/assets/share-cover.png'
    };
  },

  // ========== 页面初始化 ==========

  /**
   * 初始化页面
   */
  initializePage() {
    const user = app.getCurrentUser();
    if (!user) {
      this.redirectToLogin();
      return;
    }

    this.setData({ user: user });

    // 加载用户个人资料
    this.loadUserProfile();
    // 更新登录时间
    this.updateLoginDate();
    // 加载统计数据
    this.loadUserStats();
    // 加载健康语录
    this.loadHealthQuote();
  },

  /**
   * 刷新用户数据
   */
  refreshUserData() {
    const user = app.getCurrentUser();
    if (user) {
      this.setData({ user: user });
      this.loadUserProfile();
      this.loadUserStats();
    }
    
    wx.stopPullDownRefresh();
  },

  /**
   * 加载用户个人资料
   */
  loadUserProfile() {
    const user = this.data.user;
    if (!user || (!user.user_id && !user.id)) {
      console.error('用户信息缺失，无法加载资料');
      return;
    }
    UserService.getUserProfile(user.user_id || user.id)
      .then(profile => {
        console.log('加载用户资料成功:', profile);
        this.setData({ userProfile: profile });
      })
      .catch(error => {
        console.error('加载用户资料失败:', error);
      });
  },

  /**
   * 更新登录日期
   */
  updateLoginDate() {
    const user = this.data.user;
    if (!user || (!user.user_id && !user.id)) {
      console.error('用户信息缺失，无法更新登录日期');
      return;
    }
    UserService.updateLoginDate(user.user_id || user.id)
      .then(() => {
        console.log('登录日期更新成功');
        // 重新加载资料以获取最新登录天数
        this.loadUserProfile();
      })
      .catch(error => {
        console.error('更新登录日期失败:', error);
      });
  },

  /**
   * 加载用户统计数据
   */
  loadUserStats() {
    const user = this.data.user;
    
    // 获取收藏数量
    UserService.getUserFavorites(user.user_id || user.id)
      .then(favorites => {
        const favoriteCount = favorites.length;
        
        // 获取用户资料中的登录天数
        UserService.getUserProfile(user.user_id || user.id)
          .then(profile => {
            this.setData({
              userStats: {
                loginDays: profile.total_login_days || 0,
                subscriptions: user.subscriptions ? user.subscriptions.length : 0,
                favoriteCount: favoriteCount
              }
            });
          });
      })
      .catch(error => {
        console.error('加载统计数据失败:', error);
      });
  },

  // ========== 事件处理 ==========

  /**
   * 登出
   */
  handleLogout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要退出登录吗？',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认登出');
          
          app.logout();
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          });

          // 跳转到登录页
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/login'
            });
          }, 1500);
        }
      }
    });
  },

  /**
   * 关于应用
   */
  handleAbout() {
    wx.showModal({
      title: '关于锐汗步 Rehaber',
      content: '锐汗步是一款专业的轻康复资讯平台，专注于为运动爱好者和康复人群提供科学的训练指导和健康资讯。\n\n版本：1.0.2\n发布日期：2024年',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 意见反馈
   */
  handleFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '功能开发中，敬请期待！\n\n您可以通过以下方式联系我们：\n邮箱：feedback@rehaber.com\n微信：RehaberService',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 隐私政策
   */
  handlePrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们非常重视您的隐私保护。\n\n• 我们仅收集必要的用户信息用于提供服务\n• 您的数据将安全存储，不会被第三方获取\n• 您可以随时删除您的账户和数据\n\n详细内容请访问官网查看完整隐私政策。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // ========== 工具方法 ==========

  /**
   * 获取用户头像URL
   */
  getAvatarUrl(userId, name) {
    if (userId && name) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
    }
    return '/assets/default-avatar.png';
  },

  /**
   * 格式化会员等级
   */
  getMemberLevel(loginCount) {
    if (loginCount >= 100) {
      return { level: '钻石会员', color: '#3b82f6', icon: '💎' };
    } else if (loginCount >= 50) {
      return { level: '黄金会员', color: '#fbbf24', icon: '🏆' };
    } else if (loginCount >= 20) {
      return { level: '白银会员', color: '#6b7280', icon: '🥈' };
    } else {
      return { level: '普通会员', color: '#10b981', icon: '🏅' };
    }
  },

  /**
   * 计算连续登录天数
   */
  getConsecutiveDays(loginCount) {
    // 这里可以更精确地计算连续登录天数
    // 暂时返回总登录天数
    return loginCount;
  },

  // ========== 个人资料编辑 ==========

  /**
   * 编辑头像
   */
  handleEditAvatar() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album'];
        
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: sourceType,
          success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            console.log('选择图片成功:', tempFilePath);
            
            // 上传到Supabase Storage
            this.uploadAndUpdateAvatar(tempFilePath);
          },
          fail: (error) => {
            console.error('选择图片失败:', error);
          }
        });
      }
    });
  },

  /**
   * 上传并更新头像
   */
  uploadAndUpdateAvatar(filePath) {
    const user = this.data.user;
    
    wx.showLoading({ title: '上传中...' });
    
    // 先上传图片到Supabase Storage
    UserService.uploadAvatar(filePath, user.user_id || user.id)
      .then(publicUrl => {
        console.log('图片上传成功，URL:', publicUrl);
        // 更新用户资料
        return UserService.updateUserProfile(user.user_id || user.id, { avatar_url: publicUrl });
      })
      .then(() => {
        console.log('头像更新成功');
        this.loadUserProfile();
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success',
          duration: 1500
        });
      })
      .catch(error => {
        console.error('头像更新失败:', error);
        wx.showToast({
          title: '更新失败，请重试',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 编辑昵称
   */
  handleEditNickname() {
    const currentNickname = this.data.userProfile.nickname || this.data.user.name;
    this.setData({
      showNicknameModal: true,
      newNickname: currentNickname
    });
  },

  /**
   * 昵称输入
   */
  onNicknameInput(e) {
    this.setData({ newNickname: e.detail.value });
  },

  /**
   * 保存昵称
   */
  saveNickname() {
    const newNickname = this.data.newNickname.trim();
    
    if (!newNickname) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    if (newNickname.length > 20) {
      wx.showToast({
        title: '昵称不能超过20个字符',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    const user = this.data.user;
    
    wx.showLoading({ title: '保存中...' });
    
    UserService.updateUserProfile(user.user_id || user.id, { nickname: newNickname })
      .then(() => {
        console.log('昵称更新成功');
        this.loadUserProfile();
        
        this.setData({ showNicknameModal: false });
        
        wx.showToast({
          title: '昵称更新成功',
          icon: 'success',
          duration: 1500
        });
      })
      .catch(error => {
        console.error('昵称更新失败:', error);
        wx.showToast({
          title: '更新失败，请重试',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 关闭昵称编辑弹窗
   */
  closeNicknameModal() {
    this.setData({ showNicknameModal: false });
  },

  // ========== 统计卡片交互 ==========

  /**
   * 点击登录天数
   */
  handleLoginDaysClick() {
    const loginDays = this.data.userStats.loginDays;
    wx.showModal({
      title: '登录统计',
      content: `您已累计登录 ${loginDays} 天\n\n继续保持，养成健康习惯！`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 点击订阅主题
   */
  handleSubscriptionsClick() {
    // 跳转到订阅偏好设置页面
    wx.navigateTo({
      url: '/pages/subscription-settings/subscription-settings'
    });
  },

  /**
   * 点击活动收藏
   */
  handleFavoriteClick() {
    // 跳转到社群页的收藏视图
    wx.switchTab({
      url: '/pages/community/community?view=favorites'
    });
  },

  // ========== 健康语录相关 ==========

  /**
   * 加载健康语录
   */
  loadHealthQuote() {
    console.log('开始加载健康语录...');
    
    HealthQuotesService.getTodayQuote()
      .then(quote => {
        console.log('健康语录加载成功:', quote);
        this.setData({
          healthQuote: quote,
          showQuoteRefresh: true
        });
      })
      .catch(error => {
        console.error('健康语录加载失败:', error);
        // 设置默认语录
        this.setData({
          healthQuote: {
            id: 'default',
            content: '今天也要保持健康活力！',
            author: '健康小助手',
            category: '康复励志',
            tags: ['健康', '活力']
          },
          showQuoteRefresh: true
        });
      });
  },

  /**
   * 刷新健康语录
   */
  handleRefreshQuote() {
    wx.showLoading({ title: '获取中...' });
    
    HealthQuotesService.getRandomHealthQuotes(1)
      .then(quotes => {
        if (quotes && quotes.length > 0) {
          this.setData({
            healthQuote: quotes[0]
          });
          
          wx.showToast({
            title: '语录已更新',
            icon: 'success',
            duration: 1000
          });
        }
      })
      .catch(error => {
        console.error('刷新语录失败:', error);
        wx.showToast({
          title: '获取失败，请重试',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 点击健康语录
   */
  handleQuoteClick() {
    const quote = this.data.healthQuote;
    if (!quote) return;

    wx.showModal({
      title: '健康语录',
      content: `${quote.content}\n\n— ${quote.author || '健康小助手'}`,
      showCancel: true,
      cancelText: '换一句',
      confirmText: '收藏',
      success: (res) => {
        if (res.confirm) {
          // 收藏语录功能可以后续添加
          wx.showToast({
            title: '感谢您的支持！',
            icon: 'success',
            duration: 1500
          });
        } else if (res.cancel) {
          // 换一句
          this.handleRefreshQuote();
        }
      }
    });
  },

  /**
   * 长按健康语录显示分享菜单
   */
  handleQuoteLongPress() {
    const quote = this.data.healthQuote;
    if (!quote) return;

    const formattedText = HealthQuotesService.formatQuoteText(quote);
    
    wx.showActionSheet({
      itemList: ['复制语录', '分享给朋友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制语录
          wx.setClipboardData({
            data: formattedText,
            success: () => {
              wx.showToast({
                title: '已复制到剪贴板',
                icon: 'success',
                duration: 1500
              });
            }
          });
        } else if (res.tapIndex === 1) {
          // 分享语录
          wx.shareAppMessage({
            title: '分享一句健康语录',
            path: '/pages/profile/profile',
            imageUrl: '/assets/share-cover.png'
          });
        }
      }
    });
  }
});