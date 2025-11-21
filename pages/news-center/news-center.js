// pages/news-center/news-center.js
const app = getApp();
const { CloudService } = require('../../services/cloudService');
const { UserService } = require('../../services/userService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    contentMode: 'recommended', // recommended, all
    activeTab: 'all', // all, video, article
    showSearch: false,
    searchKeyword: '',
    allItems: [], // 所有内容（视频+文章）
    leftColumn: [],
    rightColumn: [],
    loading: true,
    showPreferenceGuide: false,
    userPreferences: [] // 用户订阅偏好
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('资讯中心加载', options);
    
    // 加载用户偏好
    this.loadUserPreferences().then(() => {
      // 加载内容
      this.loadContent();
    });
    
    // 如果有搜索关键词参数，自动打开搜索
    if (options.keyword) {
      this.setData({ 
        showSearch: true,
        searchKeyword: options.keyword
      });
      // 延迟执行搜索，确保数据已加载
      setTimeout(() => {
        this.handleSearch();
      }, 500);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查是否需要打开搜索面板（从首页跳转）
    const app = getApp();
    if (app.globalData && app.globalData.openSearch) {
      this.setData({ showSearch: true });
      // 清除标记
      app.globalData.openSearch = false;
    }
    
    // 重新加载用户偏好（可能在设置页面修改了）
    this.loadUserPreferences(true);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {
    console.log('下拉刷新');
    this.loadContent(true);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('上拉触底 - 可以加载更多');
    // 可以在这里实现分页加载
  },

  /**
   * 加载用户偏好
   */
  loadUserPreferences(silent = false) {
    return new Promise((resolve) => {
      const user = app.getCurrentUser();
      if (!user || !user.id) {
        this.setData({ 
          userPreferences: [],
          showPreferenceGuide: true 
        });
        resolve();
        return;
      }

      UserService.getUserPreferences(user.id, 'subscription')
        .then(preferences => {
          const hasPreferences = preferences && preferences.length > 0;
          this.setData({
            userPreferences: preferences || [],
            showPreferenceGuide: !hasPreferences
          });
          
          // 如果是从设置页面返回且偏好已设置，刷新内容
          if (silent && hasPreferences && this.data.contentMode === 'recommended') {
            this.loadContent();
          }
          
          console.log('用户偏好加载完成:', preferences);
          resolve();
        })
        .catch(error => {
          console.error('加载用户偏好失败:', error);
          this.setData({ 
            userPreferences: [],
            showPreferenceGuide: true 
          });
          resolve();
        });
    });
  },

  /**
   * 加载内容
   */
  loadContent(isRefresh = false) {
    if (!isRefresh) {
      this.setData({ loading: true });
    }

    // 根据内容模式加载不同数据
    if (this.data.contentMode === 'recommended' && this.data.userPreferences.length > 0) {
      this.loadRecommendedContent(isRefresh);
    } else {
      this.loadAllContent(isRefresh);
    }
  },

  /**
   * 加载推荐内容
   */
  loadRecommendedContent(isRefresh = false) {
    // 确定内容类型
    let contentType = 'all';
    if (this.data.activeTab === 'video') {
      contentType = 'video';
    } else if (this.data.activeTab === 'article') {
      contentType = 'article';
    }

    CloudService.getRecommendedContent(this.data.userPreferences, contentType, 50)
      .then(contents => {
        // 转换为统一格式
        const items = contents.map(c => ({
          ...c,
          coverImage: c.type === 'video' ? c.thumbnail : c.coverImage
        }));

        this.setData({
          allItems: items,
          loading: false
        });

        // 分配到两列
        this.distributeItems(items);

        if (isRefresh) {
          wx.stopPullDownRefresh();
          wx.showToast({
            title: '刷新成功',
            icon: 'success',
            duration: 1000
          });
        }

        console.log('推荐内容加载完成:', {
          count: items.length,
          preferences: this.data.userPreferences
        });
      })
      .catch(error => {
        console.error('加载推荐内容失败:', error);
        // 降级到全部内容
        this.loadAllContent(isRefresh);
      });
  },

  /**
   * 加载全部内容
   */
  loadAllContent(isRefresh = false) {
    console.log('📋 开始加载资讯中心内容...');
    
    // 并行加载视频和文章数据
    Promise.all([
      CloudService.getVideos(),
      CloudService.getNews()
    ]).then(([videos, news]) => {
      console.log('📥 数据加载结果:', {
        videos: videos?.length || 0,
        news: news?.length || 0
      });
      
      // 将视频和文章合并，并添加类型标识
      const videoItems = videos.map(v => ({
        ...v,
        type: 'video',
        coverImage: v.thumbnail
      }));

      // 验证文章数据完整性
      const validNews = news.filter(article => {
        const isValid = article.title && 
                       (article.content || article.summary);
        
        if (!isValid) {
          console.warn('⚠️ 无效文章数据:', {
            id: article.id,
            title: article.title,
            hasContent: !!article.content,
            hasSummary: !!article.summary
          });
        }
        
        return isValid;
      });
      
      console.log(`✅ 验证后有效文章: ${validNews.length}/${news.length}`);

      const newsItems = validNews.map(n => ({
        ...n,
        type: 'article'
      }));

      const allItems = [...videoItems, ...newsItems];
      
      // 根据当前tab过滤数据
      const filteredItems = this.filterItemsByTab(allItems, this.data.activeTab);
      
      this.setData({
        allItems: allItems,
        loading: false
      });

      // 分配到两列
      this.distributeItems(filteredItems);

      if (isRefresh) {
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1000
        });
      }

      console.log('✅ 资讯中心数据加载完成:', {
        videos: videoItems.length,
        news: newsItems.length,
        total: allItems.length,
        validNewsRatio: `${newsItems.length}/${news.length}`
      });
    }).catch((error) => {
      console.error('❌ 加载内容失败:', error);
      this.setData({ 
        allItems: [],
        leftColumn: [],
        rightColumn: [],
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
    });
  },

  /**
   * 根据tab过滤内容
   */
  filterItemsByTab(items, tab) {
    if (tab === 'all') {
      return items;
    } else if (tab === 'video') {
      return items.filter(item => item.type === 'video');
    } else if (tab === 'article') {
      return items.filter(item => item.type === 'article');
    }
    return items;
  },

  /**
   * 搜索过滤（支持偏好加权排序）
   */
  filterItemsByKeyword(items, keyword) {
    if (!keyword || keyword.trim() === '') {
      return items;
    }

    const lowerKeyword = keyword.toLowerCase().trim();
    const filteredItems = items.filter(item => {
      const title = (item.title || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const summary = (item.summary || '').toLowerCase();
      const tags = (item.tags || []).map(t => t.toLowerCase()).join(' ');
      
      return title.includes(lowerKeyword) || 
             category.includes(lowerKeyword) || 
             summary.includes(lowerKeyword) ||
             tags.includes(lowerKeyword);
    });

    // 如果有用户偏好，进行偏好加权排序
    if (this.data.userPreferences.length > 0) {
      return this.sortByPreference(filteredItems);
    }

    return filteredItems;
  },

  /**
   * 根据偏好排序内容
   */
  sortByPreference(items) {
    const preferences = this.data.userPreferences;
    
    return items.sort((a, b) => {
      // 计算匹配度
      const scoreA = this.calculateMatchScore(a, preferences);
      const scoreB = this.calculateMatchScore(b, preferences);
      
      // 优先按匹配度排序
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // 匹配度相同，按创建时间排序
      const dateA = new Date(a.created_at || a.date);
      const dateB = new Date(b.created_at || b.date);
      return dateB - dateA;
    });
  },

  /**
   * 计算内容匹配度
   */
  calculateMatchScore(item, preferences) {
    if (!item.tags || item.tags.length === 0) {
      return 0;
    }

    // 计算标签匹配数
    const matchCount = item.tags.filter(tag => 
      preferences.includes(tag)
    ).length;

    return matchCount * 10;
  },

  /**
   * 将内容分配到两列（瀑布流布局）
   * 使用动态高度平衡算法，而非简单交替
   */
  distributeItems(items) {
    const leftColumn = [];
    const rightColumn = [];
    let leftHeight = 0;
    let rightHeight = 0;

    items.forEach((item) => {
      // 估算内容高度
      // 基础高度：封面图片（假设为200rpx）+ 内容区域（约120rpx）
      let estimatedHeight = 200; // 基础图片高度
      
      // 标题长度影响高度（每20个字符增加约30rpx）
      if (item.title) {
        estimatedHeight += Math.ceil(item.title.length / 20) * 30;
      }
      
      // 摘要影响高度（如果有的话）
      if (item.summary) {
        estimatedHeight += 20;
      }
      
      // 视频徽章可能增加额外高度
      if (item.type === 'video') {
        estimatedHeight += 10;
      }

      // 将项目添加到高度较小的那一列
      if (leftHeight <= rightHeight) {
        leftColumn.push(item);
        leftHeight += estimatedHeight;
      } else {
        rightColumn.push(item);
        rightHeight += estimatedHeight;
      }
    });

    this.setData({
      leftColumn,
      rightColumn
    });
  },

  /**
   * Tab切换
   */
  handleTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.activeTab) return;

    this.setData({ activeTab: tab });

    // 重新过滤和分配内容
    let filteredItems = this.filterItemsByTab(this.data.allItems, tab);
    
    // 如果有搜索关键词，也要应用搜索过滤
    if (this.data.searchKeyword) {
      filteredItems = this.filterItemsByKeyword(filteredItems, this.data.searchKeyword);
    }

    this.distributeItems(filteredItems);
  },

  /**
   * 显示搜索面板
   */
  handleShowSearch() {
    this.setData({ showSearch: true });
  },

  /**
   * 取消搜索
   */
  handleCancelSearch() {
    this.setData({ 
      showSearch: false,
      searchKeyword: ''
    });

    // 重置为当前tab的所有内容
    const filteredItems = this.filterItemsByTab(this.data.allItems, this.data.activeTab);
    this.distributeItems(filteredItems);
  },

  /**
   * 搜索输入
   */
  handleSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  /**
   * 执行搜索
   */
  handleSearch() {
    const keyword = this.data.searchKeyword;
    
    if (!keyword || keyword.trim() === '') {
      // 如果关键词为空，显示所有内容
      const filteredItems = this.filterItemsByTab(this.data.allItems, this.data.activeTab);
      this.distributeItems(filteredItems);
      return;
    }

    // 先根据tab过滤，再根据关键词过滤
    let filteredItems = this.filterItemsByTab(this.data.allItems, this.data.activeTab);
    filteredItems = this.filterItemsByKeyword(filteredItems, keyword);

    this.distributeItems(filteredItems);
    
    // 显示搜索结果提示
    if (filteredItems.length === 0) {
      wx.showToast({
        title: '没有您要的主题内容，换个主题试试',
        icon: 'none',
        duration: 2000
      });
    }
    
    console.log('搜索结果:', {
      keyword,
      count: filteredItems.length
    });
  },

  /**
   * 内容项点击
   */
  handleItemTap(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;

    console.log('点击内容:', item);

    if (item.type === 'video') {
      // 跳转到视频详情页
      wx.navigateTo({
        url: `/pages/video-detail/video-detail?id=${item.id}`,
        fail: (error) => {
          console.error('跳转失败:', error);
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      });
    } else if (item.type === 'article') {
      // 跳转到文章详情页
      wx.navigateTo({
        url: `/pages/news-detail/news-detail?id=${item.id}`,
        fail: (error) => {
          console.error('跳转失败:', error);
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 切换内容模式
   */
  switchContentMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.contentMode) return;

    this.setData({ contentMode: mode });
    this.loadContent();

    console.log('切换内容模式:', mode);
  },

  /**
   * 跳转到偏好设置页面
   */
  goToPreferenceSettings() {
    wx.navigateTo({
      url: '/pages/subscription-settings/subscription-settings'
    });
  }
});
