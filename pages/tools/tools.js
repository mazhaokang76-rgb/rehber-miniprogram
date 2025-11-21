// pages/tools/tools.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 模态框显示状态
    showCalorieModal: false,
    showHeartrateModal: false,

    // 卡路里计算表单
    calorieForm: {
      gender: 'male',
      age: '',
      height: '',
      weight: '',
      activityIndex: 1
    },

    // 活动水平选项
    activityLevels: [
      '久坐不动（几乎不运动）',
      '轻度活动（每周1-3次）',
      '中度活动（每周3-5次）',
      '重度活动（每周6-7次）',
      '专业运动员'
    ],

    // 活动系数
    activityFactors: [1.2, 1.375, 1.55, 1.725, 1.9],

    // 卡路里计算结果
    calorieResult: null,

    // 心率计算表单
    heartrateForm: {
      age: '',
      restingHr: ''
    },

    // 心率计算结果
    heartrateResult: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('工具页面加载');
  },

  /**
   * 工具卡片点击
   */
  handleToolTap(e) {
    const tool = e.currentTarget.dataset.tool;
    
    if (tool === 'calorie') {
      this.setData({ showCalorieModal: true });
    } else if (tool === 'heartrate') {
      this.setData({ showHeartrateModal: true });
    }
  },

  /**
   * 关闭模态框
   */
  handleCloseModal() {
    this.setData({
      showCalorieModal: false,
      showHeartrateModal: false
    });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 空函数，阻止点击模态框内容时关闭
  },

  // ========== 卡路里计算器 ==========

  /**
   * 性别选择
   */
  handleGenderChange(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      'calorieForm.gender': gender
    });
  },

  /**
   * 年龄输入
   */
  handleAgeInput(e) {
    this.setData({
      'calorieForm.age': e.detail.value
    });
  },

  /**
   * 身高输入
   */
  handleHeightInput(e) {
    this.setData({
      'calorieForm.height': e.detail.value
    });
  },

  /**
   * 体重输入
   */
  handleWeightInput(e) {
    this.setData({
      'calorieForm.weight': e.detail.value
    });
  },

  /**
   * 活动水平选择
   */
  handleActivityChange(e) {
    this.setData({
      'calorieForm.activityIndex': parseInt(e.detail.value)
    });
  },

  /**
   * 计算卡路里
   */
  handleCalculateCalorie() {
    const form = this.data.calorieForm;

    // 验证输入
    if (!form.age || !form.height || !form.weight) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    const age = parseFloat(form.age);
    const height = parseFloat(form.height);
    const weight = parseFloat(form.weight);

    if (age <= 0 || age > 120) {
      wx.showToast({
        title: '请输入有效的年龄',
        icon: 'none'
      });
      return;
    }

    if (height <= 0 || height > 250) {
      wx.showToast({
        title: '请输入有效的身高',
        icon: 'none'
      });
      return;
    }

    if (weight <= 0 || weight > 300) {
      wx.showToast({
        title: '请输入有效的体重',
        icon: 'none'
      });
      return;
    }

    // 使用修正的Harris-Benedict公式计算基础代谢率(BMR)
    let bmr;
    if (form.gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // 计算总能量消耗(TDEE) = BMR × 活动系数
    const activityFactor = this.data.activityFactors[form.activityIndex];
    const tdee = bmr * activityFactor;

    // 计算减重、维持、增重所需卡路里
    const lose = tdee - 500;  // 减重：减少500kcal
    const maintain = tdee;     // 维持
    const gain = tdee + 500;   // 增重：增加500kcal

    this.setData({
      calorieResult: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        lose: Math.round(lose),
        maintain: Math.round(maintain),
        gain: Math.round(gain)
      }
    });

    console.log('卡路里计算结果:', this.data.calorieResult);
  },

  // ========== 心率计算器 ==========

  /**
   * 心率年龄输入
   */
  handleHeartrateAgeInput(e) {
    this.setData({
      'heartrateForm.age': e.detail.value
    });
  },

  /**
   * 静息心率输入
   */
  handleRestingHrInput(e) {
    this.setData({
      'heartrateForm.restingHr': e.detail.value
    });
  },

  /**
   * 计算最佳心率
   */
  handleCalculateHeartrate() {
    const form = this.data.heartrateForm;

    // 验证输入
    if (!form.age) {
      wx.showToast({
        title: '请输入年龄',
        icon: 'none'
      });
      return;
    }

    const age = parseFloat(form.age);
    const restingHr = form.restingHr ? parseFloat(form.restingHr) : 60; // 默认静息心率60

    if (age <= 0 || age > 120) {
      wx.showToast({
        title: '请输入有效的年龄',
        icon: 'none'
      });
      return;
    }

    if (restingHr < 40 || restingHr > 100) {
      wx.showToast({
        title: '静息心率应在40-100之间',
        icon: 'none'
      });
      return;
    }

    // 计算最大心率 = 220 - 年龄
    const maxHr = 220 - age;

    // 使用Karvonen公式计算不同训练区的心率
    // 目标心率 = (最大心率 - 静息心率) × 强度% + 静息心率

    const zones = {
      warmup: this.calculateHrZone(maxHr, restingHr, 0.5, 0.6),   // 热身区：50-60%
      fatburn: this.calculateHrZone(maxHr, restingHr, 0.6, 0.7),  // 燃脂区：60-70%
      cardio: this.calculateHrZone(maxHr, restingHr, 0.7, 0.8),   // 有氧区：70-80%
      peak: this.calculateHrZone(maxHr, restingHr, 0.8, 0.9)      // 无氧区：80-90%
    };

    this.setData({
      heartrateResult: {
        maxHr: Math.round(maxHr),
        zones: zones
      }
    });

    console.log('心率计算结果:', this.data.heartrateResult);
  },

  /**
   * 计算心率区间
   */
  calculateHrZone(maxHr, restingHr, minIntensity, maxIntensity) {
    const min = Math.round((maxHr - restingHr) * minIntensity + restingHr);
    const max = Math.round((maxHr - restingHr) * maxIntensity + restingHr);
    return `${min}-${max} 次/分`;
  }
});
