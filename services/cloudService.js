// services/cloudService.js
const types = require('../utils/types');

/**
 * 云服务类 - 支持 Supabase 和微信云开发
 */
class CloudService {
  constructor() {
    this.useSupabase = true; // 设置为 true 使用 Supabase，false 使用微信云
    this.supabaseConfig = {
      url: 'https://sabkqmcgvtpfcicqxfpt.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhYmtxbWNndnRwZmNpY3F4ZnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg1MTYsImV4cCI6MjA3OTIxNDUxNn0.EleyOumX3naHx2HX3ojPPhmeTfoBDGnC1IVUNfgSeAU'
    };
    this.supabase = null;
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * 生成UUID（简单版本）
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 获取当前用户ID，如果是guest则生成UUID
   */
  getCurrentUserId() {
    let userId = wx.getStorageSync('user_id');
    if (!userId || userId === 'guest') {
      // 为guest用户生成一个唯一的UUID
      userId = this.generateUUID();
      wx.setStorageSync('guest_user_id', userId);
    }
    return userId;
  }

  /**
   * 初始化服务
   */
  initialize() {
    if (this.isInitialized) {
      console.log('Supabase已初始化，跳过重复初始化');
      return;
    }

    try {
      if (this.useSupabase) {
        this.initSupabase();
        this.isInitialized = true;
        console.log('Supabase服务初始化成功');
      } else {
        this.initWeChatCloud();
        this.isInitialized = true;
        console.log('微信云服务初始化成功');
      }
    } catch (error) {
      console.error('服务初始化失败:', error);
      // 初始化失败时使用 Mock 数据
      this.useSupabase = false;
      this.initWeChatCloud();
      this.isInitialized = true;
    }
  }

  /**
   * 初始化Supabase
   */
  initSupabase() {
    try {
      // 使用真正的Supabase客户端结构
      this.supabase = {
        auth: {
          signInAnonymously: () => this.makeSupabaseRequest('/auth/v1/signup', 'POST', {}),
          onAuthStateChange: (callback) => {
            // 微信小程序环境的认证状态监听
            return { data: { subscription: { unsubscribe: () => {} } } };
          }
        },
        from: (table) => ({
          select: (columns = '*') => {
            const selectStr = columns === '*' ? '*' : Array.isArray(columns) ? columns.join(',') : columns;
            return {
              eq: (column, value) => ({
                single: () => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=eq.${value}`, 'GET'),
                limit: (count) => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=eq.${value}&limit=${count || 10}`, 'GET')
              }),
              order: (column, options = {}) => {
                const desc = options.ascending ? '' : '&order=';
                return this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&order=${column}${desc}&limit=10`, 'GET');
              },
              in: (column, values) => ({
                single: () => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=in.(${values.join(',')})`, 'GET'),
                limit: (count) => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=in.(${values.join(',')})&limit=${count || 10}`, 'GET')
              }),
              is: (column, value) => ({
                single: () => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=is.${value}`, 'GET'),
                limit: (count) => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=is.${value}&limit=${count || 10}`, 'GET')
              }),
              like: (pattern) => ({
                single: () => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=like.${pattern}`, 'GET'),
                limit: (count) => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=like.${pattern}&limit=${count || 10}`, 'GET')
              }),
              gte: (value) => ({
                single: () => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=gte.${value}`, 'GET'),
                limit: (count) => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=gte.${value}&limit=${count || 10}`, 'GET')
              }),
              lte: (value) => ({
                single: () => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=lte.${value}`, 'GET'),
                limit: (count) => this.makeSupabaseRequest(`/rest/v1/${table}?select=${selectStr}&${column}=lte.${value}&limit=${count || 10}`, 'GET')
              })
            };
          },
          insert: (data) => this.makeSupabaseRequest(`/rest/v1/${table}`, 'POST', Array.isArray(data) ? data : [data]),
          update: (data) => {
            const filter = data.user_id || data.id ? `?user_id=eq.${data.user_id || data.id}` : '';
            return this.makeSupabaseRequest(`/rest/v1/${table}${filter}`, 'PATCH', data);
          },
          upsert: (data) => {
            const record = Array.isArray(data) ? data : [data];
            const options = { onConflict: 'user_id' };
            return this.makeSupabaseRequest(`/rest/v1/${table}?on_conflict=user_id`, 'POST', record, options);
          },
          delete: () => {
            return {
              eq: (column, value) => this.makeSupabaseRequest(`/rest/v1/${table}?${column}=eq.${value}`, 'DELETE'),
              in: (column, values) => this.makeSupabaseRequest(`/rest/v1/${table}?${column}=in.(${values.join(',')})`, 'DELETE')
            };
          }
        })
      };
      console.log('Supabase初始化成功');
    } catch (error) {
      console.error('Supabase初始化失败:', error);
    }
  }

  /**
   * Supabase HTTP请求封装
   */
  makeSupabaseRequest(endpoint, method = 'GET', data = null, options = {}) {
    const url = `${this.supabaseConfig.url}${endpoint}`;
    
    const requestOptions = {
      method,
      headers: {
        'apikey': this.supabaseConfig.key,
        'Authorization': `Bearer ${this.supabaseConfig.key}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation'
      }
    };

    return new Promise((resolve, reject) => {
      try {
        wx.request({
          url,
          method,
          data: data,
          header: requestOptions.headers,
          success: (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(res.data);
            } else {
              console.error(`Supabase API错误 [${res.statusCode}]:`, res.data);
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`));
            }
          },
          fail: (error) => {
            console.error('Supabase网络请求失败:', error);
            reject(new Error(`网络请求失败: ${error.errMsg || '未知错误'}`));
          }
        });
      } catch (error) {
        console.error('Supabase请求异常:', error);
        reject(error);
      }
    });
  }

  /**
   * 初始化微信云
   */
  initWeChatCloud() {
    if (wx.cloud) {
      wx.cloud.init({
        env: 'your-cloud-env-id',
        traceUser: true
      });
      this.db = wx.cloud.database();
    } else {
      console.error('微信云开发未安装');
    }
  }

  /**
   * 获取视频列表
   */
  getVideos() {
    return new Promise((resolve, reject) => {
      try {
        if (this.useSupabase) {
          this.getVideosFromSupabase()
            .then(videos => {
              console.log('✅ Supabase视频列表获取成功:', videos?.length || 0, '条');
              resolve(videos);
            })
            .catch(error => {
              console.warn('⚠️ Supabase获取视频列表失败，降级使用Mock数据:', error);
              resolve(this.getMockVideos());
            });
        } else {
          this.getVideosFromWeChat()
            .then(videos => resolve(videos))
            .catch(error => {
              console.warn('⚠️ 微信云获取视频列表失败:', error);
              resolve(this.getMockVideos());
            });
        }
      } catch (error) {
        console.warn('⚠️ 获取视频列表异常，降级使用Mock数据:', error);
        resolve(this.getMockVideos());
      }
    });
  }

  /**
   * Supabase获取视频列表
   */
  getVideosFromSupabase() {
    return this.makeSupabaseRequest('/rest/v1/training_videos?select=*&order=views.desc', 'GET')
      .then(data => {
        if (!data || !Array.isArray(data)) {
          console.warn('视频列表为空或格式异常，使用Mock数据');
          return [];
        }
        return data;
      })
      .catch(error => {
        console.error('获取视频列表失败:', error);
        throw error;
      });
  }

  /**
   * 微信云获取视频列表
   */
  getVideosFromWeChat() {
    return new Promise((resolve, reject) => {
      this.db.collection('videos').where({
        is_active: true
      }).get()
        .then(result => {
          resolve(result.data.map(video => new TrainingVideo(video)));
        })
        .catch(reject);
    });
  }

  /**
   * Mock视频数据
   */
  getMockVideos() {
    const generateTestUUID = () => this.generateUUID();
    return Promise.resolve([
      {
        id: generateTestUUID(),
        title: '膝关节术后康复入门',
        category: '运动复健',
        thumbnail: 'https://picsum.photos/400/225?random=1',
        duration: '15:20',
        views: 1204,
        url: '',
        description: '专业的膝关节术后康复指导，适合术后2-6周的患者。'
      },
      {
        id: generateTestUUID(),
        title: '十分钟核心燃脂',
        category: '核心训练',
        thumbnail: 'https://picsum.photos/400/225?random=2',
        duration: '10:00',
        views: 3400,
        url: '',
        description: '高效的核心力量训练，燃脂塑形两不误。'
      },
      {
        id: generateTestUUID(),
        title: '肩周炎缓解练习',
        category: '康复治疗',
        thumbnail: 'https://picsum.photos/400/225?random=3',
        duration: '12:30',
        views: 2150,
        url: '',
        description: '针对肩周炎的康复练习，缓解肩部疼痛。'
      },
      {
        id: 'v4',
        title: '办公室颈椎保健操',
        category: '办公保健',
        thumbnail: 'https://picsum.photos/400/225?random=4',
        duration: '8:45',
        views: 5680,
        url: '',
        description: '适合办公族的颈椎保健操，预防颈椎病。'
      },
      {
        id: 'v5',
        title: '老年人跌倒预防训练',
        category: '老年康复',
        thumbnail: 'https://picsum.photos/400/225?random=5',
        duration: '18:15',
        views: 1870,
        url: '',
        description: '专门为老年人设计的跌倒预防平衡训练。'
      }
    ]);
  }

  /**
   * 获取资讯列表
   */
  getNews() {
    return new Promise((resolve, reject) => {
      try {
        if (this.useSupabase) {
          this.getNewsFromSupabase()
            .then(news => resolve(news))
            .catch(error => {
              console.error('获取资讯列表失败:', error);
              resolve(this.getMockNews());
            });
        } else {
          this.getNewsFromWeChat()
            .then(news => resolve(news))
            .catch(error => {
              console.error('获取资讯列表失败:', error);
              resolve(this.getMockNews());
            });
        }
      } catch (error) {
        console.error('获取资讯列表失败:', error);
        resolve(this.getMockNews());
      }
    });
  }

  /**
   * Supabase获取资讯列表
   */
  getNewsFromSupabase() {
    console.log('🔍 开始从Supabase获取文章列表...');
    
    return this.makeSupabaseRequest('/rest/v1/content?type=eq.article&select=*&order=publish_date.desc&limit=20', 'GET')
      .then(data => {
        console.log('📊 Supabase响应数据:', data);
        
        if (!data || !Array.isArray(data)) {
          console.warn('⚠️ 资讯列表为空或格式异常，使用Mock数据');
          return [];
        }
        
        // 检查每篇文章的内容完整性
        const articlesWithContent = data.filter(article => {
          const hasContent = article.content && article.content.trim().length > 0;
          const hasTitle = article.title && article.title.trim().length > 0;
          const hasSummary = article.summary && article.summary.trim().length > 0;
          
          if (!hasContent) {
            console.warn(`⚠️ 文章 "${article.title}" 缺少正文内容`);
          }
          
          // 改进过滤逻辑：标题和摘要都必须有，内容如果没有就显示摘要
          return hasTitle && hasSummary;
        });
        
        console.log(`✅ 成功获取 ${articlesWithContent.length}/${data.length} 篇有效文章`);
        
        // 添加详细的数据验证日志
        if (data.length > 0) {
          data.forEach((article, index) => {
            console.log(`📄 文章${index + 1}: "${article.title}" - 内容长度: ${article.content ? article.content.length : 0}`);
          });
        }
        
        if (articlesWithContent.length === 0) {
          console.warn('⚠️ 没有有效文章内容，回退到Mock数据');
          console.warn('📋 原始数据验证:', data.map(article => ({
            title: article.title,
            hasContent: !!article.content,
            hasTitle: !!article.title,
            hasSummary: !!article.summary
          })));
          return this.getMockNews();
        }
        
        return articlesWithContent;
      })
      .catch(error => {
        console.error('❌ 获取资讯列表失败:', error);
        console.log('🔄 回退到Mock数据...');
        return this.getMockNews();
      });
  }

  /**
   * 微信云获取资讯列表
   */
  getNewsFromWeChat() {
    return new Promise((resolve, reject) => {
      this.db.collection('news').orderBy('publish_date', 'desc').get()
        .then(result => {
          resolve(result.data.map(news => new HealthNews(news)));
        })
        .catch(reject);
    });
  }

  /**
   * Mock资讯数据
   */
  getMockNews() {
    return Promise.resolve([
      {
        id: 'news1',
        title: '冬季健身的注意事项',
        summary: '冬天运动需要注意保暖、适度热身和及时补水等关键要点。',
        category: '健身指导',
        publishDate: '2024-01-15',
        readCount: 1205,
        thumbnail: 'https://picsum.photos/400/225?random=11'
      },
      {
        id: 'news2',
        title: '办公室白领如何预防职业病',
        summary: '长时间久坐办公容易引发颈椎病、腰椎间盘突出等职业病。',
        category: '职业健康',
        publishDate: '2024-01-14',
        readCount: 2340,
        thumbnail: 'https://picsum.photos/400/225?random=12'
      },
      {
        id: 'news3',
        title: '老年人运动康复的科学方法',
        summary: '老年人进行运动康复需要遵循循序渐进、适度为宜的原则。',
        category: '老年康复',
        publishDate: '2024-01-13',
        readCount: 890,
        thumbnail: 'https://picsum.photos/400/225?random=13'
      }
    ]);
  }

  /**
   * 获取社区活动列表
   */
  getEvents() {
    return new Promise((resolve, reject) => {
      try {
        if (this.useSupabase) {
          this.getEventsFromSupabase()
            .then(events => resolve(events))
            .catch(error => {
              console.error('获取活动列表失败:', error);
              resolve(this.getMockEvents());
            });
        } else {
          this.getEventsFromWeChat()
            .then(events => resolve(events))
            .catch(error => {
              console.error('获取活动列表失败:', error);
              resolve(this.getMockEvents());
            });
        }
      } catch (error) {
        console.error('获取活动列表失败:', error);
        resolve(this.getMockEvents());
      }
    });
  }

  /**
   * Supabase获取活动列表
   */
  getEventsFromSupabase() {
    // 使用正确的表名 events
    return this.makeSupabaseRequest('/rest/v1/events?select=*&order=date.desc&limit=10', 'GET');
  }

  /**
   * 微信云获取活动列表
   */
  getEventsFromWeChat() {
    return new Promise((resolve, reject) => {
      this.db.collection('events').orderBy('date', 'desc').get()
        .then(result => {
          resolve(result.data.map(event => new CommunityEvent(event)));
        })
        .catch(reject);
    });
  }

  /**
   * Mock活动数据 - 修复字段名以匹配数据库
   */
  getMockEvents() {
    return Promise.resolve([
      {
        id: 'event1',
        title: '膝关节康复训练营',
        description: '专业康复师一对一指导，个性化康复方案制定。',
        date: '2024-01-20', // 使用数据库字段名
        event_date: '2024-01-20', // 兼容性字段
        location: '康复中心训练室A',
        participant_count: 15,
        max_participants: 20,
        category: '康复训练',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'event2',
        title: '办公室健康讲座',
        description: '专家分享办公室职业病的预防和改善方法。',
        date: '2024-01-18',
        event_date: '2024-01-18',
        location: '公司会议室',
        participant_count: 45,
        max_participants: 50,
        category: '健康教育',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'event3',
        title: '老年跌倒预防工作坊',
        description: '学习平衡训练技巧，提升日常生活安全性。',
        date: '2024-01-25',
        event_date: '2024-01-25',
        location: '社区活动中心',
        participant_count: 28,
        max_participants: 30,
        category: '预防教育',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]);
  }

  /**
   * 获取健康语句
   */
  getHealthQuotes(count = 5) {
    if (this.useSupabase && this.supabase) {
      return this.getHealthQuotesFromSupabase(count);
    }
    return this.getMockHealthQuotes(count);
  }

  /**
   * Supabase获取健康语句
   */
  getHealthQuotesFromSupabase(count) {
    try {
      return this.makeSupabaseRequest(`/rest/v1/health_quotes?is_active=eq.true&select=*&order=sort_order.asc&limit=${count}`, 'GET')
        .then(data => {
          if (data && data.length > 0) {
            return data;
          }
          return this.getMockHealthQuotes(count);
        })
        .catch(error => {
          console.error('Supabase获取健康语句失败:', error);
          return this.getMockHealthQuotes(count);
        });
    } catch (error) {
      console.error('Supabase获取健康语句失败:', error);
      return this.getMockHealthQuotes(count);
    }
  }

  /**
   * Mock健康语句数据
   */
  getMockHealthQuotes(count) {
    const allQuotes = [
      {
        id: 'hq1',
        content: '每一天都是一个新的开始，坚持训练就是对自己最好的投资。',
        author: '康复专家',
        category: '康复励志',
        tags: ['坚持', '训练', '投资']
      },
      {
        id: 'hq2',
        content: '康复的道路虽然漫长，但每一步都让你更接近健康的自己。',
        author: '康复专家',
        category: '康复励志',
        tags: ['康复', '道路', '健康']
      },
      {
        id: 'hq3',
        content: '相信自己的身体，它比你想象的更强大。',
        author: '康复专家',
        category: '积极心态',
        tags: ['相信', '身体', '强大']
      },
      {
        id: 'hq4',
        content: '营养是身体修复的燃料，合理饮食让康复事半功倍。',
        author: '营养师',
        category: '营养饮食',
        tags: ['营养', '修复', '饮食']
      },
      {
        id: 'hq5',
        content: '训练后的拉伸，是对自己最好的感谢。',
        author: '物理治疗师',
        category: '康复励志',
        tags: ['拉伸', '感谢', '训练']
      }
    ];

    // 随机打乱并返回指定数量
    const shuffled = allQuotes.sort(() => Math.random() - 0.5);
    return Promise.resolve(shuffled.slice(0, count));
  }

  /**
   * 获取视频详情
   */
  getVideoById(videoId) {
    return new Promise((resolve, reject) => {
      try {
        if (this.useSupabase) {
          this.getVideoByIdSupabase(videoId)
            .then(resolve)
            .catch(error => {
              console.error('获取视频详情失败:', error);
              resolve(this.getMockVideoById(videoId));
            });
        } else {
          this.getVideoByIdWeChat(videoId)
            .then(resolve)
            .catch(error => {
              console.error('获取视频详情失败:', error);
              resolve(this.getMockVideoById(videoId));
            });
        }
      } catch (error) {
        console.error('获取视频详情失败:', error);
        resolve(this.getMockVideoById(videoId));
      }
    });
  }

  /**
   * Supabase获取视频详情
   */
  getVideoByIdSupabase(videoId) {
    return this.makeSupabaseRequest(`/rest/v1/training_videos?id=eq.${videoId}&select=*`, 'GET')
      .then(data => {
        if (data && data.length > 0) {
          return data[0];
        }
        return this.getMockVideoById(videoId);
      });
  }

  /**
   * 微信云获取视频详情
   */
  getVideoByIdWeChat(videoId) {
    return new Promise((resolve, reject) => {
      this.db.collection('videos').doc(videoId).get()
        .then(result => {
          resolve(new TrainingVideo(result.data));
        })
        .catch(reject);
    });
  }

  /**
   * Mock视频详情数据
   */
  getMockVideoById(videoId) {
    return Promise.resolve({
      id: videoId,
      title: '康复训练示范视频',
      description: '本视频将为您详细讲解康复训练的正确姿势和注意事项，帮助您更好地进行康复训练。',
      videoUrl: 'https://example.com/videos/sample.mp4',
      thumbnail: '/images/default-video-thumb.png',
      duration: '10:30',
      category: '康复训练',
      views: 1580,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * 获取推荐视频
   */
  getRecommendedVideos(category = 'rehabilitation', limit = 6) {
    return new Promise((resolve, reject) => {
      if (this.useSupabase) {
        this.getRecommendedVideosFromSupabase(category, limit)
          .then(resolve)
          .catch(error => {
            console.error('获取推荐视频失败:', error);
            resolve(this.getMockRecommendedVideos(category, limit));
          });
      } else {
        this.getRecommendedVideosFromWeChat(category, limit)
          .then(resolve)
          .catch(error => {
            console.error('获取推荐视频失败:', error);
            resolve(this.getMockRecommendedVideos(category, limit));
          });
      }
    });
  }

  /**
   * Supabase获取推荐视频
   */
  getRecommendedVideosFromSupabase(category, limit) {
    return this.makeSupabaseRequest(`/rest/v1/training_videos?category=eq.${category}&select=*&order=views.desc&limit=${limit}`, 'GET');
  }

  /**
   * 微信云获取推荐视频
   */
  getRecommendedVideosFromWeChat(category, limit) {
    return new Promise((resolve, reject) => {
      this.db.collection('videos').where({
        category: category
      }).limit(limit).orderBy('views', 'desc').get()
        .then(result => {
          resolve(result.data.map(video => new TrainingVideo(video)));
        })
        .catch(reject);
    });
  }

  /**
   * Mock推荐视频数据
   */
  getMockRecommendedVideos(category, limit) {
    const mockVideos = [
      { id: 'video1', title: '康复训练基础动作', category, views: 2100, thumbnail: '/images/video1.jpg', duration: '08:30' },
      { id: 'video2', title: '腰部力量训练', category, views: 1890, thumbnail: '/images/video2.jpg', duration: '12:15' },
      { id: 'video3', title: '颈椎康复运动', category, views: 1650, thumbnail: '/images/video3.jpg', duration: '10:45' },
      { id: 'video4', title: '肩部拉伸练习', category, views: 1420, thumbnail: '/images/video4.jpg', duration: '06:20' },
      { id: 'video5', title: '下肢康复训练', category, views: 1350, thumbnail: '/images/video5.jpg', duration: '15:00' },
      { id: 'video6', title: '全身协调练习', category, views: 1200, thumbnail: '/images/video6.jpg', duration: '11:30' }
    ];
    return Promise.resolve(mockVideos.slice(0, limit));
  }

  /**
   * 根据ID获取新闻详情
   */
  getNewsById(newsId) {
    return new Promise((resolve, reject) => {
      if (this.useSupabase) {
        this.getNewsByIdSupabase(newsId)
          .then(data => resolve(data))
          .catch(error => {
            console.error('获取新闻详情失败:', error);
            resolve(this.getMockNewsById(newsId));
          });
      } else {
        this.getNewsByIdWeChat(newsId)
          .then(data => resolve(data))
          .catch(error => {
            console.error('获取新闻详情失败:', error);
            resolve(this.getMockNewsById(newsId));
          });
      }
    });
  }

  /**
   * Supabase获取新闻详情
   */
  getNewsByIdSupabase(newsId) {
    return this.makeSupabaseRequest(`/rest/v1/health_news?id=eq.${newsId}&select=*`, 'GET')
      .then(data => data && data[0] ? data[0] : null);
  }

  /**
   * 微信云获取新闻详情
   */
  getNewsByIdWeChat(newsId) {
    return new Promise((resolve, reject) => {
      this.db.collection('health_news').doc(newsId).get()
        .then(result => resolve(result.data))
        .catch(reject);
    });
  }

  /**
   * Mock新闻详情数据
   */
  getMockNewsById(newsId) {
    const mockArticles = [
      {
        id: newsId,
        title: '肩颈疼痛的缓解方法',
        summary: '日常肩颈疼痛的自我缓解技巧和预防措施。',
        content: `<h2>肩颈疼痛缓解方法</h2>
        <p>肩颈疼痛是现代人常见的健康问题，特别是长时间使用电脑和手机的人群。以下是一些有效的缓解方法：</p>
        <h3>1. 颈部拉伸运动</h3>
        <p>轻柔地转动颈部，每个方向保持15-30秒。</p>
        <h3>2. 正确的坐姿</h3>
        <p>保持背部挺直，肩膀放松，避免长时间低头。</p>
        <h3>3. 热敷治疗</h3>
        <p>使用温热毛巾敷在疼痛部位，每次15-20分钟。</p>
        <h3>4. 适当休息</h3>
        <p>每工作1小时，起身活动5-10分钟。</p>`,
        type: 'article',
        category: 'health',
        tags: ['肩颈', '疼痛缓解', '康复'],
        views: 1250,
        author: '康复专家',
        publish_time: new Date().toISOString(),
        thumbnail: '/images/news1.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'news-2',
        title: '康复训练的黄金时间',
        summary: '什么时候进行康复训练效果最佳？',
        content: `<h2>康复训练的黄金时间</h2>
        <p>选择合适的时间进行康复训练对效果至关重要。</p>
        <h3>最佳训练时间</h3>
        <p>1. 早晨：身体状态良好，肌肉灵活</p>
        <p>2. 下午：体温升高，关节活动度好</p>
        <p>3. 避免饭后立即训练</p>`,
        type: 'article',
        category: 'training',
        tags: ['康复训练', '时间', '效果'],
        views: 890,
        author: '康复教练',
        publish_time: new Date().toISOString(),
        thumbnail: '/images/news2.jpg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return mockArticles.find(article => article.id === newsId) || mockArticles[0];
  }

  /**
   * 记录视频观看
   */
  recordVideoView(videoId) {
    return new Promise((resolve, reject) => {
      if (this.useSupabase) {
        // 获取当前观看次数
        this.getVideoById(videoId)
          .then(video => {
            const currentViews = video.views || 0;
            const newViews = currentViews + 1;
            
            // 更新观看次数
            return this.makeSupabaseRequest(`/rest/v1/training_videos?id=eq.${videoId}`, 'PATCH', {
              views: newViews,
              updated_at: new Date().toISOString()
            });
          })
          .then(() => resolve())
          .catch(error => {
            console.error('记录视频观看失败:', error);
            resolve(); // 不抛出错误，避免影响用户体验
          });
      } else {
        // 微信云记录观看
        this.db.collection('videos').doc(videoId).update({
          views: wx.cloud.database().cmd.inc(1),
          updated_at: new Date()
        })
        .then(() => resolve())
        .catch(error => {
          console.error('记录视频观看失败:', error);
          resolve();
        });
      }
    });
  }

  /**
   * 检查收藏状态
   */
  checkFavoriteStatus(type, videoId) {
    return new Promise((resolve, reject) => {
      if (this.useSupabase) {
        const userId = this.getCurrentUserId();
        this.makeSupabaseRequest(`/rest/v1/user_favorites?user_id=eq.${userId}&content_type=eq.${type}&content_id=eq.${videoId}`, 'GET')
          .then(data => resolve(data && data.length > 0))
          .catch(() => resolve(false));
      } else {
        // 微信云检查收藏
        const userId = this.getCurrentUserId();
        this.db.collection('user_favorites').where({
          user_id: userId,
          content_type: type,
          content_id: videoId
        }).get()
          .then(result => resolve(result.data.length > 0))
          .catch(() => resolve(false));
      }
    });
  }

  /**
   * 添加收藏
   */
  addFavorite(type, videoId) {
    return new Promise((resolve, reject) => {
      if (this.useSupabase) {
        const userId = this.getCurrentUserId();
        this.makeSupabaseRequest('/rest/v1/user_favorites', 'POST', {
          user_id: userId,
          content_type: type,
          content_id: videoId,
          created_at: new Date().toISOString()
        })
          .then(resolve)
          .catch(error => {
            console.error('添加收藏失败:', error);
            reject(error);
          });
      } else {
        // 微信云添加收藏
        const userId = this.getCurrentUserId();
        this.db.collection('user_favorites').add({
          data: {
            user_id: userId,
            content_type: type,
            content_id: videoId,
            created_at: new Date()
          }
        })
          .then(resolve)
          .catch(reject);
      }
    });
  }

  /**
   * 移除收藏
   */
  removeFavorite(type, videoId) {
    return new Promise((resolve, reject) => {
      if (this.useSupabase) {
        const userId = this.getCurrentUserId();
        this.makeSupabaseRequest(`/rest/v1/user_favorites?user_id=eq.${userId}&content_type=eq.${type}&content_id=eq.${videoId}`, 'DELETE')
          .then(resolve)
          .catch(error => {
            console.error('移除收藏失败:', error);
            reject(error);
          });
      } else {
        // 微信云移除收藏
        const userId = this.getCurrentUserId();
        this.db.collection('user_favorites').where({
          user_id: userId,
          content_type: type,
          content_id: videoId
        }).remove()
          .then(resolve)
          .catch(reject);
      }
    });
  }

  // ==================== 用户管理方法 ====================
  
  /**
   * 根据手机号获取用户信息
   */
  getUserByPhone(phone) {
    return new Promise((resolve, reject) => {
      if (!phone) {
        reject(new Error('手机号不能为空'));
        return;
      }

      if (this.useSupabase && this.supabase) {
        // 从Supabase查询用户，包含所有必要字段
        this.makeSupabaseRequest('/rest/v1/user_profiles?select=user_id,phone,name,nickname,avatar,avatar_url,created_at,updated_at,total_login_days,last_login_date&phone=eq.' + encodeURIComponent(phone), 'GET')
          .then(data => {
            if (data && data.length > 0) {
              resolve(data[0]);
            } else {
              resolve(null);
            }
          })
          .catch(error => {
            console.error('Supabase获取用户失败:', error);
            // 降级到Mock数据
            this.getMockUserByPhone(phone).then(resolve).catch(reject);
          });
      } else {
        // 降级到Mock数据
        this.getMockUserByPhone(phone).then(resolve).catch(reject);
      }
    });
  }

  /**
   * 根据用户ID获取用户信息
   */
  getUserById(userId) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        reject(new Error('用户ID不能为空'));
        return;
      }

      if (this.useSupabase && this.supabase) {
        // 从Supabase查询用户，包含所有必要字段
        this.makeSupabaseRequest('/rest/v1/user_profiles?select=user_id,phone,name,nickname,avatar,avatar_url,created_at,updated_at,total_login_days,last_login_date&user_id=eq.' + encodeURIComponent(userId), 'GET')
          .then(data => {
            if (data && data.length > 0) {
              resolve(data[0]);
            } else {
              resolve(null);
            }
          })
          .catch(error => {
            console.error('Supabase获取用户失败:', error);
            // 降级到Mock数据
            this.getMockUserById(userId).then(resolve).catch(reject);
          });
      } else {
        // 降级到Mock数据
        this.getMockUserById(userId).then(resolve).catch(reject);
      }
    });
  }

  /**
   * 创建用户
   */
  createUser(user) {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error('用户信息不能为空'));
        return;
      }

      // 确保user_id存在且为UUID格式
      if (!user.user_id || user.user_id.trim() === '') {
        user.user_id = this.generateUUID();
        if (!user.user_id) {
          console.error('UUID生成失败，使用时间戳方案');
          user.user_id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        }
      }

      // 字段映射：确保数据库字段名正确，处理空值和默认值
      const userData = {
        user_id: user.user_id,
        phone: user.phone || null,
        name: user.name || user.nickname || null,
        avatar: user.avatar || user.avatar_url || null,
        avatar_url: user.avatar_url || user.avatar || null,
        nickname: user.nickname || user.name || null,
        login_count: Math.max(parseInt(user.loginCount) || 0, 1),
        total_login_days: Math.max(parseInt(user.loginCount) || 0, 1),
        subscriptions: Array.isArray(user.subscriptions) ? user.subscriptions : [],
        last_login_date: new Date().toISOString().split('T')[0],
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (this.useSupabase && this.supabase) {
        // 保存到Supabase
        this.makeSupabaseRequest('/rest/v1/user_profiles', 'POST', userData)
          .then(data => {
            resolve(data);
          })
          .catch(error => {
            console.error('Supabase创建用户失败:', error);
            // 降级：本地模拟创建成功
            this.getMockUserByPhone(user.phone).then(() => resolve(user)).catch(reject);
          });
      } else {
        // Mock数据：模拟创建成功
        this.getMockUserByPhone(user.phone).then(() => resolve(user)).catch(reject);
      }
    });
  }

  /**
   * 更新用户信息
   */
  updateUser(user) {
    return new Promise((resolve, reject) => {
      if (!user) {
        reject(new Error('用户信息不能为空'));
        return;
      }

      if (!user.user_id) {
        reject(new Error('用户ID不能为空'));
        return;
      }

      // 字段映射：确保数据库字段名正确，处理空值和默认值
      const updateData = {
        phone: user.phone,
        name: user.name || user.nickname || null,
        avatar: user.avatar || user.avatar_url || null,
        avatar_url: user.avatar_url || user.avatar || null,
        nickname: user.nickname || user.name || null,
        login_count: user.loginCount ? parseInt(user.loginCount) : undefined,
        total_login_days: user.loginCount ? parseInt(user.loginCount) : undefined,
        subscriptions: Array.isArray(user.subscriptions) ? user.subscriptions : undefined,
        last_login_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      };

      // 移除 undefined 字段
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      if (this.useSupabase && this.supabase) {
        // 在Supabase中更新用户
        this.updateUserById(user.user_id, updateData)
          .then(data => {
            resolve(data);
          })
          .catch(error => {
            console.error('Supabase更新用户失败:', error);
            // 降级：模拟更新成功
            resolve(user);
          });
      } else {
        // Mock数据：模拟更新成功
        resolve(user);
      }
    });
  }

  /**
   * 根据用户ID更新用户信息 - 统一的更新方法
   */
  updateUserById(userId, updateData) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        reject(new Error('用户ID不能为空'));
        return;
      }

      if (!updateData) {
        reject(new Error('更新数据不能为空'));
        return;
      }

      if (this.useSupabase && this.supabase) {
        // 在Supabase中更新用户
        this.makeSupabaseRequest(`/rest/v1/user_profiles?user_id=eq.${userId}`, 'PATCH', updateData)
          .then(data => {
            console.log('Supabase用户更新成功:', userId, updateData);
            resolve(data);
          })
          .catch(error => {
            console.error('Supabase更新用户失败:', error);
            reject(error);
          });
      } else {
        // Mock数据：模拟更新成功
        console.log('Mock更新用户成功:', userId);
        resolve({ user_id: userId, ...updateData });
      }
    });
  }

  /**
   * 专门用于更新用户订阅偏好的方法 - 实现事务性更新
   */
  updateUserSubscriptions(userId, subscriptions) {
    return new Promise((resolve, reject) => {
      if (!userId) {
        reject(new Error('用户ID不能为空'));
        return;
      }

      if (!Array.isArray(subscriptions)) {
        reject(new Error('订阅数据必须是数组格式'));
        return;
      }

      // 先验证用户是否存在
      this.getUserById(userId).then(user => {
        if (!user) {
          reject(new Error('用户不存在'));
          return;
        }

        // 构建更新数据
        const updateData = {
          subscriptions: subscriptions,
          updated_at: new Date().toISOString()
        };

        console.log('开始更新用户订阅偏好:', userId, subscriptions);

        // 执行更新
        this.updateUserById(userId, updateData)
          .then(updatedData => {
            console.log('用户订阅偏好更新成功:', userId);
            
            // 返回更新后的完整用户信息
            const resultUser = {
              ...user,
              subscriptions: subscriptions,
              updated_at: updateData.updated_at
            };
            
            resolve(resultUser);
          })
          .catch(error => {
            console.error('更新用户订阅偏好失败:', error);
            reject(error);
          });
      }).catch(error => {
        console.error('验证用户失败:', error);
        reject(new Error('用户验证失败，请稍后重试'));
      });
    });
  }

  /**
   * Mock：根据手机号获取用户
   */
  getMockUserByPhone(phone) {
    const mockUsers = [
      {
        user_id: 'user_demo_001',
        phone: '13800138001',
        nickname: '康复达人',
        avatar_url: '/assets/avatars/avatar_1.png',
        total_login_days: 10,
        last_login_date: new Date().toISOString().split('T')[0],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const user = mockUsers.find(u => u.phone === phone);
    return Promise.resolve(user || null);
  }

  /**
   * Mock：根据用户ID获取用户
   */
  getMockUserById(userId) {
    const mockUsers = [
      {
        user_id: 'user_demo_001',
        phone: '13800138001',
        nickname: '康复达人',
        avatar_url: '/assets/avatars/avatar_1.png',
        total_login_days: 10,
        last_login_date: new Date().toISOString().split('T')[0],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    const user = mockUsers.find(u => u.user_id === userId);
    return Promise.resolve(user || null);
  }

  // ==================== 推荐系统方法 ====================
  
  /**
   * 获取个性化推荐内容（返回数组格式供前端使用）
   */
  getRecommendedContent(userId = null, preferences = {}) {
    return new Promise((resolve, reject) => {
      if (this.useSupabase && this.supabase) {
        // 从Supabase获取推荐内容
        this.getRecommendedContentFromSupabase(userId, preferences)
          .then(data => {
            // 转换为数组格式：合并所有内容
            const allContent = [
              ...(data.videos || []).map(v => ({...v, type: 'video'})),
              ...(data.news || []).map(n => ({...n, type: 'article'})),
              ...(data.events || []).map(e => ({...e, type: 'event'}))
            ];
            resolve(allContent);
          })
          .catch(error => {
            console.error('Supabase获取推荐内容失败:', error);
            // 降级到Mock数据
            this.getMockRecommendedContent(userId, preferences)
              .then(mockData => {
                const allContent = [
                  ...(mockData.videos || []).map(v => ({...v, type: 'video'})),
                  ...(mockData.news || []).map(n => ({...n, type: 'article'})),
                  ...(mockData.events || []).map(e => ({...e, type: 'event'}))
                ];
                resolve(allContent);
              })
              .catch(reject);
          });
      } else {
        // 降级到Mock数据
        this.getMockRecommendedContent(userId, preferences)
          .then(mockData => {
            const allContent = [
              ...(mockData.videos || []).map(v => ({...v, type: 'video'})),
              ...(mockData.news || []).map(n => ({...n, type: 'article'})),
              ...(mockData.events || []).map(e => ({...e, type: 'event'}))
            ];
            resolve(allContent);
          })
          .catch(reject);
      }
    });
  }

  /**
   * 检查数据库连接状态
   */
  async checkDatabaseConnection() {
    try {
      if (!this.useSupabase || !this.supabase) {
        console.log('使用Mock数据，跳过连接检查');
        return { connected: false, service: 'mock' };
      }

      const startTime = Date.now();
      await this.makeSupabaseRequest('/rest/v1/user_profiles?select=user_id&limit=1', 'GET');
      const responseTime = Date.now() - startTime;
      
      console.log(`数据库连接正常 (${responseTime}ms)`);
      return { 
        connected: true, 
        service: 'supabase', 
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('数据库连接检查失败:', error);
      return { 
        connected: false, 
        service: 'supabase', 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 生成UUID格式的ID
   */
  generateUUID() {
    try {
      // 使用微信小程序的UUID生成
      if (wx.getFileSystemManager) {
        const buffer = new ArrayBuffer(16);
        const view = new DataView(buffer);
        for (let i = 0; i < 16; i++) {
          view.setUint8(i, Math.floor(Math.random() * 256));
        }
        // 设置版本号（4）和变异位
        view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x40);
        view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80);
        
        return Array.from(new Uint8Array(buffer)).map((b, i) => {
          if ([4, 6, 8, 10].includes(i)) return '-' + b.toString(16).padStart(2, '0');
          return b.toString(16).padStart(2, '0');
        }).join('');
      } else {
        // 降级方案：使用时间戳+随机数
        const timestamp = Date.now().toString(16);
        const random = Math.random().toString(16).substring(2);
        return `${timestamp}-${random}-${Date.now()}`;
      }
    } catch (error) {
      console.error('UUID生成失败:', error);
      // 紧急降级方案
      return `uuid-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  /**
   * 从Supabase获取推荐内容
   */
  getRecommendedContentFromSupabase(userId, preferences) {
    try {
      // 获取推荐视频
      const videosPromise = this.makeSupabaseRequest('/rest/v1/training_videos?select=*&order=views.desc&limit=5', 'GET');
      
      // 获取推荐资讯
      const newsPromise = this.makeSupabaseRequest('/rest/v1/content?select=*&type=eq.article&order=publish_date.desc&limit=5', 'GET');
      
      // 获取推荐活动 - 使用正确的表名 events
      const eventsPromise = this.makeSupabaseRequest('/rest/v1/events?select=*&order=date.desc&limit=3', 'GET');

      return Promise.all([videosPromise, newsPromise, eventsPromise])
        .then(([videos, news, events]) => {
          return {
            videos: videos || [],
            news: news || [],
            events: events || [],
            total: (videos?.length || 0) + (news?.length || 0) + (events?.length || 0)
          };
        });
    } catch (error) {
      console.error('获取推荐内容异常:', error);
      throw error;
    }
  }

  /**
   * Mock推荐内容
   */
  getMockRecommendedContent(userId, preferences) {
    return Promise.resolve({
      videos: [
        {
          id: 'rec_vid_1',
          title: '个性化推荐康复训练',
          description: '根据您的健康状况定制的康复训练计划',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail: 'https://picsum.photos/400/300?random=100',
          duration: '15:30',
          category: '康复训练',
          views: 1250
        },
        {
          id: 'rec_vid_2', 
          title: '核心肌群强化训练',
          description: '专门针对核心肌群的强化练习',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail: 'https://picsum.photos/400/300?random=101',
          duration: '12:45',
          category: '核心训练',
          views: 980
        },
        {
          id: 'rec_vid_3',
          title: '日常拉伸放松',
          description: '简单有效的日常拉伸动作',
          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          thumbnail: 'https://picsum.photos/400/300?random=102',
          duration: '8:20',
          category: '拉伸放松',
          views: 756
        }
      ],
      news: [
        {
          id: 'rec_news_1',
          title: '康复医学最新研究进展',
          summary: '了解康复医学领域的最新研究成果',
          content: '近期研究表明，早期康复干预对患者恢复具有重要意义...',
          publishDate: new Date().toISOString(),
          category: '康复医学',
          author: '康复专家'
        },
        {
          id: 'rec_news_2',
          title: '健康生活方式指南',
          summary: '如何建立科学的健康生活习惯',
          content: '健康的生活方式是预防疾病和促进康复的重要基础...',
          publishDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          category: '健康生活',
          author: '健康顾问'
        }
      ],
      events: [
        {
          id: 'rec_event_1',
          title: '线上康复训练课程',
          description: '专业康复师指导的在线训练课程',
          eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          location: '线上',
          participants: 150
        },
        {
          id: 'rec_event_2',
          title: '健康知识讲座',
          description: '康复健康知识普及讲座',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: '社区中心',
          participants: 80
        }
      ],
      total: 7
    });
  }
}

// 创建全局实例
const cloudService = new CloudService();

// 确保在模块加载时初始化
try {
  cloudService.initialize();
  console.log('CloudService 模块加载完成');
} catch (error) {
  console.error('CloudService 初始化失败:', error);
}

// 导出云服务实例和类
module.exports = {
  CloudService: cloudService,
  cloudService: cloudService,
  getService: () => cloudService,
  checkConnection: () => cloudService.checkDatabaseConnection()
};
