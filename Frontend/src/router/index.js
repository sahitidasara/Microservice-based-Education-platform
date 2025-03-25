import Vue from 'vue';
import VueRouter from 'vue-router';
import Register from '../views/Register.vue';
import Login from '../views/Login.vue';
import Courses from '../views/Courses.vue';
//import CourseRegister from '../views/CourseRegister.vue';
import Admin from '../views/Admin.vue';
import jwt_decode from 'jwt-decode';

Vue.use(VueRouter);

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/register', component: Register },
    { path: '/login', component: Login },
    { path: '/courses', component: Courses },
    {path:'/admin', component: Admin}
    //,
    //{path : '/courses/register', component: CourseRegister}
];

const router = new VueRouter({
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    
    // If no token and not going to login/register, redirect to login
    if (!token && to.path !== '/login' && to.path !== '/register') {
        return next('/login');
    }

    // If token exists, check role for admin route
    if (token && to.path === '/admin') {
        const decoded = jwt_decode(token);
        if (decoded.role !== 'admin') {
            return next('/courses'); // Non-admins can't access /admin
        }
    }

    next(); // Proceed to the requested route
});

export default router;