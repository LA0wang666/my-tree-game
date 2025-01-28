<template>
  <div class="app">
    <!-- 登录/注册区域 -->
    <div v-if="!currentUser" class="auth-container">
      <h2>欢迎来到新年种树</h2>
      <input v-model="username" placeholder="请输入用户名" @keyup.enter="login" />
      <button @click="login" class="auth-button">开始种树</button>
    </div>

    <div v-else class="main-container">
      <!-- 顶部信息 -->
      <div class="header">
        <h1>新年种树</h1>
        <div class="user-info">
          <span>{{ currentUser }}的树</span>
          <span class="day-info">第{{ day }}/7天</span>
          <button @click="logout" class="logout-btn">退出登录</button>
        </div>
        <div class="stats">
          <span>🌱 健康: {{ stats.health }}</span>
          <span>📚 学习: {{ stats.education }}</span>
          <span>✨ 心灵: {{ stats.spirit }}</span>
        </div>
      </div>

      <!-- 树的展示区域 -->
      <div class="tree-section">
        <div class="tree-container" :class="{'growing': isGrowing}">
          <div v-if="typeof currentTreeImage === 'string'" class="tree-emoji">
            {{ currentTreeImage }}
          </div>
          <img v-else :src="currentTreeImage" class="tree-image" alt="树" />
          <div v-if="isGrowing" class="growth-effects">
            <div class="sparkles"></div>
            <div class="progress-ring"></div>
          </div>
        </div>
        <div class="tree-stats">
          <div class="level-badge">Level {{ treeLevel }}</div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div class="next-level">距离下一级还需 {{ pointsToNextLevel }} 点</div>
        </div>
      </div>
      <!-- 活动类别选择 -->
      <div class="category-tabs">
        <button 
          v-for="category in categories" 
          :key="category.id"
          @click="currentCategory = category.id"
          :class="['tab-button', { active: currentCategory === category.id }]"
        >
          {{ category.icon }} {{ category.name }}
        </button>
      </div>

      <!-- 活动列表 -->
      <div class="activities-list">
        <div 
          v-for="activity in currentActivities" 
          :key="activity.id"
          class="activity-card"
          @click="startActivity(activity)"
          :class="{ 'completed': completedActivities.has(activity.id) }"
        >
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-content">
            <h3>{{ activity.name }}</h3>
            <p>{{ activity.description }}</p>
            <div class="activity-points">
              <span v-for="(value, type) in activity.points" :key="type">
                {{ getPointIcon(type) }} +{{ value }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 活动确认对话框 -->
      <div v-if="confirmationDialog" class="confirmation-dialog">
        <div class="dialog-content">
          <h3>确认完成活动</h3>
          <p>{{ selectedActivity?.name }}</p>
          <div class="dialog-buttons">
            <button @click="confirmActivity" class="confirm-btn">确认</button>
            <button @click="confirmationDialog = false" class="cancel-btn">取消</button>
          </div>
        </div>
      </div>

      <!-- 活动记录 -->
      <div class="activity-history">
        <h2>今日记录</h2>
        <div class="history-list">
          <div v-for="(record, index) in todayRecords" :key="index" class="history-item">
            <span>{{ formatTime(record.time) }}</span>
            <span>{{ record.activity.name }}</span>
            <span class="points-gained">+{{ getTotalPoints(record.activity.points) }}</span>
          </div>
        </div>
      </div>

      <!-- 每日鼓励 -->
      <div v-if="currentQuote" class="motivation-card">
        <p>{{ currentQuote }}</p>
      </div>

      <!-- 能力值统计图表 (移到最底部) -->
      <div class="stats-dashboard">
        <h2>能力值统计</h2>
        <div class="chart-container">
          <canvas ref="statsChart"></canvas>
        </div>
        <div class="daily-summary">
          <div class="summary-item">
            <span class="label">连续打卡</span>
            <span class="value">{{ streakDays }}天</span>
          </div>
          <div class="summary-item">
            <span class="label">今日完成</span>
            <span class="value">{{ todayRecords.length }}/{{ dailyGoal }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Chart } from 'chart.js/auto'
import { useToast } from 'vue-toastification'

export default {
  setup() {
    const toast = useToast()
    return { toast }
  },
  data() {
    return {
      username: '',
      currentUser: null,
      day: 1,
      treeLevel: 1,
      isGrowing: false,
      currentCategory: 'health',
      stats: {
        health: 0,
        education: 0,
        spirit: 0
      },
      categories: [
        { id: 'health', name: '健康', icon: '🌱' },
        { id: 'education', name: '学习', icon: '📚' },
        { id: 'spirit', name: '心灵', icon: '✨' }
      ],
      activities: {
        health: [
          {
            id: 'h1',
            name: '晨跑',
            icon: '🏃',
            description: '清晨进行20分钟慢跑',
            points: { health: 15 }
          },
          {
            id: 'h2',
            name: '健康饮食',
            icon: '🥗',
            description: '一天吃三顿健康均衡的饮食',
            points: { health: 10 }
          },
          {
            id: 'h3',
            name: '充足睡眠',
            icon: '😴',
            description: '保证7-8小时的优质睡眠',
            points: { health: 12 }
          }
        ],
        education: [
          {
            id: 'e1',
            name: '读书学习',
            icon: '📖',
            description: '阅读一小时专业书籍或在线课程',
            points: { education: 15 }
          },
          {
            id: 'e2',
            name: '写作练习',
            icon: '✍️',
            description: '写一篇学习笔记或日记',
            points: { education: 10 }
          },
          {
            id: 'e3',
            name: '技能培养',
            icon: '💡',
            description: '学习一项新技能',
            points: { education: 12 }
          }
        ],
        spirit: [
          {
            id: 's1',
            name: '冥想',
            icon: '🧘',
            description: '进行15分钟正念冥想',
            points: { spirit: 15 }
          },
          {
            id: 's2',
            name: '善行',
            icon: '🤝',
            description: '帮助他人或做一件善事',
            points: { spirit: 12 }
          },
          {
            id: 's3',
            name: '感恩记录',
            icon: '🙏',
            description: '记录三件感恩的事',
            points: { spirit: 10 }
          }
        ]
      },
      todayRecords: [],
      treeImages: {
        1: '🌱',
        2: '🌿',
        3: '🌳',
        4: '🌲',
        5: '🎄'
      },
      streakDays: 0,
      dailyGoal: 5,
      lastLoginDate: null,
      statsChart: null,
      motivationalQuotes: [
        "今天的努力是明天的收获！",
        "坚持就是胜利！",
        "每一个选择都在塑造更好的自己！",
        "小树在见证你的成长！",
        "新的一天，新的开始！"
      ],
      currentQuote: "",
      completedActivities: new Set(),
      selectedActivity: null,
      confirmationDialog: false
    }
  },
    computed: {
    currentActivities() {
      return this.activities[this.currentCategory] || []
    },
    currentTreeImage() {
      return this.treeImages[this.treeLevel]
    },
    progressPercentage() {
      const totalPoints = Object.values(this.stats).reduce((a, b) => a + b, 0)
      const progress = ((totalPoints % 50) / 50) * 100
      return Math.min(100, progress)
    },
    pointsToNextLevel() {
      const totalPoints = Object.values(this.stats).reduce((a, b) => a + b, 0)
      const nextLevelPoints = this.treeLevel * 50
      return Math.max(0, nextLevelPoints - totalPoints)
    }
  },

  methods: {
      login() {
        if (this.username.trim()) {
          // 先清除当前用户的数据
          this.clearUserData()
          
          // 设置新用户
          this.currentUser = this.username
          localStorage.setItem('current-user', this.username)
          
          // 加载新用户的数据
          this.loadUserData()
          this.checkDailyReset()
          this.$nextTick(() => {
            this.updateStatsChart()
          })
          this.updateMotivationalQuote()
        } else {
          this.$toast.error('请输入用户名')
        }
      },
  
      logout() {
        this.currentUser = null
        localStorage.removeItem('current-user')
        this.clearUserData()
      },
  
      clearUserData() {
        // 重置所有数据到初始状态
        this.stats = {
          health: 0,
          education: 0,
          spirit: 0
        }
        this.day = 1
        this.treeLevel = 1
        this.todayRecords = []
        this.streakDays = 0
        this.lastLoginDate = null
        this.completedActivities = new Set()
        this.currentQuote = ""
        
        // 清除图表
        if (this.statsChart) {
          this.statsChart.destroy()
          this.statsChart = null
        }
      },
  
      loadUserData() {
        const savedData = localStorage.getItem(`tree-data-${this.currentUser}`)
        if (savedData) {
          const data = JSON.parse(savedData)
          this.stats = data.stats || { health: 0, education: 0, spirit: 0 }
          this.day = data.day || 1
          this.treeLevel = data.treeLevel || 1
          this.todayRecords = data.todayRecords || []
          this.streakDays = data.streakDays || 0
          this.lastLoginDate = data.lastLoginDate
          this.completedActivities = new Set(data.completedActivities || [])
        } else {
          // 如果是新用户，使用初始数据
          this.clearUserData()
        }
      },
  
      saveUserData() {
        const data = {
          stats: this.stats,
          day: this.day,
          treeLevel: this.treeLevel,
          todayRecords: this.todayRecords,
          streakDays: this.streakDays,
          lastLoginDate: this.lastLoginDate,
          completedActivities: Array.from(this.completedActivities)
        }
        localStorage.setItem(`tree-data-${this.currentUser}`, JSON.stringify(data))
      },
  
    startActivity(activity) {
      if (this.completedActivities.has(activity.id)) {
        this.$toast.warning('今天已经完成过这个活动啦！')
        return
      }
      this.selectedActivity = activity
      this.confirmationDialog = true
    },
        async confirmActivity() {
      const activity = this.selectedActivity
      this.confirmationDialog = false
      this.selectedActivity = null
      
      this.isGrowing = true
      this.completedActivities.add(activity.id)
      
      Object.entries(activity.points).forEach(([type, value]) => {
        this.stats[type] += value
      })

      this.todayRecords.unshift({
        time: new Date(),
        activity: activity
      })

      await this.playGrowthAnimation()
      this.$nextTick(() => {
        this.updateStatsChart()
      })
      this.checkLevelUp()
      this.saveUserData()
      this.updateMotivationalQuote()
    },

    async playGrowthAnimation() {
      return new Promise(resolve => {
        setTimeout(() => {
          this.isGrowing = false
          resolve()
        }, 2000)
      })
    },

    updateStatsChart() {
      this.$nextTick(() => {
        try {
          const chartElement = this.$refs.statsChart
          if (!chartElement) {
            console.warn('Chart element not found')
            return
          }

          if (this.statsChart) {
            this.statsChart.destroy()
          }

          const ctx = chartElement.getContext('2d')
          this.statsChart = new Chart(ctx, {
            type: 'radar',
            data: {
              labels: ['健康', '学习', '心灵'],
              datasets: [{
                label: '能力值',
                data: [this.stats.health, this.stats.education, this.stats.spirit],
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                borderColor: '#4CAF50',
                borderWidth: 2,
                pointBackgroundColor: '#4CAF50',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#4CAF50'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  titleFont: {
                    size: 14
                  },
                  bodyFont: {
                    size: 14
                  }
                }
              },
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    stepSize: 20,
                    font: {
                      size: 12
                    }
                  },
                  pointLabels: {
                    font: {
                      size: 14,
                      weight: 'bold'
                    }
                  },
                  grid: {
                    color: 'rgba(0,0,0,0.1)'
                  },
                  angleLines: {
                    color: 'rgba(0,0,0,0.1)'
                  }
                }
              }
            }
          })
        } catch (error) {
          console.error('Failed to create chart:', error)
        }
      })
    },

    checkLevelUp() {
      const totalPoints = Object.values(this.stats).reduce((a, b) => a + b, 0)
      this.treeLevel = Math.min(5, Math.floor(totalPoints / 50) + 1)
    },

    formatTime(time) {
      return new Date(time).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getTotalPoints(points) {
      return Object.values(points).reduce((a, b) => a + b, 0)
    },

    getPointIcon(type) {
      const icons = {
        health: '🌱',
        education: '📚',
        spirit: '✨'
      }
      return icons[type]
    },

    updateMotivationalQuote() {
      const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length)
      this.currentQuote = this.motivationalQuotes[randomIndex]
    },

    checkDailyReset() {
      const today = new Date().toDateString()
      if (this.lastLoginDate !== today) {
        this.completedActivities.clear()
        this.todayRecords = []
        this.lastLoginDate = today
        
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        if (this.lastLoginDate === yesterday.toDateString()) {
          this.streakDays++
        } else {
          this.streakDays = 1
        }
        this.saveUserData()
      }
    }
  },

  mounted() {
    const savedUser = localStorage.getItem('current-user')
    if (savedUser) {
      this.currentUser = savedUser
      this.loadUserData()
      this.checkDailyReset()
      this.$nextTick(() => {
        this.updateStatsChart()
      })
      this.updateMotivationalQuote()
    }
  },

  beforeUnmount() {
    if (this.statsChart) {
      this.statsChart.destroy()
    }
  }
}
</script>
<style>
.app {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  min-height: 100vh;
  background: #f5f5f5;
  font-family: Arial, sans-serif;
}

.auth-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 20vh;
}

.auth-container h2 {
  color: #4CAF50;
  margin-bottom: 20px;
}

.auth-button {
  background: #4CAF50;
  color: white;
  padding: 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.auth-button:hover {
  background: #45a049;
}

.main-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header h1 {
  /* 保持原有样式不变 */
  color: #4CAF50;
  margin-bottom: 10px;
}

.header h2 {
  color: #ff0000;  /* 红色 */
  font-size: 14px; /* 较小的字体 */
  margin: 5px 0;   /* 适当的间距 */
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.logout-btn {
  background: #ff5252;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

.tree-section {
  position: relative;
  height: 300px;
  margin: 20px 0;
  background: linear-gradient(180deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.tree-container {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tree-emoji {
  font-size: 80px;
  transition: transform 0.3s ease;
}

.tree-image {
  height: 80%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.growth-effects {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.sparkles {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, transparent 50%, rgba(255,215,0,0.2) 100%);
  animation: sparkle 2s infinite;
}

.progress-ring {
  position: absolute;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  border: 2px solid rgba(75, 192, 192, 0.5);
  border-radius: 50%;
  animation: expand 2s ease-out;
}

.tree-stats {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  text-align: center;
}

.level-badge {
  background: #4CAF50;
  color: white;
  padding: 5px 15px;
  border-radius: 15px;
  display: inline-block;
  margin-bottom: 10px;
  font-weight: bold;
}

.progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 5px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
}

.stats-dashboard {
  background: white;
  padding: 20px;
  border-radius: 15px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  margin: 0 auto;
}

.daily-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.category-tabs {
  display: flex;
  gap: 10px;
  margin: 15px 0;
}

.tab-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 20px;
  background: #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.tab-button.active {
  background: #4CAF50;
  color: white;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.activity-card.completed {
  opacity: 0.6;
  background: #f5f5f5;
}
.activity-card:hover {
  transform: translateY(-2px);
}

.activity-icon {
  font-size: 24px;
  margin-right: 15px;
}

.activity-content {
  text-align: left;
  flex: 1;
}

.activity-content h3 {
  margin: 0 0 5px 0;
}

.activity-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.activity-points {
  display: flex;
  gap: 10px;
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.confirmation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 300px;
}

.dialog-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.confirm-btn, .cancel-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.confirm-btn {
  background: #4CAF50;
  color: white;
}

.cancel-btn {
  background: #f0f0f0;
}

.activity-history {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.points-gained {
  color: #4CAF50;
  font-weight: bold;
}

.motivation-card {
  background: linear-gradient(135deg, #fff6e5, #ffefd5);
  padding: 20px;
  border-radius: 15px;
  margin-top: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
}

@keyframes sparkle {
  0% { transform: scale(1); opacity: 0; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(1); opacity: 0; }
}

@keyframes expand {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.2); opacity: 0; }
}

.growing {
  transform: scale(1.1);
}

@media (max-width: 480px) {
  .app {
    padding: 10px;
  }
  
  .tree-section {
    height: 250px;
  }
  
  .activity-card {
    padding: 12px;
  }
  
  .activity-icon {
    font-size: 20px;
  }
}
</style>
