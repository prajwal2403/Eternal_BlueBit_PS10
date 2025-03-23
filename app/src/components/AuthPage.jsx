import React, { useState, useEffect } from 'react';
import Helmet from "./Helmet/Helmet";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [errors, setErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const navigate = useNavigate();

    // Animated background gradient effect
    const [gradientPosition, setGradientPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            setGradientPosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        // Additional signup validations
        if (!isLogin) {
            if (!formData.name) {
                newErrors.name = 'Name is required';
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Please confirm your password';
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setIsLoading(true);

            try {
                if (isLogin) {
                    // Login request
                    const response = await axios.post('http://localhost:8000/login/', {
                        email: formData.email,
                        password: formData.password
                    });

                    // Store user info in localStorage
                    localStorage.setItem('token', response.data.access_token);
                    localStorage.setItem('user', JSON.stringify({
                        id: response.data.user.id,
                        name: response.data.user.name,
                        email: response.data.user.email
                    }));

                    setShowSuccess(true);
                    onLogin();

                    // Redirect to dashboard after successful login
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);
                } else {
                    // Signup request
                    await axios.post('http://localhost:8000/signup/', {
                        email: formData.email,
                        password: formData.password,
                        name: formData.name
                    });

                    setShowSuccess(true);
                    setTimeout(() => {
                        setShowSuccess(false);
                        setFormData({
                            email: '',
                            password: '',
                            confirmPassword: '',
                            name: ''
                        });
                        setIsLogin(true); // Switch to login mode after successful signup
                    }, 2000);
                }
            } catch (error) {
                console.error('Error:', error);
                setErrors(prev => ({
                    ...prev,
                    email: 'Invalid email or password',
                    password: 'Invalid email or password'
                }));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleGoogleLogin = () => {
        // Store pre-login state if needed
        sessionStorage.setItem('preLoginPath', window.location.pathname);

        // Redirect to backend Google auth endpoint
        window.location.href = 'http://localhost:8000/auth/google';
    };

    const toggleMode = () => {
        // Use animation to switch between login and signup
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: ''
        });
        setErrors({});
        setIsLogin(!isLogin);
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const toggleConfirmPasswordVisibility = () => {
        setConfirmPasswordVisible(!confirmPasswordVisible);
    };

    // Dynamic background gradient style
    const gradientStyle = {
        backgroundImage: `radial-gradient(circle at ${gradientPosition.x * 100}% ${gradientPosition.y * 100}%, #1a2e35 0%, #0f172a 100%)`,
    };

    return (
        <Helmet title={isLogin ? 'Login' : 'Sign Up'}>
            <div
                className="min-h-screen flex items-center justify-center p-4 transition-all duration-500 overflow-hidden"
                style={gradientStyle}
            >
                {/* Animated particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-green-500 opacity-10"
                            style={{
                                width: `${Math.random() * 10 + 5}px`,
                                height: `${Math.random() * 10 + 5}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animation: `float ${Math.random() * 10 + 10}s linear infinite`
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    className="w-full max-w-md z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Success Message */}
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative text-center shadow-lg"
                            >
                                <span className="block sm:inline">{isLogin ? 'Login successful!' : 'Account created successfully!'}</span>
                                <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
                                    <svg
                                        onClick={() => setShowSuccess(false)}
                                        className="fill-current h-6 w-6 text-green-500 cursor-pointer"
                                        role="button"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                    >
                                        <title>Close</title>
                                        <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                                    </svg>
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Card Container */}
                    <motion.div
                        className="bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-800"
                        whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-5 relative">
                            <div className="flex justify-center">
                                <div className="flex space-x-2 relative z-10">
                                    <motion.button
                                        onClick={() => setIsLogin(true)}
                                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200
                                            ${isLogin ? 'bg-white text-green-700 shadow-lg' : 'text-white hover:bg-white/20'}`}
                                        whileHover={{ scale: isLogin ? 1 : 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Login
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setIsLogin(false)}
                                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200
                                            ${!isLogin ? 'bg-white text-green-700 shadow-lg' : 'text-white hover:bg-white/20'}`}
                                        whileHover={{ scale: !isLogin ? 1 : 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Sign Up
                                    </motion.button>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute rounded-full bg-white"
                                        style={{
                                            width: `${Math.random() * 100 + 50}px`,
                                            height: `${Math.random() * 100 + 50}px`,
                                            top: `${Math.random() * 100}%`,
                                            left: `${Math.random() * 100}%`,
                                            opacity: Math.random() * 0.2
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                <motion.form
                                    key={isLogin ? 'login' : 'signup'}
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                    initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <motion.h1
                                        className="text-2xl font-bold text-center text-white mb-6"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.3 }}
                                    >
                                        {isLogin ? 'Welcome Back!' : 'Create Your Account'}
                                    </motion.h1>

                                    {/* Name field (Sign up only) */}
                                    {!isLogin && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="name">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className={`w-full pl-10 pr-3 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-100
                                                        ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-700 focus:ring-green-200 focus:border-green-400'}`}
                                                    placeholder="John Doe"
                                                />
                                            </div>
                                            <AnimatePresence>
                                                {errors.name && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="mt-1 text-sm text-red-500 flex items-center"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        {errors.name}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}

                                    {/* Email field */}
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="email">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                </svg>
                                            </span>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-3 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-100
                                                    ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-700 focus:ring-green-200 focus:border-green-400'}`}
                                                placeholder="email@example.com"
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {errors.email && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="mt-1 text-sm text-red-500 flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {errors.email}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Password field */}
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="password">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                            <input
                                                id="password"
                                                name="password"
                                                type={passwordVisible ? "text" : "password"}
                                                value={formData.password}
                                                onChange={handleChange}
                                                className={`w-full pl-10 pr-10 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-100
                                                    ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-700 focus:ring-green-200 focus:border-green-400'}`}
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                                                onClick={togglePasswordVisibility}
                                            >
                                                {passwordVisible ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a7 7 0 00-7 7 7 7 0 0014 0 7 7 0 00-7-7zm0 12a5 5 0 110-10 5 5 0 010 10z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a7 7 0 00-7 7 7 7 0 0014 0 7 7 0 00-7-7zm0 12a5 5 0 110-10 5 5 0 010 10z" clipRule="evenodd" />
                                                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {errors.password && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="mt-1 text-sm text-red-500 flex items-center"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {errors.password}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Confirm Password (Sign up only) */}
                                    {!isLogin && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="confirmPassword">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                                <input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type={confirmPasswordVisible ? "text" : "password"}
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    className={`w-full pl-10 pr-10 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 transition-all text-gray-100
                                                        ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-700 focus:ring-green-200 focus:border-green-400'}`}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                                                    onClick={toggleConfirmPasswordVisibility}
                                                >
                                                    {confirmPasswordVisible ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 3a7 7 0 00-7 7 7 7 0 0014 0 7 7 0 00-7-7zm0 12a5 5 0 110-10 5 5 0 010 10z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 3a7 7 0 00-7 7 7 7 0 0014 0 7 7 0 00-7-7zm0 12a5 5 0 110-10 5 5 0 010 10z" clipRule="evenodd" />
                                                            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            <AnimatePresence>
                                                {errors.confirmPassword && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="mt-1 text-sm text-red-500 flex items-center"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        {errors.confirmPassword}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )}

                                    {/* Additional links */}
                                    {isLogin && (
                                        <div className="flex justify-end">
                                            <a href="#" className="text-sm text-green-400 hover:text-green-600 transition-colors">
                                                Forgot password?
                                            </a>
                                        </div>
                                    )}

                                    {/* Submit button */}
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-2 rounded-lg 
                                            hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-300 
                                            transition-all duration-200 font-medium"
                                    >
                                        {isLogin ? 'Log In' : 'Create Account'}
                                    </button>

                                    {/* Google Login button */}
                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        className="w-full bg-white text-gray-700 py-2 px-4 rounded-lg border border-gray-300
                                            hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 
                                            transition-all duration-200 font-medium mt-4 flex items-center justify-center space-x-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Connecting...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 48 48"
                                                    className="w-5 h-5"
                                                >
                                                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                                                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                                                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                                                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                                                </svg>
                                                <span>
                                                    {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    {/* Toggle switch */}
                                    <p className="text-center text-gray-400 text-sm mt-4">
                                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                                        <button
                                            type="button"
                                            onClick={toggleMode}
                                            className="text-green-400 hover:text-green-600 font-medium focus:outline-none"
                                        >
                                            {isLogin ? 'Sign up' : 'Log in'}
                                        </button>
                                    </p>
                                </motion.form>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </Helmet>
    );
};

export default AuthPage;