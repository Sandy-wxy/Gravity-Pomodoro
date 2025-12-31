// pages/index/index.ts
const dbIndex = wx.cloud.database();

Page({
  data: {
    motto: "正在建立引力链接...",
    status: "等待接入：请将手机屏幕朝下扣放",
    isFocusing: false,
    timeLeft: 1500,        // 25分钟
    displayTime: "25:00",
    timer: null as any,
    currentTask: "自由专注",
    liftCounter: 0 // 新增：防抖计数器
  },

  onLoad(options: any) {
    if (options.taskName) {
      this.setData({ currentTask: options.taskName });
    }
    this.getDailyMotto();
    this.initGravitySensor();
    
    // 保持屏幕常亮，防止锁屏中断
    wx.setKeepScreenOn({ keepScreenOn: true });
  },

  onUnload() {
    this.stopGravitySensor();
  },

  // --- 核心：重力感应逻辑 ---
  initGravitySensor() {
    wx.startAccelerometer({ interval: 'ui' }); // 使用 ui 频率，更平滑
    wx.onAccelerometerChange((res) => {
      const isFaceDown = res.z < -0.8; // Z轴小于 -0.8 视为扣下

      if (isFaceDown) {
        // 场景A：检测到扣下，且当前未开始 -> 启动
        if (!this.data.isFocusing) {
          this.startFocusSession();
        }
        // 重置防抖计数器
        this.data.liftCounter = 0;
      } else {
        // 场景B：检测到拿起（非扣下状态）
        if (this.data.isFocusing) {
          // 防抖动处理：连续检测到 5 次拿起才算真的拿起
          this.data.liftCounter++;
          if (this.data.liftCounter > 5) {
            this.triggerExplosion(); // 触发停止/失败逻辑
          }
        }
      }
    });
  },

  stopGravitySensor() {
    wx.stopAccelerometer();
  },

  // --- 专注开始 ---
  startFocusSession() {
    this.setData({ 
      isFocusing: true, 
      status: "🚀 引力场已激活",
      liftCounter: 0
    });
    
    // 视觉反馈：震动提示
    wx.vibrateShort({ type: 'medium' });
    // 节能模式：调低屏幕亮度
    wx.setScreenBrightness({ value: 0.1 });

    this.startTimer();
  },

  // --- 计时器 ---
  startTimer() {
    if (this.data.timer) clearInterval(this.data.timer);
    
    this.data.timer = setInterval(() => {
      if (this.data.timeLeft > 0) {
        const newTime = this.data.timeLeft - 1;
        this.setData({
          timeLeft: newTime,
          displayTime: this.formatTime(newTime)
        });
      } else {
        this.finishFocus(); 
      }
    }, 1000);
  },

  // --- 正常结束 ---
  finishFocus() {
    this.clearSession(true);
    this.uploadResult(true);
    this.setData({ status: "🎉 任务完成！" });
    wx.showToast({ title: '专注成功', icon: 'success' });
  },

  // --- 异常中断（拿起手机） ---
  triggerExplosion() {
    this.clearSession(false);
    this.uploadResult(false);
    
    // 失败反馈
    wx.vibrateLong({ success: () => {} });
    wx.showModal({
      title: '引力场破裂',
      content: '检测到手机被拿起，本次专注已记录为失败。',
      showCancel: false,
      confirmColor: '#ff4444'
    });
    
    this.setData({ 
      status: "💥 连接断开，请重新扣放",
      timeLeft: 1500, 
      displayTime: "25:00" 
    });
  },

  // --- 清理状态 ---
  clearSession(isSuccess: boolean) {
    if (this.data.timer) clearInterval(this.data.timer);
    this.setData({ isFocusing: false });
    // 恢复屏幕亮度
    wx.setScreenBrightness({ value: 0.8 });
  },

  // --- 辅助函数 ---
  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  },

  getDailyMotto() {
    wx.request({
      url: 'https://v1.hitokoto.cn/?c=i',
      success: (res: any) => this.setData({ motto: res.data.hitokoto }),
      fail: () => this.setData({ motto: "自律即自由。" })
    });
  },

  uploadResult(isSuccess: boolean) {
    // 只有超过1分钟才记录，避免误触刷数据
    const duration = 1500 - this.data.timeLeft;
    if (duration < 60 && !isSuccess) return; 

    dbIndex.collection('focus_logs').add({
      data: {
        taskName: this.data.currentTask,
        startTime: dbIndex.serverDate(),
        result: isSuccess ? "成功" : "中断",
        durationSec: duration,
      }
    });
  }
})