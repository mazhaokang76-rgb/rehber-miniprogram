// pages/community/community.js
const app = getApp();
const { CloudService } = require('../../services/cloudService');
const { UserService } = require('../../services/userService');
const { ShareService } = require('../../services/shareService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    events: [],
    loading: false,
    loadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    showFavorites: false, // 是否显示收藏模式
    favoriteEvents: [], // 收藏的活动
    favoriteMap: {}, // 收藏状态映射 {eventId: true/false}
    favoriteCount: 0, // 收藏总数
    currentActivity: null // 当前选中的活动（用于分享）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('社区页面加载:', options);
    
    // 检查登录状态
    if (!app.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }

    // 检查是否有特定活动ID（从分享进入）
    if (options.activityId) {
      // 加载特定活动并显示详情
      this.loadActivityDetail(options.activityId);
    }

    // 检查是否显示收藏
    if (options.favorites === 'true') {
      this.setData({ showFavorites: true });
      this.loadFavoriteEvents();
    } else {
      this.loadEvents();
    }

    // 加载收藏状态
    this.loadFavoriteStatus();

    // 启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
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
    // 检查是否需要显示收藏（从首页通知跳转）
    const app = getApp();
    if (app.globalData && app.globalData.showFavorites) {
      this.setData({ showFavorites: true });
      this.loadFavoriteEvents();
      // 清除标记
      app.globalData.showFavorites = false;
    } else if (app.isLoggedIn() && !this.data.showFavorites) {
      // 正常模式，刷新数据
      this.refreshEvents();
    }

    // 刷新收藏状态
    this.loadFavoriteStatus();
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
    console.log('下拉刷新社区数据');
    this.refreshEvents();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('上拉触底，加载更多');
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMoreEvents();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '锐汗步社区 - 发现更多康复活动',
      path: '/pages/community/community',
      imageUrl: '/assets/share-cover.png'
    };
  },

  // ========== 数据加载 ==========

  /**
   * 加载活动数据
   */
  loadEvents(isRefresh = false) {
    const processSuccess = (events) => {
      this.setData({
        events: events || [],
        loading: false,
        page: 1,
        hasMore: true
      });

      console.log('社区活动数据加载完成:', events.length);
    };

    const processError = (error) => {
      console.error('加载社区活动失败:', error);
      
      if (isRefresh) {
        wx.stopPullDownRefresh();
      } else {
        this.setData({ loading: false });
      }

      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      });
    };

    if (!isRefresh) {
      this.setData({ loading: true });
    }

    return CloudService.getEvents()
      .then(processSuccess)
      .catch(processError);
  },

  /**
   * 刷新活动数据
   */
  refreshEvents() {
    if (this.data.showFavorites) {
      return this.loadFavoriteEvents();
    } else {
      return this.loadEvents(true);
    }
  },

  /**
   * 加载收藏的活动
   */
  loadFavoriteEvents() {
    this.setData({ loading: true });

    const user = app.getCurrentUser();
    if (!user || !user.id) {
      this.setData({ 
        loading: false,
        favoriteEvents: [] 
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    UserService.getUserFavorites(user.id)
      .then(favorites => {
        this.setData({
          favoriteEvents: favorites || [],
          loading: false
        });

        if (favorites.length === 0) {
          wx.showToast({
            title: '没有收藏的活动，去看看你感兴趣的吧',
            icon: 'none',
            duration: 2000
          });
        }

        console.log('收藏活动加载完成:', favorites.length);
      })
      .catch(error => {
        console.error('加载收藏活动失败:', error);
        this.setData({ 
          loading: false,
          favoriteEvents: [] 
        });
        
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
          duration: 2500
        });
      });
  },

  /**
   * 加载更多活动
   */
  loadMoreEvents() {
    if (this.data.loadingMore) return;

    this.setData({ loadingMore: true });

    const processSuccess = (moreEvents) => {
      // 模拟分页加载（实际项目中需要后端支持分页）
      const currentEvents = this.data.events;
      
      // 合并数据（这里简单处理，实际应该分页）
      const newEvents = [...currentEvents, ...moreEvents];

      this.setData({
        events: newEvents,
        loadingMore: false,
        hasMore: newEvents.length >= 20 // 假设每页20条
      });
    };

    const processError = (error) => {
      console.error('加载更多活动失败:', error);
      this.setData({ loadingMore: false });

      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 1500
      });
    };

    return CloudService.getEvents()
      .then(processSuccess)
      .catch(processError);
  },

  // ========== 事件处理 ==========

  /**
   * 添加活动按钮点击
   */
  handleAddActivity() {
    if (!app.isLoggedIn()) {
      this.redirectToLogin();
      return;
    }

    wx.showModal({
      title: '发布活动',
      content: '功能开发中，敬请期待！',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 活动卡片点击
   */
  handleActivityTap(e) {
    const activity = e.currentTarget.dataset.activity;
    if (!activity) return;

    console.log('点击活动:', activity);

    // 显示活动详情（可以使用模态框或跳转到详情页）
    this.showActivityDetail(activity);
  },

  /**
   * 点赞按钮点击
   */
  handleLike(e) {
    e.stopPropagation(); // 阻止事件冒泡

    const activity = e.currentTarget.dataset.activity;
    if (!activity) return;

    console.log('点赞活动:', activity.id);

    // 更新点赞数（乐观更新）
    const events = this.data.events.map(event => {
      if (event.id === activity.id) {
        const isLiked = this.isActivityLiked(activity.id);
        return {
          ...event,
          likes: isLiked ? event.likes - 1 : event.likes + 1
        };
      }
      return event;
    });

    this.setData({ events });

    // 保存点赞状态到本地
    this.saveLikeStatus(activity.id, !this.isActivityLiked(activity.id));

    wx.showToast({
      title: this.isActivityLiked(activity.id) ? '取消点赞' : '点赞成功',
      icon: 'success',
      duration: 1000
    });
  },

  // ========== 工具方法 ==========

  /**
   * 显示活动详情
   */
  showActivityDetail(activity) {
    const content = `活动名称：${activity.title}\n时间：${activity.time}\n地点：${activity.location}\n发起人：${activity.userName}`;
    
    wx.showModal({
      title: '活动详情',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /**
   * 检查活动是否已点赞
   */
  isActivityLiked(activityId) {
    try {
      const likedActivities = wx.getStorageSync('liked_activities') || [];
      return likedActivities.includes(activityId);
    } catch (error) {
      console.error('获取点赞状态失败:', error);
      return false;
    }
  },

  /**
   * 保存点赞状态
   */
  saveLikeStatus(activityId, isLiked) {
    try {
      let likedActivities = wx.getStorageSync('liked_activities') || [];
      
      if (isLiked) {
        if (!likedActivities.includes(activityId)) {
          likedActivities.push(activityId);
        }
      } else {
        likedActivities = likedActivities.filter(id => id !== activityId);
      }

      wx.setStorageSync('liked_activities', likedActivities);
    } catch (error) {
      console.error('保存点赞状态失败:', error);
    }
  },

  /**
   * 跳转到登录页
   */
  redirectToLogin() {
    wx.reLaunch({
      url: '/pages/login/login'
    });
  },

  /**
   * 格式化时间
   */
  formatTime(timeString) {
    if (!timeString) return '';
    
    const now = new Date();
    const time = new Date(timeString);
    const diffTime = now - time;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return time.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  },

  /**
   * 获取活动状态颜色
   */
  getActivityStatusColor(status) {
    const colors = {
      'upcoming': '#10b981',
      'ongoing': '#f59e0b',
      'completed': '#6b7280'
    };
    return colors[status] || '#10b981';
  },

  /**
   * 获取活动状态文本
   */
  getActivityStatusText(status) {
    const texts = {
      'upcoming': '即将开始',
      'ongoing': '正在进行',
      'completed': '已结束'
    };
    return texts[status] || '即将开始';
  },

  // ========== 收藏功能 ==========

  /**
   * 加载收藏状态
   */
  loadFavoriteStatus() {
    const user = app.getCurrentUser();
    if (!user || !user.id) {
      return;
    }

    UserService.getUserFavorites(user.id)
      .then(favorites => {
        // 构建收藏状态映射
        const favoriteMap = {};
        favorites.forEach(fav => {
          if (fav.id) {
            favoriteMap[fav.id] = true;
          }
        });

        this.setData({
          favoriteMap,
          favoriteCount: favorites.length
        });

        console.log('收藏状态加载完成:', favorites.length);
      })
      .catch(error => {
        console.error('加载收藏状态失败:', error);
      });
  },

  /**
   * 处理收藏按钮点击
   */
  handleFavorite(e) {
    const activity = e.currentTarget.dataset.activity;
    if (!activity) return;

    const user = app.getCurrentUser();
    if (!user || !user.id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const isFavorited = this.data.favoriteMap[activity.id];
    
    if (isFavorited) {
      // 取消收藏
      this.removeFavorite(user.id, activity.id);
    } else {
      // 添加收藏
      this.addFavorite(user.id, activity);
    }
  },

  /**
   * 添加收藏
   */
  addFavorite(userId, activity) {
    // 乐观更新UI
    const newFavoriteMap = { ...this.data.favoriteMap };
    newFavoriteMap[activity.id] = true;
    
    this.setData({
      favoriteMap: newFavoriteMap,
      favoriteCount: this.data.favoriteCount + 1
    });

    // 调用API
    UserService.addFavorite(userId, activity.id, activity)
      .then(() => {
        wx.showToast({
          title: '收藏成功',
          icon: 'success',
          duration: 1500
        });
      })
      .catch(error => {
        console.error('收藏失败:', error);
        
        // 回滚UI
        const rollbackMap = { ...this.data.favoriteMap };
        delete rollbackMap[activity.id];
        
        this.setData({
          favoriteMap: rollbackMap,
          favoriteCount: this.data.favoriteCount - 1
        });

        wx.showToast({
          title: '收藏失败，请重试',
          icon: 'none',
          duration: 2000
        });
      });
  },

  /**
   * 取消收藏
   */
  removeFavorite(userId, activityId) {
    // 乐观更新UI
    const newFavoriteMap = { ...this.data.favoriteMap };
    delete newFavoriteMap[activityId];
    
    this.setData({
      favoriteMap: newFavoriteMap,
      favoriteCount: this.data.favoriteCount - 1
    });

    // 调用API
    UserService.removeFavorite(userId, activityId)
      .then(() => {
        wx.showToast({
          title: '已取消收藏',
          icon: 'success',
          duration: 1500
        });

        // 如果在收藏页面，同时从列表中移除
        if (this.data.showFavorites) {
          const newFavoriteEvents = this.data.favoriteEvents.filter(
            event => event.id !== activityId
          );
          this.setData({ favoriteEvents: newFavoriteEvents });
        }
      })
      .catch(error => {
        console.error('取消收藏失败:', error);
        
        // 回滚UI
        const rollbackMap = { ...this.data.favoriteMap };
        rollbackMap[activityId] = true;
        
        this.setData({
          favoriteMap: rollbackMap,
          favoriteCount: this.data.favoriteCount + 1
        });

        wx.showToast({
          title: '取消失败，请重试',
          icon: 'none',
          duration: 2000
        });
      });
  },

  /**
   * 显示全部活动
   */
  handleShowAll() {
    if (!this.data.showFavorites) return;
    
    this.setData({ showFavorites: false });
    this.loadEvents();
  },

  /**
   * 显示收藏的活动
   */
  handleShowFavorites() {
    if (this.data.showFavorites) return;
    
    this.setData({ showFavorites: true });
    this.loadFavoriteEvents();
  },

  /**
   * 加载活动详情（从分享进入）
   */
  loadActivityDetail(activityId) {
    CloudService.getEvents()
      .then(events => {
        const activity = events.find(e => e.id === activityId);
        if (activity) {
          this.setData({ currentActivity: activity });
          // 可以在这里显示活动详情弹窗
          wx.showToast({
            title: '已找到活动',
            icon: 'success'
          });
        }
      })
      .catch(error => {
        console.error('加载活动详情失败:', error);
      });
  },

  /**
   * 处理活动分享按钮点击
   */
  handleShareActivity(e) {
    const activity = e.currentTarget.dataset.activity;
    if (!activity) return;

    this.setData({ currentActivity: activity });
    ShareService.showShareMenu('activity', activity);
  },

  /**
   * 用户点击右上角分享给朋友
   */
  onShareAppMessage() {
    // 使用当前活动或第一个活动作为分享内容
    const activity = this.data.currentActivity || this.data.events[0];
    
    if (!activity) {
      return {
        title: '锐汗步 - 康复训练社区',
        path: '/pages/community/community'
      };
    }

    const shareConfig = ShareService.configShareMessage('activity', activity);
    
    // 记录分享行为
    ShareService.logShareAction('activity', activity.id, 'friend');
    
    return {
      ...shareConfig,
      success: () => {
        ShareService.showShareSuccess();
      },
      fail: () => {
        ShareService.showShareFail();
      }
    };
  },

  /**
   * 用户点击右上角分享到朋友圈
   */
  onShareTimeline() {
    // 使用当前活动或第一个活动作为分享内容
    const activity = this.data.currentActivity || this.data.events[0];
    
    if (!activity) {
      return {
        title: '锐汗步 - 康复训练社区',
        query: ''
      };
    }

    const shareConfig = ShareService.configShareTimeline('activity', activity);
    
    // 记录分享行为
    ShareService.logShareAction('activity', activity.id, 'timeline');
    
    return {
      ...shareConfig,
      success: () => {
        ShareService.showShareSuccess();
      },
      fail: () => {
        ShareService.showShareFail();
      }
    };
  }
});