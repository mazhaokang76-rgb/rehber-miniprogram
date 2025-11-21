// utils/types.js
/**
 * 训练分类枚举
 */
const Category = {
  REHAB: '运动复健',
  CORE: '核心训练', 
  CARDIO: '心肺功能',
  OTHER: '其他训练'
};

/**
 * 用户数据模型
 */
class User {
  constructor(data = {}) {
    // 生成或使用UUID格式的user_id
    this.user_id = data.user_id || data.id || this.generateUUID();
    this.name = data.name || '';
    this.phone = data.phone || '';
    this.avatar = data.avatar || '';
    this.loginCount = data.loginCount || 0;
    this.subscriptions = data.subscriptions || [];
    this.created_at = data.created_at || data.createdAt || new Date().toISOString();
  }

  /**
   * 生成UUID格式的ID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 获取订阅的分类
  getSubscriptions() {
    return this.subscriptions || [];
  }

  // 检查是否订阅了指定分类
  hasSubscription(category) {
    return this.subscriptions.includes(category);
  }

  // 更新订阅
  updateSubscriptions(subscriptions) {
    this.subscriptions = subscriptions;
  }
}

/**
 * 训练视频数据模型
 */
class TrainingVideo {
  constructor(data = {}) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.category = data.category || Category.REHAB;
    this.thumbnail = data.thumbnail || '';
    this.duration = data.duration || '';
    this.views = data.views || 0;
    this.url = data.url || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

/**
 * 健康资讯数据模型
 */
class HealthNews {
  constructor(data = {}) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.category = data.category || Category.REHAB;
    this.summary = data.summary || '';
    this.coverImage = data.coverImage || '';
    this.date = data.date || '';
    this.content = data.content || '';
    this.author = data.author || '';
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

/**
 * 社区活动数据模型
 */
class CommunityEvent {
  constructor(data = {}) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.location = data.location || '';
    this.time = data.time || '';
    this.date = data.date || '';
    this.image = data.image || '';
    this.likes = data.likes || 0;
    this.userAvatar = data.userAvatar || '';
    this.userName = data.userName || '';
    this.description = data.description || '';
    this.maxParticipants = data.maxParticipants || 0;
    this.currentParticipants = data.currentParticipants || 0;
    this.status = data.status || 'upcoming'; // upcoming, ongoing, completed
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

module.exports = {
  Category,
  User,
  TrainingVideo, 
  HealthNews,
  CommunityEvent
};