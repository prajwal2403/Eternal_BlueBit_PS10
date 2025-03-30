import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from './DashboardLayout';

const AddStory = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [storyPreferences, setStoryPreferences] = useState({
        genre: '',
        initial_input: '',
        brutality: 5,
        emotion: 5,
        suspense: 5,
        humor: 5,
        romance: 5,
        intensity: 5,
        mystery: 5,
        ending: '',
        style: '' // New field for style
    });
    const [loading, setLoading] = useState(false);
    const [storyContent, setStoryContent] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            navigate('/auth');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            if (!parsedUser.id) {
                navigate('/auth');
                return;
            }
            setUser(parsedUser);
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/auth');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStoryContent(null);

        if (!storyPreferences.genre.trim()) {
            toast.error('Please select a genre');
            setLoading(false);
            return;
        }
        if (!storyPreferences.initial_input.trim()) {
            toast.error('Please provide an initial input');
            setLoading(false);
            return;
        }
        if (!storyPreferences.style.trim()) {
            toast.error('Please select a style');
            setLoading(false);
            return;
        }
        if (!storyPreferences.ending.trim()) {
            toast.error('Please select an ending');
            setLoading(false);
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData?.id) {
                toast.error('User session expired. Please login again.');
                navigate('/dashboard');
                return;
            }

            // Create URL with query parameters
            const url = new URL("http://localhost:8000/new-story/");
            const params = {
                user_id: userData.id,
                genre: storyPreferences.genre.toLowerCase(),
                initial_input: storyPreferences.initial_input.trim(),
                brutality: storyPreferences.brutality,
                emotion: storyPreferences.emotion,
                suspense: storyPreferences.suspense,
                humor: storyPreferences.humor,
                romance: storyPreferences.romance,
                intensity: storyPreferences.intensity,
                mystery: storyPreferences.mystery,
                style: storyPreferences.style.toLowerCase(),
                ending: storyPreferences.ending.toLowerCase(),
            };

            // Add params to URL
            Object.keys(params).forEach(key =>
                url.searchParams.append(key, params[key])
            );

            const response = await fetch(url.toString(), {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem('token')}`,
                    "Content-Type": "application/json",
                },
                // No body needed since we're using query params
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    console.error("Validation errors:", data.detail);
                    const errorMessage = data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(", ");
                    toast.error(`Validation Error: ${errorMessage}`);
                } else if (response.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate("/auth");
                } else {
                    toast.error(data.detail || "Failed to create story");
                }
                console.error("Failed to create story:", data);
                return;
            }

            setStoryContent(data.first_part);
            toast.success(`Story "${data.story_title}" created successfully!`);
            setTimeout(() => {
                navigate(`/story/${data.story_id}`, {
                    state: {
                        first_part: data.first_part,
                        story_id: data.story_id,
                        story_title: data.story_title,
                        status: data.status,
                    },
                });
            }, 1500);
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred while creating the story");
        } finally {
            setLoading(false);
        }
    };


    return (
        <DashboardLayout user={user}>
            <div className="flex-1 p-4 md:p-8 overflow-auto">
                <motion.div
                    className="max-w-2xl mx-auto space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {storyContent ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-800"
                        >
                            <h2 className="text-2xl font-bold text-white mb-4">Your Story</h2>
                            <div className="prose prose-invert max-w-none">
                                {storyContent.split('\n\n').map((paragraph, index) => (
                                    <p key={index} className="text-gray-300 mb-4">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-green-400 italic"
                                >
                                    Redirecting to story page...
                                </motion.p>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                            <h1 className="text-2xl font-bold text-white mb-6">Create New Story</h1>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <label className="block text-gray-400 mb-2">Genre</label>
                                    <select
                                        value={storyPreferences.genre}
                                        onChange={(e) => setStoryPreferences({ ...storyPreferences, genre: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800/50 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                                        required
                                    >
                                        <option value="">Select Genre</option>
                                        {['Fantasy', 'Adventure', 'Mystery', 'Educational', 'Fairy Tale'].map(genre => (
                                            <option key={genre} value={genre}>{genre}</option>
                                        ))}
                                    </select>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <label className="block text-gray-400 mb-2">Style</label>
                                    <select
                                        value={storyPreferences.style}
                                        onChange={(e) => setStoryPreferences({ ...storyPreferences, style: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800/50 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                                        required
                                    >
                                        <option value="">Select Style</option>
                                        {['Shakespearen', 'Cyberpunk', 'Dystopian', 'Mytholical And Folklore', 'Psycological Thriller'].map(style => (
                                            <option key={style} value={style}>{style}</option>
                                        ))}
                                    </select>
                                </motion.div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['brutality', 'emotion', 'suspense', 'humor', 'romance', 'intensity', 'mystery'].map((param, index) => (
                                        <motion.div
                                            key={param}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + index * 0.1 }}
                                        >
                                            <label className="block text-gray-400 mb-2 capitalize">{param}</label>
                                            <div className="flex items-center space-x-4">
                                                <input
                                                    type="range"
                                                    name={param}
                                                    min="1"
                                                    max="10"
                                                    value={storyPreferences[param]}
                                                    onChange={(e) => setStoryPreferences({ ...storyPreferences, [param]: e.target.value })}
                                                    className="flex-1"
                                                />
                                                <span className="text-green-400 w-8 text-center">{storyPreferences[param]}</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9 }}
                                >
                                    <label className="block text-gray-400 mb-2">Ending</label>
                                    <select
                                        value={storyPreferences.ending}
                                        onChange={(e) => setStoryPreferences({ ...storyPreferences, ending: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800/50 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                                        required
                                    >
                                        <option value="">Select Ending</option>
                                        {['open-ended', 'happy', 'sad', 'cliffhanger'].map(ending => (
                                            <option key={ending} value={ending}>{ending}</option>
                                        ))}
                                    </select>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                >
                                    <label className="block text-gray-400 mb-2">Initial Input</label>
                                    <textarea
                                        value={storyPreferences.initial_input}
                                        onChange={(e) => setStoryPreferences({ ...storyPreferences, initial_input: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-800/50 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                                        rows="4"
                                        placeholder="Enter the initial input for the story..."
                                        required
                                    />
                                </motion.div>
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg 
                                    hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-green-300 
                                    transition-all duration-200 font-medium disabled:opacity-50"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.1 }}
                                >
                                    {loading ? 'Creating Story...' : 'Create Story'}
                                </motion.button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default AddStory;