/**
 * 分享服务
 * 统一管理微信小程序的分享功能
 */

class ShareService {
  /**
   * 配置分享给朋友
   * @param {string} type - 分享类型：video, news, activity
   * @param {object} data - 分享数据
   * @returns {object} - 分享配置对象
   */
  static configShareMessage(type, data) {
    const configs = {
      video: {
        title: `【康复训练视频】${data.title || '精彩视频'}`,
        path: `/pages/video-detail/video-detail?id=${data.id}`,
        imageUrl: data.thumbnail || data.coverImage || ''
      },
      news: {
        title: `【健康资讯】${data.title || '健康知识'}`,
        path: `/pages/news-detail/news-detail?id=${data.id}`,
        imageUrl: data.coverImage || '/images/news-default.png'
      },
      activity: {
        title: `【康复活动】${data.title || '社区活动'}`,
        path: `/pages/community/community?activityId=${data.id}`,
        imageUrl: data.image || '/images/activity-default.png'
      }
    };

    const config = configs[type];
    if (!config) {
      console.error('不支持的分享类型:', type);
      return null;
    }

    return {
      title: config.title,
      path: config.path,
      imageUrl: config.imageUrl
    };
  }

  /**
   * 配置分享到朋友圈
   * @param {string} type - 分享类型：video, news, activity
   * @param {object} data - 分享数据
   * @returns {object} - 分享配置对象
   */
  static configShareTimeline(type, data) {
    const configs = {
      video: {
        title: `【康复训练】${data.title || '精彩视频'} - 锐汗步康复小程序`,
        query: `id=${data.id}`,
        imageUrl: data.thumbnail || data.coverImage || ''
      },
      news: {
        title: `【健康资讯】${data.title || '健康知识'} - 锐汗步`,
        query: `id=${data.id}`,
        imageUrl: data.coverImage || '/images/news-default.png'
      },
      activity: {
        title: `【康复活动】${data.title || '社区活动'} - 锐汗步社区`,
        query: `activityId=${data.id}`,
        imageUrl: data.image || '/images/activity-default.png'
      }
    };

    const config = configs[type];
    if (!config) {
      console.error('不支持的分享类型:', type);
      return null;
    }

    return {
      title: config.title,
      query: config.query,
      imageUrl: config.imageUrl
    };
  }

  /**
   * 显示分享成功提示
   */
  static showShareSuccess() {
    wx.showToast({
      title: '分享成功',
      icon: 'success',
      duration: 2000
    });
  }

  /**
   * 显示分享失败提示
   */
  static showShareFail() {
    wx.showToast({
      title: '分享失败，请重试',
      icon: 'none',
      duration: 2000
    });
  }

  /**
   * 触发分享给朋友（主动调用）
   * @param {string} type - 分享类型
   * @param {object} data - 分享数据
   */
  static shareToFriend(type, data) {
    const config = this.configShareMessage(type, data);
    if (!config) return;

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    // 注意：微信小程序不支持主动调用分享，只能通过右上角菜单或按钮触发
    // 这里只是配置分享内容
    console.log('分享配置已设置:', config);
  }

  /**
   * 触发分享到朋友圈（主动调用）
   * @param {string} type - 分享类型
   * @param {object} data - 分享数据
   */
  static shareToTimeline(type, data) {
    const config = this.configShareTimeline(type, data);
    if (!config) return;

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });

    console.log('朋友圈分享配置已设置:', config);
  }

  /**
   * 显示分享操作菜单
   * @param {string} type - 分享类型
   * @param {object} data - 分享数据
   */
  static showShareMenu(type, data) {
    wx.showActionSheet({
      itemList: ['分享给朋友', '分享到朋友圈'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给朋友 - 需要用户点击右上角菜单
          wx.showModal({
            title: '分享提示',
            content: '请点击右上角"..."按钮，选择"转发"分享给朋友',
            showCancel: false,
            confirmText: '知道了'
          });
        } else if (res.tapIndex === 1) {
          // 分享到朋友圈 - 需要用户点击右上角菜单
          wx.showModal({
            title: '分享提示',
            content: '请点击右上角"..."按钮，选择"分享到朋友圈"',
            showCancel: false,
            confirmText: '知道了'
          });
        }
      }
    });
  }

  /**
   * 记录分享行为（可选，用于数据统计）
   * @param {string} type - 分享类型
   * @param {string} itemId - 内容ID
   * @param {string} shareType - 分享方式：friend, timeline
   */
  static logShareAction(type, itemId, shareType) {
    console.log('分享记录:', {
      type,
      itemId,
      shareType,
      timestamp: new Date().toISOString()
    });
    // 这里可以调用后端API记录分享数据
    // 例如：CloudService.recordShare(type, itemId, shareType)
  }
}

module.exports = {
  ShareService
};
