import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from './DashboardLayout';

const Story = () => {
    const { id } = useParams();
    const location = useLocation();
    const [story, setStory] = useState(location.state?.first_part || null);
    const [loading, setLoading] = useState(!location.state?.first_part);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchStory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/stories/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStory(data.first_part);
                } else {
                    toast.error('Failed to load story');
                }
            } catch (error) {
                console.error('Error fetching story:', error);
                toast.error('Error loading story');
            } finally {
                setLoading(false);
            }
        };

        if (!story) {
            fetchStory();
        }
    }, [id, story]);

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-lg p-8 shadow-xl"
            >
                <h1 className="text-3xl font-bold text-white mb-8">Your Story</h1>
                <div className="prose prose-lg prose-invert max-w-none">
                    {story && story.split('\n\n').map((paragraph, index) => (
                        <motion.p
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="text-gray-300 mb-6 leading-relaxed"
                        >
                            {paragraph}
                        </motion.p>
                    ))}
                </div>
            </motion.div>
        </DashboardLayout>
    );
};

export default Story;