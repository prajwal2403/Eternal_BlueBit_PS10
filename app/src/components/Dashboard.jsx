import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from './DashboardLayout';

const Dashboard = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchStories = async () => {
            try {
                const response = await fetch('http://localhost:8000/stories/user/', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStories(data);
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
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white">My Stories</h1>
                {stories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stories.map((story) => (
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800 rounded-lg p-6 shadow-xl"
                            >
                                <h2 className="text-xl font-bold text-white mb-4">{story.title}</h2>
                                <p className="text-gray-400">{story.content}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">No stories found.</p>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;