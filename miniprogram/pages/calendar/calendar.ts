// pages/calendar/calendar.ts
Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    selectedDay: new Date().getDate(),
    calendarDays: [] as any[], // 存放日历格子数据
    dailyStats: { // 选中日期的详细数据
      totalTasks: 0,
      flowCount: 0,
      totalDuration: 0,
      logs: [] as any[]
    }
  },

  onShow() {
    // 每次显示页面时，重新计算日历（为了同步最新的任务状态）
    this.generateCalendar(this.data.year, this.data.month);
    this.loadDayData(this.data.year, this.data.month, this.data.selectedDay);
  },

  // --- 核心：生成日历网格 ---
  generateCalendar(year: number, month: number) {
    const days = [];
    
    // 1. 获取当月第一天是星期几 (0-6, 0是周日)
    const firstDayWeek = new Date(year, month - 1, 1).getDay();
    // 2. 获取当月有多少天
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 3. 读取本地所有任务，用于标记日历上的“小红点”
    const allTasks = wx.getStorageSync('tasks') || [];

    // 填充空白格（上个月的余数）
    for (let i = 0; i < firstDayWeek; i++) {
      days.push({ day: 0, type: 'empty' });
    }

    // 填充当月日期
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      // 构造当前日期的匹配字符串 (需与 todo.ts 中的 createTime 格式一致)
      // 注意：这里简单模拟 todo.ts 的 toLocaleDateString，实际开发建议统一使用 YYYY/M/D 格式存储
      const dateStr = new Date(year, month - 1, i).toLocaleDateString();
      
      // 检查这一天有没有任务
      const hasTask = allTasks.some((t: any) => t.createTime === dateStr);
      const isToday = (year === today.getFullYear() && month === today.getMonth() + 1 && i === today.getDate());

      days.push({
        day: i,
        type: 'current',
        fullDate: dateStr, // 用于查询数据的 key
        hasData: hasTask,
        isToday: isToday
      });
    }

    this.setData({ calendarDays: days });
  },

  // --- 交互：切换月份 ---
  prevMonth() {
    let { year, month } = this.data;
    if (month === 1) {
      year--;
      month = 12;
    } else {
      month--;
    }
    this.updateDateAndRefresh(year, month);
  },

  nextMonth() {
    let { year, month } = this.data;
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
    this.updateDateAndRefresh(year, month);
  },

  updateDateAndRefresh(year: number, month: number) {
    this.setData({ year, month, selectedDay: 1 }); // 切月份默认选1号
    this.generateCalendar(year, month);
    this.loadDayData(year, month, 1);
  },

  // --- 交互：点击某一格 ---
  onDayClick(e: any) {
    const { day, type } = e.currentTarget.dataset;
    if (type === 'empty') return;

    this.setData({ selectedDay: day });
    this.loadDayData(this.data.year, this.data.month, day);
  },

  // --- 数据：加载选中日期的任务 ---
  loadDayData(year: number, month: number, day: number) {
    const allTasks = wx.getStorageSync('tasks') || [];
    // 构造匹配用的日期字符串
    const targetDateStr = new Date(year, month - 1, day).toLocaleDateString();

    // 筛选当天的任务
    const daysTasks = allTasks.filter((t: any) => t.createTime === targetDateStr);

    // 统计数据
    const stats = {
      totalTasks: daysTasks.length,
      flowCount: daysTasks.filter((t: any) => t.isFlow).length,
      totalDuration: daysTasks.length * 25, // 假设每个任务25分钟（示例）
      logs: daysTasks.map((t: any) => ({
        _id: t.id,
        taskName: t.content,
        timeStr: new Date(t.id).toTimeString().slice(0, 5), // 用ID时间戳转成 HH:mm
        result: t.completed ? '完成' : '进行中'
      }))
    };

    this.setData({ dailyStats: stats });
  }
})