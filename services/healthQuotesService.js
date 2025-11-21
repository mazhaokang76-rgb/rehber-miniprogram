/**
 * 健康语录服务类 - 处理健康语录相关操作
 */
class HealthQuotesService {
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
   * 获取随机健康语录
   * @param {number} count - 获取语录数量，默认5条
   * @param {string} category - 分类筛选 (康复励志,运动健康,营养饮食,心理健康)
   * @param {string} timeFilter - 时间段筛选 (morning,afternoon,evening,general,all)
   */
  getRandomHealthQuotes(count = 5, category = null, timeFilter = 'all') {
    return new Promise((resolve, reject) => {
      try {
        let endpoint = `/rest/v1/health_quotes?is_active=eq.true&select=*&order=created_at.desc`;
        
        if (category) {
          endpoint += `&category=eq.${encodeURIComponent(category)}`;
        }
        
        // 对于时间筛选，只筛选特定时间段的语录
        if (timeFilter && timeFilter !== 'all') {
          endpoint += `&time_period=eq.${timeFilter}`;
        }

        this.makeSupabaseRequest(endpoint, 'GET')
          .then(response => {
            if (response && Array.isArray(response)) {
              // 随机排序并限制数量
              const shuffled = response.sort(() => Math.random() - 0.5);
              const result = shuffled.slice(0, count);
              // 适配数据格式
              const adaptedQuotes = this.adaptQuotesArray(result);
              resolve(adaptedQuotes);
            } else {
              resolve([]);
            }
          })
          .catch(error => {
            console.error('获取健康语录失败:', error);
            reject(error);
          });
      } catch (error) {
        console.error('获取健康语录失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 适配数据格式（将数据库字段转换为服务类需要的格式）
   * @param {object} dbQuote - 数据库中的语录对象
   */
  adaptQuoteFormat(dbQuote) {
    if (!dbQuote) return null;
    
    return {
      id: dbQuote.id,
      content: dbQuote.quote_text || dbQuote.content,
      author: dbQuote.author || '健康小助手',
      category: dbQuote.category || '康复励志',
      tags: dbQuote.tags || [],
      time_period: dbQuote.time_period || 'general',
      display_order: dbQuote.sort_order || 0,
      created_at: dbQuote.created_at,
      updated_at: dbQuote.updated_at
    };
  }

  /**
   * 批量适配数据格式
   * @param {Array} dbQuotes - 数据库语录数组
   */
  adaptQuotesArray(dbQuotes) {
    if (!Array.isArray(dbQuotes)) return [];
    return dbQuotes.map(quote => this.adaptQuoteFormat(quote)).filter(quote => quote !== null);
  }

  /**
   * 获取智能健康语录（根据时间段推荐）
   * @param {number} count - 获取语录数量，默认5条
   */
  getSmartHealthQuotes(count = 5) {
    return new Promise((resolve, reject) => {
      try {
        const currentHour = new Date().getHours();
        let timeFilter = 'general';
        
        // 根据当前时间段确定推荐类型
        if (currentHour >= 5 && currentHour < 12) {
          timeFilter = 'morning'; // 上午：康复励志
        } else if (currentHour >= 12 && currentHour < 18) {
          timeFilter = 'afternoon'; // 下午：运动健康
        } else if (currentHour >= 18 && currentHour < 23) {
          timeFilter = 'evening'; // 晚上：心理健康
        } else {
          timeFilter = 'general'; // 深夜：全部类型
        }

        // 优先获取当前时间段的语录
        this.getRandomHealthQuotes(count, null, timeFilter)
          .then(quotes => {
            // 如果当前时间段的语录不足，则补充全部类型的语录
            if (quotes.length < count) {
              const remainingCount = count - quotes.length;
              // 不指定时间筛选，获取所有类型
              this.getRandomHealthQuotes(remainingCount, null, null)
                .then(additionalQuotes => {
                  // 适配数据格式
                  const adaptedQuotes = this.adaptQuotesArray(quotes);
                  const adaptedAdditional = this.adaptQuotesArray(additionalQuotes);
                  
                  // 去重并合并
                  const existingIds = adaptedQuotes.map(q => q.id);
                  const newQuotes = adaptedAdditional.filter(q => !existingIds.includes(q.id));
                  const result = [...adaptedQuotes, ...newQuotes].slice(0, count);
                  resolve(result);
                })
                .catch(() => resolve(this.adaptQuotesArray(quotes)));
            } else {
              resolve(this.adaptQuotesArray(quotes));
            }
          })
          .catch(reject);
      } catch (error) {
        console.error('获取智能健康语录失败:', error);
        reject(error);
      }
    });
  }

  /**
   * 获取今日健康语录（单条）
   */
  getTodayQuote() {
    return new Promise((resolve, reject) => {
      this.getSmartHealthQuotes(1)
        .then(quotes => {
          if (quotes && quotes.length > 0) {
            resolve(quotes[0]);
          } else {
            // 如果数据库没有数据，返回默认语录
            resolve({
              id: 'default',
              content: '今天也要保持健康活力！',
              author: '健康小助手',
              category: '康复励志',
              tags: ['健康', '活力'],
              time_period: 'general'
            });
          }
        })
        .catch(error => {
          console.error('获取今日语录失败:', error);
          // 返回默认语录
          resolve({
            id: 'default',
            content: '今天也要保持健康活力！',
            author: '健康小助手',
            category: '康复励志',
            tags: ['健康', '活力'],
            time_period: 'general'
          });
        });
    });
  }

  /**
   * 获取分类健康语录
   * @param {string} category - 分类名称
   * @param {number} count - 获取数量，默认10条
   */
  getQuotesByCategory(category, count = 10) {
    return this.getRandomHealthQuotes(count, category, null);
  }

  /**
   * 格式化语录文本（用于显示）
   * @param {object} quote - 语录对象
   */
  formatQuoteText(quote) {
    if (!quote) return '今天也要保持健康活力！';
    
    const content = quote.content || quote.quote_text || '今天也要保持健康活力！';
    const author = quote.author ? ` — ${quote.author}` : '';
    
    return content + author;
  }

  /**
   * 获取分类标签
   */
  getCategoryTags() {
    return [
      { value: '康复励志', label: '💪 康复励志', color: '#3b82f6' },
      { value: '运动健康', label: '🏃 运动健康', color: '#10b981' },
      { value: '营养饮食', label: '🥗 营养饮食', color: '#f59e0b' },
      { value: '心理健康', label: '🧘 心理健康', color: '#8b5cf6' }
    ];
  }
}

// 创建全局实例
const healthQuotesService = new HealthQuotesService();

module.exports = {
  HealthQuotesService: healthQuotesService
};