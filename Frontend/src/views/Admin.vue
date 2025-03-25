<template>
    <div class="container">
      <button v-if="isLoggedIn" class="logout-btn" @click="logout">
        <i class="fas fa-sign-out-alt"></i> Logout
      </button>
  
      <!-- Add New Course Section -->
      <section class="course-section">
        <h3>Add New Course</h3>
        <form @submit.prevent="addCourse" class="course-form">
          <input v-model="courseForm.title" placeholder="Course Title" required />
          <input v-model="courseForm.description" placeholder="Course Description" required />
          <input v-model="courseForm.instructor" placeholder="Course Instructor" required />
          <button type="submit" :disabled="loading" class="action-btn">
            <i class="fas fa-plus"></i> Add Course
          </button>
          <p v-if="courseError" class="error">{{ courseError }}</p>
          <p v-if="courseSuccess" class="success">{{ courseSuccess }}</p>
        </form>
      </section>
  
      <!-- Course List Section -->
      <section class="course-list-section">
        <h3>Your Courses</h3>
        <div v-if="loading">Loading courses...</div>
        <div v-else-if="courses.length === 0">No courses available.</div>
        <ul v-else class="course-list">
          <li v-for="course in courses" :key="course._id" class="course-item">
            <span>{{ course.title }} - {{ course.instructor }}</span>
            <div class="course-actions">
              <i class="fas fa-edit action-icon" @click="editCourseContent(course)" title="Edit Content"></i>
              <i class="fas fa-trash action-icon" @click="deleteCourse(course._id)" title="Delete Course"></i>
            </div>
          </li>
        </ul>
      </section>
  
      <!-- Edit Course Content Modal -->
      <div v-if="selectedCourse" class="modal">
        <div class="modal-content">
          <h4>Manage Content for {{ selectedCourse.title }}</h4>
          <button class="close-btn" @click="selectedCourse = null">Close</button>
  
          <!-- Upload New Content -->
          <form @submit.prevent="uploadContent" class="content-form">
            <label for="title">Title:</label>
            <input v-model="form.title" id="title" type="text" placeholder="Content Title" required />
  
            <label for="type">Type:</label>
            <select v-model="form.type" id="type" @change="updateFileAccept" required>
              <option value="video">Video (.mp4)</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="image">Image (.jpg, .jpeg, .png)</option>
              <option value="text">Text (.txt, .doc, .docx)</option>
            </select>
  
            <label for="file">File:</label>
            <input type="file" id="file" ref="fileInput" :accept="fileAccept" @change="onFileChange" required />
            <button type="submit" :disabled="loading" class="action-btn">
              <i class="fas fa-upload"></i> Upload Content
            </button>
          </form>
          <p v-if="error" class="error">{{ error }}</p>
  
          <!-- Existing Content List -->
          <h5>Existing Content</h5>
          <div v-if="contentLoading">Loading content...</div>
          <ul v-else-if="courseContent.length > 0" class="content-list">
            <li v-for="content in courseContent" :key="content._id" class="content-item">
              {{ content.title }} ({{ content.type }})
              <i class="fas fa-trash action-icon" @click="deleteContent(content._id)" title="Delete Content"></i>
            </li>
          </ul>
          <div v-else>No content available for this course.</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import jwt_decode from 'jwt-decode';
  
  export default {
    data: () => ({
      courses: [],
      courseForm: {
        title: '',
        description: '',
        instructor: ''
      },
      form: {
        courseId: '',
        title: '',
        type: '',
        file: null
      },
      selectedCourse: null,
      courseContent: [],
      error: null,
      courseError: null,
      courseSuccess: null,
      loading: false,
      contentLoading: false,
      fileAccept: ''
    }),
    computed: {
      isLoggedIn() {
        return !!localStorage.getItem('token');
      }
    },
    async created() {
      await this.fetchCourses();
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login');
        return;
      }
      const decoded = jwt_decode(token);
      if (decoded.role !== 'admin') {
        this.$router.push('/login');
      }
    },
    methods: {
      async fetchCourses() {
        this.loading = true;
        try {
          const token = localStorage.getItem('token');
          const headers = { Authorization: `Bearer ${token}` };
          const response = await this.$http.get('http://localhost:8081/api/v1/courses', { headers });
          this.courses = response.data.data;
        } catch (error) {
          console.error('Error fetching courses:', error);
          this.error = 'Failed to load courses';
        } finally {
          this.loading = false;
        }
      },
      async addCourse() {
        this.loading = true;
        this.courseError = null;
        this.courseSuccess = null;
  
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          const response = await this.$http.post('http://localhost:8081/api/v1/courses', this.courseForm, { headers });
          console.log('Course added:', response.data);
          this.courseSuccess = 'Course added successfully!';
          this.courseForm = { title: '', description: '', instructor: '' };
          await this.fetchCourses();
        } catch (error) {
          console.error('Error adding course:', error);
          this.courseError = error.response?.data?.error || 'Failed to add course';
        } finally {
          this.loading = false;
        }
      },
      async deleteCourse(courseId) {
        if (!confirm('Are you sure you want to delete this course?')) return;
        this.loading = true;
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          await this.$http.delete(`http://localhost:8081/api/v1/courses/${courseId}`, { headers });
          this.courseSuccess = 'Course deleted successfully!';
          await this.fetchCourses();
        } catch (error) {
          console.error('Error deleting course:', error);
          this.courseError = error.response?.data?.error || 'Failed to delete course';
        } finally {
          this.loading = false;
        }
      },
      async editCourseContent(course) {
        this.selectedCourse = course;
        this.form.courseId = course._id;
        this.error = null;
        await this.fetchCourseContent(course._id);
      },
      async fetchCourseContent(courseId) {
        this.contentLoading = true;
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          const response = await this.$http.get(`http://localhost:8081/api/v1/content/course/${courseId}`, { headers });
          this.courseContent = response.data;
        } catch (error) {
          console.error('Error fetching course content:', error);
          this.error = 'Failed to load course content';
        } finally {
          this.contentLoading = false;
        }
      },
      onFileChange(event) {
        this.form.file = event.target.files[0];
        this.error = null;
      },
      updateFileAccept() {
        switch (this.form.type) {
          case 'video':
            this.fileAccept = '.mp4';
            break;
          case 'pdf':
            this.fileAccept = '.pdf';
            break;
          case 'image':
            this.fileAccept = '.jpg,.jpeg,.png';
            break;
          case 'text':
            this.fileAccept = '.txt,.doc,.docx';
            break;
          default:
            this.fileAccept = '';
        }
      },
      async uploadContent() {
        if (!this.form.file) {
          this.error = 'Please select a file';
          return;
        }
  
        this.loading = true;
        this.error = null;
  
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const formData = new FormData();
        formData.append('courseId', this.form.courseId);
        formData.append('title', this.form.title);
        formData.append('file', this.form.file);
  
        try {
          await this.$http.post('http://localhost:8081/api/v1/content', formData, { headers });
          this.form = { courseId: this.form.courseId, title: '', type: '', file: null };
          this.$refs.fileInput.value = '';
          alert('Content uploaded successfully!');
          await this.fetchCourseContent(this.selectedCourse._id);
        } catch (error) {
          this.error = error.response?.data?.error || 'Upload failed. Check file type and size (max 100MB).';
          console.error('Error uploading content:', error);
        } finally {
          this.loading = false;
        }
      },
      async deleteContent(contentId) {
        if (!confirm('Are you sure you want to delete this content?')) return;
        this.loading = true;
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
  
        try {
          await this.$http.delete(`http://localhost:8081/api/v1/content/${contentId}`, { headers });
          alert('Content deleted successfully!');
          await this.fetchCourseContent(this.selectedCourse._id);
        } catch (error) {
          console.error('Error deleting content:', error);
          this.error = error.response?.data?.error || 'Failed to delete content';
        } finally {
          this.loading = false;
        }
      },
      logout() {
        localStorage.removeItem('token');
        this.$router.push('/login');
      }
    }
  };
  </script>
  
  <style scoped>
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
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .logout-btn:hover {
    background-color: #c82333;
  }
  .course-section, .course-list-section {
    margin-bottom: 30px;
  }
  .course-form, .content-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  label {
    font-weight: bold;
  }
  input, select {
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .action-btn {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  .action-btn:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }
  .action-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
  .error {
    color: #dc3545;
    margin-top: 10px;
  }
  .success {
    color: #28a745;
    margin-top: 10px;
  }
  
  /* Course List Styles */
  .course-list {
    list-style: none;
    padding: 0;
  }
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
    gap: 10px;
  }
  .action-icon {
    font-size: 18px;
    cursor: pointer;
    transition: color 0.3s ease;
  }
  .action-icon.fa-edit:hover {
    color: #007bff;
  }
  .action-icon.fa-trash:hover {
    color: #dc3545;
  }
  
  /* Modal Styles */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
  }
  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 5px 10px;
    background-color: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .close-btn:hover {
    background-color: #c82333;
  }
  .content-list {
    list-style: none;
    padding: 0;
  }
  .content-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #eee;
  }
  </style>