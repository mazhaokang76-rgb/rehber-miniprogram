// utils/userManager.js
const { User, Category } = require('./types');
const { CloudService } = require('../services/cloudService');

/**
 * 用户管理工具类
 */
class UserManager {
  constructor() {
    this.storageKey = 'rehaber_user';
  }

  /**
   * 登录或注册用户
   */
  login(phone, name) {
    return new Promise((resolve, reject) => {
      try {
        // 验证手机号格式
        if (!this.validatePhone(phone)) {
          reject(new Error('手机号格式不正确'));
          return;
        }

        // 检查用户是否已存在
        this.getUserByPhone(phone).then(user => {
          if (user) {
            // 更新登录次数
            user.loginCount = (user.loginCount || 0) + 1;
            this.updateUser(user).then(() => {
              // 保存到本地
              this.saveUser(user);
              resolve(user);
            }).catch(error => {
              console.error('用户登录失败:', error);
              reject(error);
            });
          } else {
            // 创建新用户
            user = new User({
              phone,
              name: name || this.generateDefaultName(phone),
              avatar: this.generateAvatar(phone),
              loginCount: 1,
              subscriptions: [Category.REHAB, Category.CORE] // 默认订阅
            });
            
            this.createUser(user).then(() => {
              // 保存到本地
              this.saveUser(user);
              resolve(user);
            }).catch(error => {
              console.error('用户登录失败:', error);
              reject(error);
            });
          }
        }).catch(error => {
          console.error('用户登录失败:', error);
          reject(error);
        });
      } catch (error) {
        console.error('用户登录失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 根据手机号获取用户
   */
  getUserByPhone(phone) {
    return new Promise((resolve, reject) => {
      CloudService.getUserByPhone(phone).then(userData => {
        resolve(userData ? new User(userData) : null);
      }).catch(error => {
        console.error('获取用户信息失败:', error);
        
        // 如果云服务失败，返回本地缓存的用户
        const savedUser = this.getSavedUser();
        if (savedUser && savedUser.phone === phone) {
          resolve(new User(savedUser));
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * 创建新用户
   */
  createUser(user) {
    return CloudService.createUser(user).catch(error => {
      console.error('创建用户失败:', error);
      throw error;
    });
  }

  /**
   * 更新用户信息
   */
  updateUser(user) {
    return new Promise((resolve, reject) => {
      CloudService.updateUser(user).then(() => {
        this.saveUser(user);
        resolve();
      }).catch(error => {
        console.error('更新用户失败:', error);
        reject(error);
      });
    });
  }

  /**
   * 验证用户
   */
  validateUser(user) {
    return new Promise((resolve, reject) => {
      try {
        if (!user || !user.phone) {
          resolve(false);
          return;
        }
        
        this.getUserByPhone(user.phone).then(serverUser => {
          resolve(serverUser !== null);
        }).catch(error => {
          console.error('验证用户失败:', error);
          resolve(false);
        });
      } catch (error) {
        console.error('验证用户失败:', error);
        resolve(false);
      }
    });
  }

  /**
   * 更新用户订阅 - 修复版本，统一用户ID字段并增强错误处理
   */
  updateSubscriptions(userId, subscriptions) {
    return new Promise((resolve, reject) => {
      // 验证输入参数
      if (!userId) {
        reject(new Error('用户ID不能为空'));
        return;
      }
      
      if (!subscriptions || !Array.isArray(subscriptions)) {
        reject(new Error('订阅数据格式无效'));
        return;
      }

      CloudService.getUserById(userId).then(user => {
        if (!user) {
          reject(new Error('用户不存在'));
          return;
        }

        // 确保订阅数据格式正确并去重
        const validSubscriptions = [...new Set(subscriptions)]
          .filter(sub => sub && typeof sub === 'string')
          .sort(); // 排序确保一致性

        // 事务性更新：先更新服务器，再更新本地
        const updatedUserData = {
          ...user,
          subscriptions: validSubscriptions
        };

        // 使用 CloudService 直接更新
        CloudService.updateUserSubscriptions(userId, validSubscriptions)
          .then((updatedUser) => {
            // 创建新的用户对象
            const userObj = new User({
              ...user,
              subscriptions: validSubscriptions
            });

            // 更新本地存储
            this.saveUser(userObj);
            
            console.log('订阅偏好更新成功:', validSubscriptions);
            resolve(userObj);
          })
          .catch(error => {
            console.error('更新订阅失败:', error);
            
            // 提供更详细的错误信息
            let errorMessage = '更新订阅失败';
            if (error.message.includes('network')) {
              errorMessage = '网络连接失败，请检查网络设置';
            } else if (error.message.includes('auth')) {
              errorMessage = '用户认证失败，请重新登录';
            } else if (error.message.includes('permission')) {
              errorMessage = '没有权限执行此操作';
            }
            
            reject(new Error(errorMessage));
          });
      }).catch(error => {
        console.error('获取用户信息失败:', error);
        reject(new Error('获取用户信息失败，请稍后重试'));
      });
    });
  }

  /**
   * 保存用户到本地
   */
  saveUser(user) {
    try {
      wx.setStorageSync(this.storageKey, user);
    } catch (error) {
      console.error('保存用户失败:', error);
    }
  }

  /**
   * 从本地获取用户
   */
  getSavedUser() {
    try {
      const userData = wx.getStorageSync(this.storageKey);
      return userData ? new User(userData) : null;
    } catch (error) {
      console.error('获取本地用户失败:', error);
      return null;
    }
  }

  /**
   * 清除本地用户数据
   */
  clearUser() {
    try {
      wx.removeStorageSync(this.storageKey);
    } catch (error) {
      console.error('清除用户数据失败:', error);
    }
  }

  /**
   * 验证手机号格式
   */
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 生成默认用户名
   */
  generateDefaultName(phone) {
    return `用户${phone.slice(-4)}`;
  }

  /**
   * 生成头像URL
   */
  generateAvatar(phone) {
    // 使用 DiceBear API 生成头像
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`;
  }

  /**
   * 获取所有分类
   */
  getAllCategories() {
    return Object.values(Category);
  }

  /**
   * 格式化用户统计数据
   */
  formatUserStats(user) {
    return {
      loginDays: user.loginCount || 0,
      subscriptions: user.subscriptions ? user.subscriptions.length : 0,
      completedTrainings: 0 // TODO: 实现训练完成统计
    };
  }
}

module.exports = {
  UserManager
};