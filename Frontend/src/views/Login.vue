<template>
    <div>
        <h2>Login</h2>
        <form @submit.prevent="login">
            <input v-model="form.email" type="email" placeholder="Email" />
            <input v-model="form.password" type="password" placeholder="Password" />
            <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <router-link to="/register">Register here</router-link></p>
    </div>
</template>

<script>
import jwt_decode from 'jwt-decode';

export default {
    data: () => ({
        form: { email: '', password: '' }
    }),
    methods: {
        async login() {
            try {
                const response = await this.$http.post('http://localhost:8081/api/v1/login', this.form);
                const token = response.data.token; // Define token here
                localStorage.setItem('token', token);
                console.log('Token set:', localStorage.getItem('token'));
                const decoded = jwt_decode(token); // Use the defined token
                // Redirect based on role
                if (decoded.role === 'admin') {
                    this.$router.push('/admin');
                } else {
                    this.$router.push('/courses');
                }
            } catch (error) {
                console.error('Login failed:', error);
                alert('Login failed!');
                // Optionally display an error message to the user
            }
        }
    }
};
</script>

<style scoped>
div {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
}
form {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
input {
    padding: 8px;
    font-size: 16px;
}
button {
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
}
button:hover {
    background-color: #0056b3;
}
p {
    margin-top: 15px;
    text-align: center;
}
a {
    color: #007bff;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
</style>