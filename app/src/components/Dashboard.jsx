import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const navigate = useNavigate();
    // Animated background gradient effect
    const [gradientPosition, setGradientPosition] = useState({ x: 0, y: 0 });
    const [stories, setStories] = useState([]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            setGradientPosition({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/stories', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStories(data);
                }
            } catch (error) {
                console.error('Error fetching stories:', error);
            }
        };

        fetchStories();
    }, []);

    // Dynamic background gradient style
    const gradientStyle = {
        backgroundImage: `radial-gradient(circle at ${gradientPosition.x * 100}% ${gradientPosition.y * 100}%, #1a2e35 0%, #0f172a 100%)`,
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:8000/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                // Clear any local storage items
                localStorage.removeItem('token');
                // Redirect to auth page
                navigate('/auth');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return (
        <div className="flex h-screen" style={gradientStyle}>
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

            {/* Sidebar */}
            <motion.div
                className="w-64 bg-gray-900/90 backdrop-blur-sm border-r border-gray-800"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                        Odysseus
                    </h2>
                </div>
                <nav className="mt-6 flex flex-col justify-between h-[calc(100%-88px)]">
                    <div>
                        <Link
                            to="/dashboard"
                            className="block px-6 py-3 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-all duration-200"
                        >
                            My Stories
                        </Link>
                        <Link
                            to="/generate"
                            className="block px-6 py-3 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-all duration-200"
                        >
                            Generate
                        </Link>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="block px-6 py-3 mt-auto mb-6 text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                    >
                        Logout
                    </button>
                </nav>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-auto">
                <motion.div
                    className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold text-white mb-6">Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Stats Cards */}
                        <motion.div
                            className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors duration-300"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <h3 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                                Total Generations
                            </h3>
                            <p className="text-3xl font-bold text-white mt-2">0</p>
                        </motion.div>
                        <motion.div
                            className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors duration-300"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <h3 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                                Recent Activities
                            </h3>
                            <p className="text-3xl font-bold text-white mt-2">0</p>
                        </motion.div>
                        <motion.div
                            className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-green-500/50 transition-colors duration-300"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <h3 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                                Success Rate
                            </h3>
                            <p className="text-3xl font-bold text-white mt-2">0%</p>
                        </motion.div>
                    </div>
                    <motion.div
                        className="mt-8 bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">My Stories</h2>
                            <Link
                                to="/add-story"
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg 
                                hover:from-green-600 hover:to-teal-600 transition-all duration-200"
                            >
                                Create New Story
                            </Link>
                        </div>

                        {stories.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">No stories yet. Create your first story!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stories.map((story) => (
                                    <motion.div
                                        key={story._id}
                                        className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 
                                        hover:border-green-500/50 transition-colors duration-300"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded-full">
                                                {story.genre}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                                {story.ageGroup}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-2">
                                            {story.theme}
                                        </h3>
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                            {story.additionalNotes}
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">
                                                Length: {story.length}
                                            </span>
                                            <button
                                                className="text-green-400 hover:text-green-300 transition-colors"
                                                onClick={() => navigate(`/story/${story._id}`)}
                                            >
                                                View Story →
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;