<template>
    <div class="container">
      <button v-if="isLoggedIn" class="logout-btn" @click="logout">Logout</button>
      <div class="content">
        <h2>Your Registered Courses</h2>
        <div v-if="loading">Loading...</div>
        <div v-else-if="registeredCourses.length === 0">You haven’t registered for any courses yet.</div>
        <ul v-else>
          <li v-for="course in registeredCourses" :key="course._id" class="course-item">
            <span>{{ course.title }} - Progress: {{ course.progress.percentage }}%</span>
            <div class="course-actions">
              <button @click="viewCourse(course)" class="view-btn">View Content</button>
              <i class="fas fa-times action-icon" @click="dropCourse(course._id)" title="Drop Course"></i>
            </div>
          </li>
        </ul>
  
        <h3>Register for a New Course</h3>
        <select v-model="selectedCourseId" @change="registerForCourse">
          <option value="">Select a course</option>
          <option v-for="course in availableCourses" :key="course._id" :value="course._id">
            {{ course.title }}
          </option>
        </select>
  
        <div v-if="selectedCourse">
          <h3>Course Content</h3>
          <ul class="content-list">
            <li v-for="content in selectedCourse.contents" :key="content._id" @click="openContent(content)">
              <span :class="['status-icon', { completed: progress.completedContents.includes(content._id) }]"></span>
              {{ content.title }} ({{ formatSize(content.size) }})
            </li>
          </ul>
          <div v-if="activeContent">
            <h4>{{ activeContent.title }}</h4>
            <video v-if="activeContent.type === 'video'" controls @ended="markCompleted(activeContent._id)" ref="videoPlayer">
              <source :src="activeContentUrl" type="video/mp4">
              Your browser does not support the video tag.
            </video>
            <div v-else-if="activeContent.type === 'pdf'" class="pdf-container">
              <object :data="activeContentUrl" type="application/pdf" width="100%" height="500"></object>
              <button v-if="!progress.completedContents.includes(activeContent._id)" @click="markCompleted(activeContent._id)" class="complete-btn">Mark as Complete</button>
            </div>
            <div v-else-if="activeContent.type === 'image'" class="image-container">
              <img :src="activeContentUrl" @error="handleImageError" />
              <button v-if="!progress.completedContents.includes(activeContent._id)" @click="markCompleted(activeContent._id)" class="complete-btn">Mark as Complete</button>
            </div>
            <div v-else-if="activeContent.type === 'text'" class="text-container">
              <pre v-text="activeTextContent"></pre>
              <button v-if="!progress.completedContents.includes(activeContent._id)" @click="markCompleted(activeContent._id)" class="complete-btn">Mark as Complete</button>
              <p v-if="!activeTextContent">Loading text content...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import jwt_decode from 'jwt-decode';
  
  export default {
    data: () => ({
      registeredCourses: [],
      availableCourses: [],
      selectedCourseId: '',
      selectedCourse: null,
      progress: { completedContents: [] },
      loading: true,
      activeContent: null,
      activeContentUrl: null,
      activeTextContent: ''
    }),
    computed: {
      isLoggedIn() {
        return !!localStorage.getItem('token');
      }
    },
    async created() {
      await this.fetchCourses();
    },
    methods: {
      async fetchCourses() {
        this.loading = true;
        const token = localStorage.getItem('token');
        const userId = jwt_decode(token).id;
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          const coursesResponse = await this.$http.get('http://localhost:8081/api/v1/courses', { headers });
          const progressResponse = await this.$http.get(`http://localhost:8081/api/v1/progress/user/${userId}`, { headers });
          const userProgress = progressResponse.data;
  
          this.registeredCourses = coursesResponse.data.data
            .filter(course => userProgress.registeredCourses.includes(course._id.toString()))
            .map(course => {
              const courseProgress = userProgress.courses.find(c => c.courseId.toString() === course._id.toString()) || { completedContents: [] };
              const completed = courseProgress.completedContents.length;
              const totalContent = course.contents.length;
              return {
                ...course,
                progress: {
                  completedContents: courseProgress.completedContents,
                  percentage: totalContent > 0 ? Math.round((completed / totalContent) * 100) : 0
                }
              };
            });
  
          const registeredIds = this.registeredCourses.map(c => c._id.toString());
          this.availableCourses = coursesResponse.data.data.filter(course => !registeredIds.includes(course._id.toString()));
        } catch (error) {
          console.error('Error fetching courses:', error);
        } finally {
          this.loading = false;
        }
      },
      async registerForCourse() {
        if (!this.selectedCourseId) return;
        const token = localStorage.getItem('token');
        const userId = jwt_decode(token).id;
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          await this.$http.post(`http://localhost:8081/api/v1/progress/register`, {
            userId,
            courseId: this.selectedCourseId
          }, { headers });
          await this.fetchCourses();
          this.selectedCourseId = '';
        } catch (error) {
          console.error('Error registering for course:', error);
        }
      },
      async dropCourse(courseId) {
        if (!confirm('Are you sure you want to drop this course?')) return;
        const token = localStorage.getItem('token');
        const userId = jwt_decode(token).id;
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          await this.$http.delete(`http://localhost:8081/api/v1/progress`, {
            data: { userId, courseId },
            headers
          });
          await this.fetchCourses();
          if (this.selectedCourse && this.selectedCourse._id === courseId) {
            this.selectedCourse = null;
            this.activeContent = null;
            this.activeContentUrl = null;
            this.activeTextContent = '';
          }
        } catch (error) {
          console.error('Error dropping course:', error.response?.data || error.message);
        }
      },
      viewCourse(course) {
        this.selectedCourse = course;
        this.progress = course.progress;
        this.activeContent = null;
        this.activeContentUrl = null;
        this.activeTextContent = '';
      },
      async openContent(content) {
        this.activeContent = content;
        this.activeContentUrl = null;
        this.activeTextContent = '';
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          if (content.type === 'video') {
            this.activeContentUrl = `http://localhost:8081/api/v1/content/stream/${content._id}`;
          } else if (content.type === 'image') {
            this.activeContentUrl = `http://localhost:8081/api/v1/content/file/${content._id}`;
          } else if (content.type === 'pdf') {
            this.activeContentUrl = `http://localhost:8081/api/v1/content/file/${content._id}`;
          } else if (content.type === 'text') {
            const response = await this.$http.get(`http://localhost:8081/api/v1/content/file/${content._id}`, { headers, responseType: 'text' });
            this.activeTextContent = response.data;
          }
        } catch (error) {
          console.error(`Error loading ${content.type} content:`, error.response?.data || error.message);
          this.activeContent = null;
          this.activeContentUrl = null;
          this.activeTextContent = '';
        }
      },
      async markCompleted(contentId) {
        const token = localStorage.getItem('token');
        const userId = jwt_decode(token).id;
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          const response = await this.$http.post('http://localhost:8081/api/v1/progress', {
            userId,
            courseId: this.selectedCourse._id,
            contentId
          }, { headers });
          console.log('Mark completed response:', response.data);
          if (!this.progress.completedContents.includes(contentId)) {
            this.progress.completedContents.push(contentId);
            await this.fetchCourses();
          }
        } catch (error) {
          console.error('Error marking content completed:', error.response?.data || error.message);
        }
      },
      formatSize(bytes) {
        if (!bytes) return 'Unknown size';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
      },
      handleImageError() {
        console.error('Image failed to load:', this.activeContent._id);
        this.activeContent = null;
        this.activeContentUrl = null;
        this.activeTextContent = '';
      },
      logout() {
        localStorage.removeItem('token');
        this.$router.push('/login');
      }
    }
  };
  </script>
  
  <style scoped>
  .course-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
    background-color: #fff;
    transition: background-color 0.2s;
  }
  .course-item:hover {
    background-color: #f5f5f5;
  }
  .course-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .view-btn {
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .view-btn:hover {
    background-color: #0056b3;
  }
  .action-icon {
    font-size: 18px;
    cursor: pointer;
    transition: color 0.3s ease;
  }
  .action-icon.fa-times:hover {
    color: #dc3545;
  }
  .pdf-container, .image-container, .text-container {
    width: 100%;
    margin-top: 10px;
  }
  .image-container img {
    max-width: 100%;
  }
  .text-container pre {
    white-space: pre-wrap;
    background: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
  }
  .complete-btn {
    margin-top: 10px;
    padding: 5px 10px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .complete-btn:hover {
    background-color: #218838;
  }
  .container {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .logout-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 8px 16px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;
  }
  .logout-btn:hover {
    background-color: #c82333;
  }
  .content {
    text-align: center;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    margin: 10px 0;
  }
  .content-list li {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  .content-list li:hover {
    background-color: #f5f5f5;
  }
  .status-icon {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ccc;
    margin-right: 10px;
  }
  .status-icon.completed {
    background-color: #28a745;
  }
  select {
    padding: 8px;
    font-size: 16px;
    margin-top: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  h3, h4 {
    margin-top: 20px;
  }
  video {
    margin-top: 10px;
    max-width: 100%;
  }
  </style>