// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // 请务必全选以下字符串进行替换
        env: 'cloud1-3g1pe5f0c1664ca9', 
        traceUser: true,
      });
    }
  },
})