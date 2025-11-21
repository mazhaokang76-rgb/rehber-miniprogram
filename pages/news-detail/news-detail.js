// pages/news-detail/news-detail.js
const app = getApp();
const { CloudService } = require('../../services/cloudService');
const { ShareService } = require('../../services/shareService');

Page({
  data: {
    news: {}
  },

  onLoad(options) {
    const newsId = options.id;
    if (newsId) {
      this.loadNewsDetail(newsId);
    }

    // 启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  loadNewsDetail(newsId) {
    CloudService.getNewsById(newsId)
      .then(news => {
        this.setData({ news });
      })
      .catch(error => {
        console.error('加载资讯详情失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  /**
   * 用户点击分享按钮
   */
  handleShare() {
    ShareService.showShareMenu('news', this.data.news);
  },

  /**
   * 用户点击右上角分享给朋友
   */
  onShareAppMessage() {
    const shareConfig = ShareService.configShareMessage('news', this.data.news);
    
    // 记录分享行为
    ShareService.logShareAction('news', this.data.news.id, 'friend');
    
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
    const shareConfig = ShareService.configShareTimeline('news', this.data.news);
    
    // 记录分享行为
    ShareService.logShareAction('news', this.data.news.id, 'timeline');
    
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