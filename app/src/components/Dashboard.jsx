import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from './DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, PenTool } from 'lucide-react';

const Dashboard = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);

            const fetchStories = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        toast.error('No token found. Please log in.');
                        navigate('/auth');
                        return;
                    }

                    const response = await fetch(`http://localhost:8000/stories/user/${parsedUser.id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setStories(data);
                        localStorage.setItem('stories', JSON.stringify(data));

                        // Store each story's data in local storage
                        data.forEach(story => {
                            localStorage.setItem(`story_${story.id}`, JSON.stringify(story));
                        });
                    } else if (response.status === 401) {
                        toast.error('Session expired. Please log in again.');
                        navigate('/auth');
                    } else {
                        toast.error('Failed to load stories');
                    }
                } catch (error) {
                    console.error('Error fetching stories:', error);
                    toast.error('Error loading stories');
                } finally {
                    setLoading(false);
                }
            };

            fetchStories();
        } else {
            navigate('/auth');
        }
    }, [navigate]);

    const handleReadStory = (story) => {
        console.log("Story Object:", story); // Debugging
        const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
        navigate(`/story/${story.id}`, {
            state: {
                storyData: story,
                userId: userId,
                showContinueButton: true
            }
        });
    };

    const handleContinueStory = (story) => {
        console.log("Story Object:", story); // Debugging
        const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
        localStorage.setItem('storyId', story.id);
        navigate('/continue-story', {
            state: {
                storyId: story.id,
                userId: userId
            }
        });
    };
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full shadow-lg shadow-green-400/20"
                    />
                    <p className="text-green-400 mt-4 font-medium">Loading your stories...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="space-y-8 px-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">My Stories</h1>
                        <p className="text-gray-400">Your creative journey begins here</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/create-story')}
                        className="mt-4 md:mt-0 bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-green-700/20 flex items-center"
                    >
                        <PenTool className="w-5 h-5 mr-2" />
                        Create New Story
                    </motion.button>
                </div>

                {stories.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {stories.map((story, index) => (
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                                className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700 hover:border-green-400/50 transition-all duration-300"
                            >
                                <div className="h-3 bg-gradient-to-r from-green-400 to-blue-500" />
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-white mb-4 line-clamp-1">{story.title}</h2>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-gray-400">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <p className="text-sm">Last edited: {new Date().toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-sm text-gray-400 flex items-center">
                                            <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                                            {story.genre}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleReadStory(story)}
                                            className="text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md flex items-center"
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Read
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleContinueStory(story)}
                                            className="text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md flex items-center"
                                        >
                                            <PenTool className="w-4 h-4 mr-2" />
                                            Continue
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-10 text-center"
                    >
                        <div className="flex justify-center mb-4">
                            <BookOpen className="w-16 h-16 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No stories found</h3>
                        <p className="text-gray-400 mb-6">Your creative journey is about to begin. Start writing your first story!</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/create-story')}
                            className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-medium py-2 px-6 rounded-lg shadow-lg inline-flex items-center"
                        >
                            <PenTool className="w-5 h-5 mr-2" />
                            Create Your First Story
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;