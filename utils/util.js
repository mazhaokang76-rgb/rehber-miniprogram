// utils/util.js
/**
 * 格式化日期
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 格式化相对时间
 */
const formatRelativeTime = date => {
  const now = new Date()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(months / 12)

  if (years > 0) {
    return `${years}年前`
  } else if (months > 0) {
    return `${months}个月前`
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 防抖函数
 */
const debounce = (func, wait) => {
  let timeout
  return function (...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}

/**
 * 节流函数
 */
const throttle = (func, wait) => {
  let timeout
  let previous = 0
  return function (...args) {
    const context = this
    const now = Date.now()
    const remaining = wait - (now - previous)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(context, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(context, args)
      }, remaining)
    }
  }
}

/**
 * 深拷贝
 */
const deepClone = obj => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 获取系统信息
 */
const getSystemInfo = () => {
  try {
    const info = wx.getSystemInfoSync()
    return {
      platform: info.platform,
      system: info.system,
      brand: info.brand,
      model: info.model,
      screenWidth: info.screenWidth,
      screenHeight: info.screenHeight,
      windowWidth: info.windowWidth,
      windowHeight: info.windowHeight,
      statusBarHeight: info.statusBarHeight
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
    return {}
  }
}

/**
 * 检查网络状态
 */
const checkNetworkStatus = () => {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve({
          networkType: res.networkType,
          isOnline: res.networkType !== 'none'
        })
      },
      fail: () => {
        resolve({
          networkType: 'unknown',
          isOnline: false
        })
      }
    })
  })
}

/**
 * 显示加载提示
 */
const showLoading = (title = '加载中...', mask = true) => {
  wx.showLoading({
    title,
    mask
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 显示成功提示
 */
const showSuccess = (title, duration = 1500) => {
  wx.showToast({
    title,
    icon: 'success',
    duration
  })
}

/**
 * 显示错误提示
 */
const showError = (title, duration = 2000) => {
  wx.showToast({
    title,
    icon: 'none',
    duration
  })
}

/**
 * 振动反馈
 */
const vibrateShort = () => {
  wx.vibrateShort()
}

const vibrateLong = () => {
  wx.vibrateLong()
}

/**
 * 复制到剪贴板
 */
const setClipboardData = (data) => {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data,
      success: () => {
        resolve()
        showSuccess('复制成功')
      },
      fail: reject
    })
  })
}

/**
 * 保存图片到相册
 */
const saveImageToPhotosAlbum = (filePath) => {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        resolve()
        showSuccess('保存成功')
      },
      fail: reject
    })
  })
}

/**
 * 预览图片
 */
const previewImage = (current, urls) => {
  wx.previewImage({
    current,
    urls
  })
}

/**
 * 选择图片
 */
const chooseImage = (count = 1, sourceType = ['album', 'camera']) => {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count,
      sourceType,
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 获取当前位置
 */
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: resolve,
      fail: reject
    })
  })
}

/**
 * 打开地图选择位置
 */
const chooseLocation = () => {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      success: resolve,
      fail: reject
    })
  })
}

module.exports = {
  formatTime,
  formatRelativeTime,
  debounce,
  throttle,
  deepClone,
  getSystemInfo,
  checkNetworkStatus,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  vibrateShort,
  vibrateLong,
  setClipboardData,
  saveImageToPhotosAlbum,
  previewImage,
  chooseImage,
  getCurrentPosition,
  chooseLocation
}