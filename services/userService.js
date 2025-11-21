// services/userService.js
/**
 * 用户服务类 - 处理用户相关操作
 */
class UserService {
  constructor() {
    this.supabaseConfig = {
      url: 'https://sabkqmcgvtpfcicqxfpt.supabase.co',
      key: 'sb_publishable_Xvg2opObWAWmpT_pIO5AkQ_Dx9hSRk1'
    };
  }

  /**
   * Supabase HTTP请求封装
   */
  makeSupabaseRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.supabaseConfig.url}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'apikey': this.supabaseConfig.key,
        'Authorization': `Bearer ${this.supabaseConfig.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method,
        data,
        header: options.headers,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`));
          }
        },
        fail: reject
      });
    });
  }

  /**
   * 添加收藏
   * @param {string} userId - 用户ID
   * @param {string} eventId - 活动ID
   * @param {object} eventData - 活动详情
   */
  addFavorite(userId, eventId, eventData) {
    return new Promise((resolve, reject) => {
      this.makeSupabaseRequest(
        '/rest/v1/user_favorites',
        'POST',
        {
          user_id: userId,
          event_id: eventId,
          event_data: eventData,
          created_at: new Date().toISOString()
        }
      )
      .then(response => {
        console.log('添加收藏成功:', response);
        resolve(response);
      })
      .catch(error => {
        console.error('添加收藏失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 取消收藏
   * @param {string} userId - 用户ID
   * @param {string} eventId - 活动ID
   */
  removeFavorite(userId, eventId) {
    return new Promise((resolve, reject) => {
      this.makeSupabaseRequest(
        `/rest/v1/user_favorites?user_id=eq.${userId}&event_id=eq.${eventId}`,
        'DELETE'
      )
      .then(response => {
        console.log('取消收藏成功:', response);
        resolve(response);
      })
      .catch(error => {
        console.error('取消收藏失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 获取用户收藏列表
   * @param {string} userId - 用户ID
   */
  getUserFavorites(userId) {
    return new Promise((resolve, reject) => {
      this.makeSupabaseRequest(
        `/rest/v1/user_favorites?user_id=eq.${userId}&select=*&order=created_at.desc`,
        'GET'
      )
      .then(response => {
        if (response && Array.isArray(response)) {
          // 提取活动数据并添加收藏时间
          const favorites = response.map(item => ({
            ...item.event_data,
            favoriteTime: item.created_at,
            favoriteId: item.id
          }));
          resolve(favorites);
        } else {
          resolve([]);
        }
      })
      .catch(error => {
        console.error('获取收藏列表失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 检查是否已收藏
   * @param {string} userId - 用户ID
   * @param {string} eventId - 活动ID
   */
  checkFavorite(userId, eventId) {
    return new Promise((resolve, reject) => {
      this.makeSupabaseRequest(
        `/rest/v1/user_favorites?user_id=eq.${userId}&event_id=eq.${eventId}`,
        'GET'
      )
      .then(response => {
        if (response && Array.isArray(response) && response.length > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(error => {
        console.error('检查收藏状态失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 获取用户个人资料
   * @param {string} userId - 用户ID
   */
  getUserProfile(userId) {
    return new Promise((resolve, reject) => {
      // 检查userId是否有效
      if (!userId || userId.trim() === '') {
        console.error('用户ID无效:', userId);
        resolve(null);
        return;
      }

      this.makeSupabaseRequest(
        `/rest/v1/user_profiles?user_id=eq.${userId}`,
        'GET'
      )
      .then(response => {
        if (response && Array.isArray(response) && response.length > 0) {
          resolve(response[0]);
        } else {
          // 如果用户资料不存在，创建默认资料
          this.createUserProfile(userId).then(resolve).catch(reject);
        }
      })
      .catch(error => {
        console.error('获取用户资料失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 创建用户个人资料
   * @param {string} userId - 用户ID
   */
  createUserProfile(userId) {
    return new Promise((resolve, reject) => {
      this.makeSupabaseRequest(
        '/rest/v1/user_profiles',
        'POST',
        {
          user_id: userId,
          nickname: '健康用户',
          total_login_days: 1,
          last_login_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        }
      )
      .then(response => {
        console.log('创建用户资料成功:', response);
        resolve(response[0] || response);
      })
      .catch(error => {
        console.error('创建用户资料失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 更新用户个人资料
   * @param {string} userId - 用户ID
   * @param {object} profileData - 更新的资料数据 {nickname, avatar_url}
   */
  updateUserProfile(userId, profileData) {
    return new Promise((resolve, reject) => {
      this.makeSupabaseRequest(
        `/rest/v1/user_profiles?user_id=eq.${userId}`,
        'PATCH',
        profileData
      )
      .then(response => {
        console.log('更新用户资料成功:', response);
        resolve(response);
      })
      .catch(error => {
        console.error('更新用户资料失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 更新用户登录日期并计算登录天数
   * @param {string} userId - 用户ID
   */
  updateLoginDate(userId) {
    return new Promise((resolve, reject) => {
      // 先获取用户资料
      this.getUserProfile(userId)
        .then(profile => {
          const today = new Date().toISOString().split('T')[0];
          const lastLoginDate = profile.last_login_date;
          
          // 如果今天还没登录过，则更新登录天数
          if (lastLoginDate !== today) {
            const updateData = {
              last_login_date: today,
              total_login_days: (profile.total_login_days || 0) + 1
            };
            
            return this.updateUserProfile(userId, updateData);
          } else {
            // 今天已经登录过，不更新
            resolve(profile);
          }
        })
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * 获取用户偏好设置
   * @param {string} userId - 用户ID
   * @param {string} preferenceType - 偏好类型 (topics, notifications等)
   */
  getUserPreferences(userId, preferenceType = null) {
    return new Promise((resolve, reject) => {
      let endpoint = `/rest/v1/user_preferences?user_id=eq.${userId}`;
      if (preferenceType) {
        endpoint += `&preference_type=eq.${preferenceType}`;
      }
      
      this.makeSupabaseRequest(endpoint, 'GET')
        .then(response => {
          resolve(response || []);
        })
        .catch(error => {
          console.error('获取用户偏好失败:', error);
          reject(error);
        });
    });
  }

  /**
   * 保存用户偏好设置
   * @param {string} userId - 用户ID
   * @param {string} preferenceType - 偏好类型
   * @param {string} preferenceValue - 偏好值 (JSON字符串)
   */
  saveUserPreference(userId, preferenceType, preferenceValue) {
    return new Promise((resolve, reject) => {
      // 先检查是否存在该偏好设置
      this.getUserPreferences(userId, preferenceType)
        .then(preferences => {
          if (preferences.length > 0) {
            // 更新现有偏好
            return this.makeSupabaseRequest(
              `/rest/v1/user_preferences?user_id=eq.${userId}&preference_type=eq.${preferenceType}`,
              'PATCH',
              { preference_value: preferenceValue }
            );
          } else {
            // 创建新偏好
            return this.makeSupabaseRequest(
              '/rest/v1/user_preferences',
              'POST',
              {
                user_id: userId,
                preference_type: preferenceType,
                preference_value: preferenceValue
              }
            );
          }
        })
        .then(response => {
          console.log('保存用户偏好成功:', response);
          resolve(response);
        })
        .catch(error => {
          console.error('保存用户偏好失败:', error);
          reject(error);
        });
    });
  }

  /**
   * 上传头像到Supabase Storage
   * @param {string} filePath - 本地文件路径
   * @param {string} userId - 用户ID
   */
  uploadAvatar(filePath, userId) {
    return new Promise((resolve, reject) => {
      // 生成唯一文件名：userId_timestamp.jpg
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}.jpg`;
      const uploadUrl = `${this.supabaseConfig.url}/storage/v1/object/avatars/${fileName}`;

      wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${this.supabaseConfig.key}`,
          'apikey': this.supabaseConfig.key
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // 上传成功，构造公开访问URL
            const publicUrl = `${this.supabaseConfig.url}/storage/v1/object/public/avatars/${fileName}`;
            console.log('头像上传成功:', publicUrl);
            resolve(publicUrl);
          } else {
            console.error('头像上传失败:', res);
            reject(new Error(`上传失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          console.error('头像上传请求失败:', error);
          reject(error);
        }
      });
    });
  }
}

// 创建全局实例
const userService = new UserService();

module.exports = {
  UserService: userService
};
