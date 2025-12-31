// pages/todo/todo.ts
// 使用 dbTodo 避免与其他页面的 db 变量冲突
const dbTodo = wx.cloud.database();

Page({
  data: {
    tasks: [] as any[],
    inputValue: '',
    isFlowMode: true
  },

  onLoad() {
    const savedTasks = wx.getStorageSync('tasks') || [];
    this.setData({ tasks: savedTasks });
  },

  onInput(e: any) {
    this.setData({ inputValue: e.detail.value });
  },

  onSwitchChange(e: any) {
    this.setData({ isFlowMode: e.detail.value });
  },

  addTask() {
    if (this.data.inputValue.trim() === '') return;
    
    // --- 核心修复：将云端同步逻辑放入函数内 ---
    dbTodo.collection('focus_logs').add({
      data: {
        taskName: this.data.inputValue,
        startTime: dbTodo.serverDate(),
        status: 'pending' 
      }
    }).then(res => {
      console.log('云端数据集同步成功:', res._id);
    });

    const newTask = {
      id: Date.now(),
      content: this.data.inputValue,
      isFlow: this.data.isFlowMode,
      completed: false,
      createTime: new Date().toLocaleDateString()
    };

    const newTasks = [newTask, ...this.data.tasks];
    this.setData({ tasks: newTasks, inputValue: '' });
    wx.setStorageSync('tasks', newTasks);
  },

  goToFocus(e: any) {
    const taskName = e.currentTarget.dataset.content;
    wx.navigateTo({
      url: `/pages/index/index?taskName=${taskName}`
    });
  },

  deleteTask(e: any) {
    const id = e.currentTarget.dataset.id;
    const newTasks = this.data.tasks.filter((t: any) => t.id !== id);
    this.setData({ tasks: newTasks });
    wx.setStorageSync('tasks', newTasks);
  },

  toggleTask(e: any) {
    const id = e.currentTarget.dataset.id;
    const newTasks = this.data.tasks.map((t: any) => {
      if (t.id === id) t.completed = !t.completed;
      return t;
    });
    this.setData({ tasks: newTasks });
    wx.setStorageSync('tasks', newTasks);
  }
})