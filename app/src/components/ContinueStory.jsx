import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from './DashboardLayout';
import confetti from 'canvas-confetti';

const ContinueStory = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [storyId, setStoryId] = useState(null);
    const [plot, setPlot] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loadingChoice, setLoadingChoice] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        const storedStoryId = localStorage.getItem('storyId');
        if (!userData || !storedStoryId) {
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
            setStoryId(storedStoryId);
        } catch (error) {
            console.error('Error parsing user data:', error);
            navigate('/auth');
        }
    }, [navigate]);

    const handleContinueStory = async () => {
        setLoading(true);
        setOptions([]);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('No token found. Please log in.');
                navigate('/auth');
                return;
            }

            const response = await fetch(`http://localhost:8000/get-story-options/?user_id=${user.id}&story_id=${storyId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Session expired. Please log in again.');
                    navigate('/auth');
                } else {
                    toast.error('Failed to get story options');
                }
                return;
            }

            let data = null;

            try {
                data = await response.json();
                console.log('Backend response:', data);
            } catch (error) {
                console.warn('Failed to parse JSON:', error);
                data = null;
            }

            if (!data || !data.options || !Array.isArray(data.options)) {
                console.warn('Invalid or empty response format:', data);
                setOptions([]);
                toast.warning('No story options available.');
            } else {
                // Clean the options data
                const cleanedOptions = data.options.map(option => {
                    return option.replace(/^Here are the three engaging and distinct directions for the next part of the story:\s*/i, '');
                });

                // Animated reveal of options
                setTimeout(() => {
                    setOptions(cleanedOptions);
                    setFadeIn(true);
                }, 300);

                toast.success('Choose your adventure!', {
                    icon: '🧙‍♂️',
                    position: "top-center",
                    autoClose: 3000
                });
            }

        } catch (error) {
            console.error('Error fetching story options:', error);
            toast.error('An error occurred while loading story options');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionClick = async (choice) => {
        if (!user || !storyId || choice < 1 || choice > options.length) {
            toast.error('Invalid input data');
            return;
        }

        setSelectedOption(choice - 1);
        setLoadingChoice(true);

        // Construct the URL with query parameters
        const url = `http://localhost:8000/continue-story/?user_id=${encodeURIComponent(user.id)}&story_id=${encodeURIComponent(storyId)}&choice=${choice}`;
        console.log("Request URL:", url);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                toast.error('Failed to continue story');
                setLoadingChoice(false);
                setSelectedOption(null);
                return;
            }

            const data = await response.json();
            console.log('Continue story response:', data);

            // Launch confetti effect
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            toast.success('A new chapter unfolds!', {
                icon: '📚',
                position: "top-center",
                autoClose: 3000
            });

            // Animate the new plot appearance
            setFadeIn(false);
            setTimeout(() => {
                setPlot(data.plot);
                setLoadingChoice(false);
                setFadeIn(true);
            }, 500);

        } catch (error) {
            console.error('Error continuing story:', error);
            toast.error('An error occurred while continuing the story');
            setLoadingChoice(false);
            setSelectedOption(null);
        }
    };

    const handleRefreshOptions = () => {
        setFadeIn(false);
        setTimeout(() => {
            handleContinueStory();
        }, 300);
    };

    // Function to handle sharing the story
    const handleShareStory = () => {
        // Create a shareable URL or text based on the story
        const shareText = `Check out my interactive story adventure! #StoryApp`;

        if (navigator.share) {
            navigator.share({
                title: 'My Interactive Story',
                text: shareText,
                url: window.location.href,
            })
                .then(() => toast.success('Story shared successfully!'))
                .catch((error) => console.log('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support the Web Share API
            navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
                .then(() => toast.success('Link copied to clipboard!'))
                .catch(() => toast.error('Failed to copy link'));
        }
    };

    useEffect(() => {
        if (user) {
            handleContinueStory();
        }
    }, [user]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1,
                duration: 0.5
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <DashboardLayout user={user}>
            <div className="flex-1 p-4 md:p-8 overflow-auto bg-gradient-to-b from-gray-900 to-gray-950">
                <motion.div
                    className="max-w-4xl mx-auto space-y-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                            Your Adventure Continues
                        </h1>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 shadow-lg"
                            onClick={handleShareStory}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                            </svg>
                            Share
                        </motion.button>
                    </div>

                    <p className="text-gray-300 text-lg italic border-l-4 border-green-500 pl-4">
                        Choose wisely, for each decision shapes your unique story...
                    </p>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full mb-4"
                            />
                            <p className="text-gray-300 animate-pulse">Crafting your adventure...</p>
                        </div>
                    ) : (
                        <>
                            <AnimatePresence>
                                {options.length > 0 && (
                                    <motion.div
                                        className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-800 shadow-xl"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate={fadeIn ? "visible" : "hidden"}
                                        exit="hidden"
                                    >
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold text-white">Choose Your Path</h2>
                                            <motion.button
                                                whileHover={{ scale: 1.05, rotate: 180 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300"
                                                onClick={handleRefreshOptions}
                                                disabled={loadingChoice}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                </svg>
                                            </motion.button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                            {options.map((option, index) => (
                                                <motion.div
                                                    key={index}
                                                    variants={itemVariants}
                                                    className={`relative bg-gray-800 rounded-lg p-5 border ${selectedOption === index
                                                        ? 'border-green-400 ring-2 ring-green-400/30'
                                                        : 'border-gray-700 hover:border-green-400/50'
                                                        } transition-all duration-300 cursor-pointer overflow-hidden group`}
                                                    onClick={() => !loadingChoice && handleOptionClick(index + 1)}
                                                >
                                                    {/* Hover effect overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-white mb-2">Path {index + 1}</h3>
                                                            <p className="text-gray-300">{option}</p>
                                                        </div>
                                                    </div>

                                                    {selectedOption === index && loadingChoice && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {plot && (
                                    <motion.div
                                        className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-800 shadow-xl mt-8"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: fadeIn ? 1 : 0, y: fadeIn ? 0 : 20 }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                    >
                                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                            Your Story Unfolds
                                        </h2>
                                        <div className="prose prose-lg prose-invert max-w-none">
                                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{plot}</p>
                                        </div>

                                        <div className="mt-6 flex justify-end space-x-4">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 ${plot?.status === 'END' ? 'bg-gray-500 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'
                                                    }`}
                                                onClick={handleRefreshOptions}
                                                disabled={plot?.status === 'END'}
                                            >
                                                Continue Journey
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!options.length && !loading && !plot && (
                                <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-800 flex flex-col items-center justify-center h-64">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <p className="text-gray-400 text-center">No story options available.</p>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
                                        onClick={handleRefreshOptions}
                                    >
                                        Try Again
                                    </motion.button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default ContinueStory;