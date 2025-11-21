// pages/video-detail/video-detail.js
const app = getApp();
const { CloudService } = require('../../services/cloudService');
const { ShareService } = require('../../services/shareService');

Page({
  data: {
    video: {},
    relatedVideos: [],
    isPlaying: false,
    isFullScreen: false,
    isFavorited: false,
    isLoading: true,
    networkType: 'unknown',
    showNetworkTip: false
  },

  videoContext: null,

  onLoad(options) {
    const videoId = options.id;
    if (videoId) {
      this.loadVideoDetail(videoId);
      this.loadRelatedVideos(videoId);
    }

    // 检查网络状态
    this.checkNetworkStatus();

    // 启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    // 检查收藏状态
    this.checkFavoriteStatus(videoId);
  },

  onReady() {
    // 创建视频上下文
    this.videoContext = wx.createVideoContext('videoPlayer', this);
  },

  onUnload() {
    // 页面卸载时停止播放
    if (this.videoContext) {
      this.videoContext.stop();
    }
  },

  /**
   * 加载视频详情
   */
  loadVideoDetail(videoId) {
    this.setData({ isLoading: true });
    
    return CloudService.getVideoById(videoId)
      .then(video => {
        this.setData({ 
          video,
          isLoading: false
        });
        
        // 记录观看行为
        this.recordVideoView(videoId);
      })
      .catch(error => {
        console.error('加载视频详情失败:', error);
        this.setData({ isLoading: false });
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      });
  },

  /**
   * 加载相关推荐视频
   */
  loadRelatedVideos(currentVideoId) {
    const { video } = this.data;
    
    // 根据当前视频的分类加载相关视频
    CloudService.getRecommendedVideos(video.category || 'rehabilitation', 6)
      .then(videos => {
        // 过滤掉当前视频
        const relatedVideos = videos.filter(v => v.id !== currentVideoId).slice(0, 5);
        this.setData({ relatedVideos });
      })
      .catch(error => {
        console.error('加载相关视频失败:', error);
        // 失败时使用mock数据
        this.setData({
          relatedVideos: this.getMockRelatedVideos()
        });
      });
  },

  /**
   * 获取mock相关视频数据
   */
  getMockRelatedVideos() {
    return [
      {
        id: 'mock-video-1',
        title: '肩部康复训练基础动作',
        thumbnail: '/images/default-video-thumb.png',
        duration: '8:30',
        views: 1250
      },
      {
        id: 'mock-video-2',
        title: '膝关节功能恢复指导',
        thumbnail: '/images/default-video-thumb.png',
        duration: '12:15',
        views: 980
      },
      {
        id: 'mock-video-3',
        title: '腰部康复拉伸训练',
        thumbnail: '/images/default-video-thumb.png',
        duration: '10:00',
        views: 760
      }
    ];
  },

  /**
   * 检查网络状态
   */
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        const networkType = res.networkType;
        this.setData({ networkType });
        
        // 如果是4G网络，提示用户
        if (networkType === '4g' || networkType === '3g' || networkType === '2g') {
          this.setData({ showNetworkTip: true });
          
          setTimeout(() => {
            this.setData({ showNetworkTip: false });
          }, 3000);
        }
      }
    });

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.setData({ networkType: res.networkType });
      
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none'
        });
        
        if (this.videoContext) {
          this.videoContext.pause();
        }
      }
    });
  },

  /**
   * 记录视频观看
   */
  recordVideoView(videoId) {
    CloudService.recordVideoView(videoId)
      .catch(error => {
        console.error('记录观看失败:', error);
      });
  },

  /**
   * 检查收藏状态
   */
  checkFavoriteStatus(videoId) {
    CloudService.checkFavoriteStatus('video', videoId)
      .then(isFavorited => {
        this.setData({ isFavorited });
      })
      .catch(error => {
        console.error('检查收藏状态失败:', error);
      });
  },

  /**
   * 视频准备就绪
   */
  handleVideoReady(e) {
    console.log('视频准备就绪');
  },

  /**
   * 视频播放
   */
  handleVideoPlay(e) {
    this.setData({ isPlaying: true });
    console.log('视频开始播放');
  },

  /**
   * 视频暂停
   */
  handleVideoPause(e) {
    this.setData({ isPlaying: false });
    console.log('视频暂停');
  },

  /**
   * 视频播放结束
   */
  handleVideoEnded(e) {
    this.setData({ isPlaying: false });
    console.log('视频播放结束');
    
    // 自动推荐下一个视频
    if (this.data.relatedVideos.length > 0) {
      wx.showModal({
        title: '观看完毕',
        content: '是否观看下一个相关视频？',
        success: (res) => {
          if (res.confirm) {
            const nextVideo = this.data.relatedVideos[0];
            this.navigateToVideo(nextVideo.id);
          }
        }
      });
    }
  },

  /**
   * 视频播放错误
   */
  handleVideoError(e) {
    console.error('视频播放错误:', e.detail);
    this.setData({ isPlaying: false });
    
    wx.showModal({
      title: '播放失败',
      content: '视频加载失败，请检查网络连接后重试',
      showCancel: false
    });
  },

  /**
   * 视频缓冲更新
   */
  handleTimeUpdate(e) {
    // 可以在这里添加播放进度追踪逻辑
  },

  /**
   * 视频进入全屏
   */
  handleFullScreenChange(e) {
    const { fullScreen, direction } = e.detail;
    this.setData({ 
      isFullScreen: fullScreen 
    });
    
    console.log(`全屏状态: ${fullScreen}, 方向: ${direction}`);
  },

  /**
   * 切换全屏
   */
  handleFullScreen() {
    if (!this.videoContext) return;
    
    if (this.data.isFullScreen) {
      this.videoContext.exitFullScreen();
    } else {
      this.videoContext.requestFullScreen({
        direction: 90 // 横屏
      });
    }
  },

  /**
   * 收藏视频
   */
  handleFavorite() {
    const { video, isFavorited } = this.data;
    
    if (!video.id) {
      wx.showToast({
        title: '视频信息不完整',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: isFavorited ? '取消中...' : '收藏中...' });

    const action = isFavorited 
      ? CloudService.removeFavorite('video', video.id)
      : CloudService.addFavorite('video', video.id);

    action
      .then(() => {
        this.setData({ isFavorited: !isFavorited });
        wx.showToast({
          title: isFavorited ? '已取消收藏' : '收藏成功',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('收藏操作失败:', error);
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  /**
   * 跳转到相关视频
   */
  navigateToVideo(videoId) {
    wx.redirectTo({
      url: `/pages/video-detail/video-detail?id=${videoId}`
    });
  },

  /**
   * 返回上一页
   */
  handleBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  /**
   * 用户点击分享按钮
   */
  handleShare() {
    ShareService.showShareMenu('video', this.data.video);
  },

  /**
   * 用户点击右上角分享给朋友
   */
  onShareAppMessage() {
    const shareConfig = ShareService.configShareMessage('video', this.data.video);
    
    // 记录分享行为
    ShareService.logShareAction('video', this.data.video.id, 'friend');
    
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
    const shareConfig = ShareService.configShareTimeline('video', this.data.video);
    
    // 记录分享行为
    ShareService.logShareAction('video', this.data.video.id, 'timeline');
    
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
