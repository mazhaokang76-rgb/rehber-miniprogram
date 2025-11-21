// pages/subscription-settings/subscription-settings.js
const app = getApp();
const { UserManager, Category } = require('../../utils/types');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    selectedSubscriptions: [],
    originalSubscriptions: [], // 保存原始订阅状态
    saving: false,
    categories: [
      { 
        value: Category.REHAB, 
        label: Category.REHAB,
        icon: '🏃',
        description: '康复训练与恢复指导'
      },
      { 
        value: Category.CORE, 
        label: Category.CORE,
        icon: '💪',
        description: '核心力量与稳定性训练'
      },
      { 
        value: Category.CARDIO, 
        label: Category.CARDIO,
        icon: '❤️',
        description: '有氧运动与心肺功能'
      },
      { 
        value: Category.OTHER, 
        label: Category.OTHER,
        icon: '🎯',
        description: '其他健康相关内容'
      }
    ],
    recommendedTopics: [], // 推荐主题
    selectedCount: 0,
    totalCount: 4
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    if (!app.isLoggedIn()) {
      wx.reLaunch({
        url: '/pages/login/login'
      });
      return;
    }

    this.initializePage();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    if (app.isLoggedIn()) {
      this.refreshSubscriptions();
    }
  },

  /**
   * 初始化页面
   */
  initializePage() {
    const user = app.getCurrentUser();
    if (!user) {
      return;
    }

    // 安全地获取订阅数据
    const userSubscriptions = user.subscriptions || [];
    const originalSubs = [...userSubscriptions];
    
    this.setData({ 
      selectedSubscriptions: originalSubs,
      originalSubscriptions: originalSubs,
      selectedCount: originalSubs.length
    });

    // 生成推荐主题
    this.generateRecommendations();
  },

  /**
   * 刷新订阅数据
   */
  refreshSubscriptions() {
    const user = app.getCurrentUser();
    if (user) {
      const userSubscriptions = user.subscriptions || [];
      
      this.setData({ 
        selectedSubscriptions: [...userSubscriptions],
        originalSubscriptions: [...userSubscriptions],
        selectedCount: userSubscriptions.length
      });
      this.generateRecommendations();
    }
  },

  /**
   * 生成推荐主题
   */
  generateRecommendations() {
    const allCategories = this.data.categories;
    const subscribed = this.data.selectedSubscriptions;
    
    // 推荐未订阅的主题
    const recommended = allCategories
      .filter(cat => !subscribed.includes(cat.value))
      .slice(0, 2); // 最多推荐2个
    
    this.setData({ recommendedTopics: recommended });
  },

  /**
   * 切换订阅
   */
  toggleSubscription(e) {
    const category = e.currentTarget.dataset.category;
    const currentSubs = this.data.selectedSubscriptions;
    
    let newSubs;
    if (currentSubs.includes(category)) {
      // 取消订阅
      newSubs = currentSubs.filter(sub => sub !== category);
    } else {
      // 添加订阅
      newSubs = [...currentSubs, category];
    }

    this.setData({
      selectedSubscriptions: newSubs,
      selectedCount: newSubs.length
    });

    // 更新推荐
    this.generateRecommendations();
  },

  /**
   * 检查是否已订阅
   */
  isSubscribed(category) {
    return this.data.selectedSubscriptions.includes(category);
  },

  /**
   * 保存设置 - 增强版本，增加重试机制和事务性更新
   */
  handleSave() {
    if (this.data.saving) {
      console.log('保存正在进行中，忽略重复请求');
      return;
    }

    const newSubs = this.data.selectedSubscriptions;
    const originalSubs = this.data.originalSubscriptions;

    // 检查是否至少选择一个主题
    if (newSubs.length === 0) {
      wx.showToast({
        title: '请至少选择一个主题',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 如果没有变化，直接返回
    if (this.arraysEqual(newSubs, originalSubs)) {
      console.log('没有更改，直接返回');
      wx.navigateBack();
      return;
    }

    this.setData({ saving: true });

    // 显示保存进度
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    this.performSaveWithRetry(newSubs, 3); // 最多重试3次
  },

  /**
   * 带重试机制的保存操作
   */
  performSaveWithRetry(newSubs, maxRetries) {
    const userManager = new UserManager();
    const user = app.getCurrentUser();

    if (!user) {
      this.handleSaveError('用户信息丢失，请重新登录');
      return;
    }

    userManager.updateSubscriptions(user.user_id || user.id, newSubs)
      .then((updatedUser) => {
        console.log('订阅偏好保存成功:', updatedUser);
        
        // 更新全局用户数据
        app.updateUser(updatedUser);

        // 尝试刷新前一个页面的数据
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2]; // 获取前一个页面
        
        if (prevPage && prevPage.route === 'pages/profile/profile') {
          // 如果是 profile 页面，刷新其数据
          if (typeof prevPage.refreshUserData === 'function') {
            prevPage.refreshUserData();
          } else if (typeof prevPage.loadUserStats === 'function') {
            prevPage.loadUserStats();
          }
        }

        // 更新本地状态
        this.setData({
          originalSubscriptions: [...newSubs], // 更新原始订阅状态
          saving: false
        });

        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch((error) => {
        console.error('保存订阅设置失败 (第1次尝试):', error);
        
        // 如果还有重试次数，继续重试
        if (maxRetries > 1) {
          console.log(`正在重试... 剩余 ${maxRetries - 1} 次`);
          setTimeout(() => {
            this.performSaveWithRetry(newSubs, maxRetries - 1);
          }, 1000); // 1秒后重试
        } else {
          this.handleSaveError(error.message || '保存失败，请重试');
        }
      });
  },

  /**
   * 处理保存错误
   */
  handleSaveError(errorMessage) {
    this.setData({ saving: false });
    wx.hideLoading();
    
    // 根据错误类型提供不同的用户提示
    let title = '保存失败';
    let content = errorMessage;

    if (errorMessage.includes('network') || errorMessage.includes('网络')) {
      title = '网络错误';
      content = '网络连接失败，请检查网络设置后重试';
    } else if (errorMessage.includes('auth') || errorMessage.includes('认证')) {
      title = '登录过期';
      content = '登录已过期，请重新登录';
    } else if (errorMessage.includes('permission') || errorMessage.includes('权限')) {
      title = '权限不足';
      content = '没有权限执行此操作';
    } else if (errorMessage.includes('用户不存在')) {
      title = '用户错误';
      content = '用户信息异常，请重新登录';
    }

    wx.showModal({
      title: title,
      content: `${content}\n\n是否要重新尝试保存？`,
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 重新尝试保存
          this.handleSave();
        }
      }
    });
  },

  /**
   * 取消操作
   */
  handleCancel() {
    // 检查是否有未保存的更改
    const hasChanges = !this.arraysEqual(
      this.data.selectedSubscriptions, 
      this.data.originalSubscriptions
    );

    if (hasChanges) {
      wx.showModal({
        title: '确认取消',
        content: '您有未保存的更改，确定要离开吗？',
        confirmText: '确定',
        cancelText: '继续编辑',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  /**
   * 数组相等比较 - 修复版本，避免修改原数组
   */
  arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    // 创建副本进行比较，不修改原数组
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    
    for (let i = 0; i < sortedArr1.length; i++) {
      if (sortedArr1[i] !== sortedArr2[i]) return false;
    }
    return true;
  }
});
