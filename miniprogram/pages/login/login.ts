// pages/login/login.ts
const dbLogin = wx.cloud.database();

Page({
  onLogin() {
    wx.showLoading({ title: '引力场激活中...' });
    
    // 跳过 getUserProfile 直接调用云函数
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: { type: 'getOpenId' },
      success: (res: any) => {
        const openid = res.result.openid;
        console.log("登录成功，OpenID:", openid);
        
        // 记录登录数据集
        dbLogin.collection('users').where({ _openid: openid }).get().then(userRes => {
          if (userRes.data.length === 0) {
            dbLogin.collection('users').add({
              data: { regDate: dbLogin.serverDate(), totalFocusTime: 0 }
            });
          }
          // 进入计划表
          wx.switchTab({ url: '/pages/todo/todo' });
        });
      },
      fail: (err) => {
        console.error("云函数调用失败", err);
        wx.showModal({ title: '通信失败', content: '请确认云函数已成功部署', showCancel: false });
      },
      complete: () => wx.hideLoading()
    });
  }
});