// pages/home/home.js
const app = getApp();
const { CloudService } = require('../../services/cloudService');
const { UserService } = require('../../services/userService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    user: {},
    videos: [],
    news: [],
    loading: true,
    favoriteCount: 0,
    contentMode: 'recommended', // 'recommended' 或 'all'
    showPreferenceGuide: false // 是否显示偏好引导
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('首页加载:', options);
    
    // 移除登录要求，允许未登录用户访问首页
    // 检查登录状态（仅用于个性化功能）
    const user = app.isLoggedIn() ? app.getCurrentUser() : null;
    this.setData({ user });
    
    // 加载数据
    this.loadHomeData();
    if (user) {
      this.loadFavoriteCount();
    }
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
      const user = app.getCurrentUser();
      this.setData({ user });
      
      // 刷新收藏数量
      this.loadFavoriteCount();
    }
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
    console.log('下拉刷新');
    this.loadHomeData(true);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里实现上拉加载更多
    console.log('上拉触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '锐汗步 Rehaber - 专业康复训练平台',
      path: '/pages/home/home',
      imageUrl: '/assets/share-cover.png'
    };
  },

  // ========== 数据加载 ==========

  /**
   * 加载首页数据
   */
  loadHomeData(isRefresh = false) {
    if (!isRefresh) {
      this.setData({ loading: true });
    }

    const user = app.getCurrentUser();
    
    // 如果用户已登录且有偏好
    if (user && user.subscriptions && user.subscriptions.length > 0) {
      this.setData({ showPreferenceGuide: false });
      // 加载推荐内容
      this.loadRecommendedContent(user.subscriptions, isRefresh);
    } else {
      // 加载公开内容（不要求登录）
      this.setData({ showPreferenceGuide: !user });
      this.loadPublicContent(isRefresh);
    }
  },

  /**
   * 加载公开内容（无需登录）
   */
  loadPublicContent(isRefresh) {
    Promise.all([
      CloudService.getVideos([]),
      CloudService.getNews([])
    ]).then(([videos, news]) => {
      this.setData({
        videos: videos || [],
        news: news || [],
        loading: false
      });

      if (isRefresh) {
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1000
        });
      }

      console.log('公开内容加载完成:', {
        videos: videos.length,
        news: news.length,
        mode: 'public'
      });
    }).catch((error) => {
      console.error('加载公开内容失败:', error);
      this.handleLoadError('网络错误', isRefresh);
    });
  },

  /**
   * 加载推荐内容
   */
  loadRecommendedContent(userPreferences, isRefresh) {
    const user = app.getCurrentUser();
    
    // 修复方法调用：传递正确的参数格式 (userId, preferences)
    CloudService.getRecommendedContent(user.user_id, { 
      preferences: userPreferences, 
      limit: 20 
    })
      .then(contents => {
        console.log('推荐内容返回结果:', contents);
        
        // 验证返回数据
        if (!contents || !Array.isArray(contents)) {
          console.warn('返回数据格式异常，使用默认值');
          this.setData({
            videos: [],
            news: [],
            loading: false
          });
          if (isRefresh) {
            wx.stopPullDownRefresh();
          }
          return;
        }

        // 分离视频和资讯
        const videos = contents.filter(c => c.type === 'video').slice(0, 10);
        const news = contents.filter(c => c.type === 'article').slice(0, 10);

        this.setData({
          videos: videos || [],
          news: news || [],
          loading: false
        });

        if (isRefresh) {
          wx.stopPullDownRefresh();
          wx.showToast({
            title: '刷新成功',
            icon: 'success',
            duration: 1000
          });
        }

        console.log('推荐内容加载完成:', {
          videos: videos.length,
          news: news.length,
          total: contents.length,
          mode: 'recommended'
        });
      })
      .catch(error => {
        console.error('加载推荐内容失败:', error);
        
        // 改进错误处理：提供更详细的错误信息
        let errorMsg = '网络错误，请稍后重试';
        if (error.message) {
          if (error.message.includes('network') || error.message.includes('timeout')) {
            errorMsg = '网络连接失败，请检查网络设置';
          } else if (error.message.includes('auth') || error.message.includes('login')) {
            errorMsg = '登录已过期，请重新登录';
            // 延迟跳转登录页
            setTimeout(() => {
              this.redirectToLogin();
            }, 2000);
            return; // 不继续执行后续错误处理
          }
        }
        
        this.handleLoadError(errorMsg, isRefresh);
      });
  },

  /**
   * 加载全部内容
   */
  loadAllContent(userSubscriptions, isRefresh) {
    // 并行加载视频和资讯数据
    Promise.all([
      CloudService.getVideos(userSubscriptions),
      CloudService.getNews(userSubscriptions)
    ]).then(([videos, news]) => {
      this.setData({
        videos: videos || [],
        news: news || [],
        loading: false
      });

      if (isRefresh) {
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1000
        });
      }

      console.log('首页数据加载完成:', {
        videos: videos.length,
        news: news.length,
        mode: 'all'
      });
    }).catch((error) => {
      console.error('加载首页数据失败:', error);
      this.handleLoadError('网络错误', isRefresh);
    });
  },

  /**
   * 处理加载错误
   */
  handleLoadError(errorMessage, isRefresh) {
    this.setData({ 
      videos: [],
      news: [],
      loading: false 
    });

    if (isRefresh) {
      wx.stopPullDownRefresh();
    }

    wx.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none',
      duration: 2500
    });
  },

  // ========== 事件处理 ==========

  /**
   * 搜索按钮点击
   */
  handleSearch() {
    // 跳转到资讯页，打开搜索面板
    wx.switchTab({
      url: '/pages/news-center/news-center',
      success: () => {
        // 通过全局数据传递搜索状态
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.openSearch = true;
      }
    });
  },

  /**
   * 通知按钮点击
   */
  handleNotification() {
    // 检查登录状态，收藏功能需要登录
    if (!app.isLoggedIn()) {
      wx.showModal({
        title: '登录提示',
        content: '登录后可查看收藏的内容',
        confirmText: '立即登录',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      return;
    }

    // 已登录，跳转到社区页，显示收藏的活动
    wx.switchTab({
      url: '/pages/community/community',
      success: () => {
        // 通过全局数据传递显示收藏状态
        const app = getApp();
        app.globalData = app.globalData || {};
        app.globalData.showFavorites = true;
      }
    });
  },

  /**
   * 视频卡片点击
   */
  handleVideoTap(e) {
    const video = e.currentTarget.dataset.video;
    if (!video) return;

    console.log('点击视频:', video);

    // 检查登录状态，如果未登录则显示登录提示
    if (!app.isLoggedIn()) {
      wx.showModal({
        title: '登录提示',
        content: '登录后可观看完整视频并保存收藏',
        confirmText: '立即登录',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          } else {
            // 仍然可以观看公开部分
            this.showVideoPreview(video);
          }
        }
      });
      return;
    }

    // 已登录，跳转到视频详情页
    wx.navigateTo({
      url: `/pages/video-detail/video-detail?id=${video.id}`,
      success: () => {
        console.log('跳转到视频详情页');
      },
      fail: (error) => {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 显示视频预览（未登录状态）
   */
  showVideoPreview(video) {
    wx.showToast({
      title: '请登录后观看完整视频',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 资讯卡片点击
   */
  handleNewsTap(e) {
    const news = e.currentTarget.dataset.news;
    if (!news) return;

    console.log('点击资讯:', news);

    // 资讯可以公开查看，无需登录
    // 跳转到资讯详情页
    wx.navigateTo({
      url: `/pages/news-detail/news-detail?id=${news.id}`,
      success: () => {
        console.log('跳转到资讯详情页');
      },
      fail: (error) => {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 切换内容模式
   */
  switchContentMode(e) {
    const mode = e.currentTarget.dataset.mode;
    
    if (mode === this.data.contentMode) {
      return; // 已经是当前模式，不需要切换
    }

    this.setData({ contentMode: mode });
    
    // 重新加载数据
    this.loadHomeData();
  },

  /**
   * 设置偏好
   */
  handleSetPreference() {
    wx.navigateTo({
      url: '/pages/subscription-settings/subscription-settings'
    });
  },

  // ========== 工具方法 ==========

  /**
   * 跳转到登录页
   */
  redirectToLogin() {
    wx.reLaunch({
      url: '/pages/login/login'
    });
  },

  /**
   * 格式化数字（添加千分位分隔符）
   */
  formatNumber(num) {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  },

  /**
   * 格式化日期
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  },

  /**
   * 截断文本
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * 加载收藏数量
   */
  loadFavoriteCount() {
    const user = app.getCurrentUser();
    if (!user || !user.id) {
      this.setData({ favoriteCount: 0 });
      return;
    }

    UserService.getUserFavorites(user.id)
      .then(favorites => {
        this.setData({
          favoriteCount: favorites ? favorites.length : 0
        });
        console.log('收藏数量加载完成:', favorites.length);
      })
      .catch(error => {
        console.error('加载收藏数量失败:', error);
        this.setData({ favoriteCount: 0 });
      });
  },

});