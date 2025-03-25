<template>
    <div>
        <h2>Register</h2>
        <form @submit.prevent="register">
            <input v-model="form.name" placeholder="Name" />
            <input v-model="form.email" type="email" placeholder="Email" />
            <input v-model="form.password" type="password" placeholder="Password" />
            <button type="submit">Register</button>
            <p>Already have an account? <router-link to="/login">Login here</router-link></p>
            <button v-if="isLoggedIn" class="logout-btn" @click="logout">Logout</button>
        </form>
    </div>
</template>

<script>
export default {
    data: () => ({
        form: { name: '', email: '', password: '' }
    }),
    computed: {
        isLoggedIn() {
            return !!localStorage.getItem('token');
        }
    },
    methods: {
        async register() {
            const response = await this.$http.post('http://localhost:8081/api/v1/users', this.form);
            localStorage.setItem('token', response.data.token);
            this.$router.push('/courses');
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
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
}
.logout-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 8px 16px;
    background-color: #dc3545; /* Red for logout */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;
}
.logout-btn:hover {
    background-color: #c82333; /* Darker red on hover */
}
.content {
    text-align: center;
}
form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
input {
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
button[type="submit"] {
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
button[type="submit"]:hover {
    background-color: #0056b3;
}
p {
    margin-top: 15px;
}
a {
    color: #007bff;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
</style>