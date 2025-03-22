import React, { useState } from 'react';
import Helmet from "./Helemt/Helmet";
import { useNavigate } from 'react-router-dom';

// Add test user credentials near the top of the component
const testUser = {
    email: 'test@example.com',
    password: 'test123'
};

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

    const navigate = useNavigate();

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

    // Update the handleSubmit function
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            console.log('Form submitted:', formData);

            // Check if the submitted credentials match the test user
            if (isLogin &&
                formData.email === testUser.email &&
                formData.password === testUser.password) {

                setShowSuccess(true);
                // Call the onLogin prop to update authentication state
                onLogin();

                // Redirect to dashboard after successful login
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else if (!isLogin) {
                // Handle signup case
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
            } else {
                // Show error for invalid credentials
                setErrors(prev => ({
                    ...prev,
                    email: 'Invalid email or password',
                    password: 'Invalid email or password'
                }));
            }
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setErrors({});
    };

    return (
        <Helmet title={isLogin ? 'Login' : 'Sign Up'}>
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Success Message */}
                    {showSuccess && (
                        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-center">
                            {isLogin ? 'Login successful!' : 'Account created successfully!'}
                        </div>
                    )}

                    {/* Card Container */}
                    <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-green-700 p-4">
                            <div className="flex justify-center">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setIsLogin(true)}
                                        className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200
                    ${isLogin ? 'bg-white text-green-700' : 'text-white hover:bg-white/20'}`}
                                    >
                                        Login
                                    </button>
                                    <button
                                        onClick={() => setIsLogin(false)}
                                        className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-200
                    ${!isLogin ? 'bg-white text-green-700' : 'text-white hover:bg-white/20'}`}
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <h1 className="text-2xl font-bold text-center text-white mb-6">
                                {isLogin ? 'Welcome Back!' : 'Create Your Account'}
                            </h1>

                            {/* Name field (Sign up only) */}
                            {!isLogin && (
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-1" htmlFor="name">
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
                    ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-600 focus:ring-green-200 focus:border-green-400'}`}
                                        placeholder="John Doe"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                </div>
                            )}

                            {/* Email field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1" htmlFor="email">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
                  ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-600 focus:ring-green-200 focus:border-green-400'}`}
                                    placeholder="email@example.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                            </div>

                            {/* Password field */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-1" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
                  ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-600 focus:ring-green-200 focus:border-green-400'}`}
                                    placeholder="••••••••"
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                            </div>

                            {/* Confirm Password (Sign up only) */}
                            {!isLogin && (
                                <div>
                                    <label className="block text-gray-300 text-sm font-medium mb-1" htmlFor="confirmPassword">
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all
                    ${errors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-600 focus:ring-green-200 focus:border-green-400'}`}
                                        placeholder="••••••••"
                                    />
                                    {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                                </div>
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
                        </form>
                    </div>
                </div>
            </div>
        </Helmet>
    );
};

export default AuthPage;