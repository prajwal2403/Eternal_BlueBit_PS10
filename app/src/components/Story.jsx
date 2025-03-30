import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from './DashboardLayout';
import { BookOpen, Calendar, User, Clock, Volume2, VolumeX } from 'lucide-react';

// Styled Image Gallery Component with increased gap
const ImageGallery = ({ images }) => {
    if (!images || images.length === 0) return null;

    return (
        <div className="flex flex-col space-y-12">
            {/* Increased the gap from space-y-6 to space-y-12 */}
            <h3 className="text-xl font-semibold text-white flex items-center mb-2">
                <BookOpen className="mr-2 text-emerald-400" size={20} />
                Story Illustrations
            </h3>

            {images.map((image, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    className="rounded-xl overflow-hidden shadow-lg border border-gray-700 group hover:shadow-emerald-900/30 hover:shadow-xl transition-all duration-300"
                >
                    <div className="relative">
                        <img
                            src={image}
                            alt={`Story Image ${index + 1}`}
                            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                            style={{ maxHeight: '600px' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                            <p className="text-white p-4 text-sm">Illustration {index + 1}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// Styled Story Meta Component
const StoryMeta = ({ story }) => {
    if (!story) return null;

    return (
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-400">
            {story.author && (
                <div className="flex items-center">
                    <User size={16} className="mr-2 text-emerald-400" />
                    <span>By {story.author}</span>
                </div>
            )}
            {story.createdAt && (
                <div className="flex items-center">
                    <Calendar size={16} className="mr-2 text-emerald-400" />
                    <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                </div>
            )}
            {story.readTime && (
                <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-emerald-400" />
                    <span>{story.readTime} min read</span>
                </div>
            )}
        </div>
    );
};

const Story = () => {
    const { id } = useParams();
    const location = useLocation();
    const [story, setStory] = useState(location.state?.storyData || null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(!location.state?.storyData);
    const [user, setUser] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchStory = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    toast.error('No token found. Please log in.');
                    return;
                }

                const response = await fetch(`http://localhost:8000/story/${id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched story:', data);
                    setStory(data);
                } else if (response.status === 404) {
                    toast.error('Story not found.');
                } else if (response.status === 401) {
                    toast.error('Session expired. Please log in again.');
                } else {
                    toast.error('Failed to load story.');
                }
            } catch (error) {
                console.error('Error fetching story:', error);
                toast.error('Error loading story.');
            } finally {
                setLoading(false);
            }
        };

        const fetchImages = async () => {
            try {
                const response = await fetch(`http://localhost:8000/story/${id}/images`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Fetched images:', data.images);
                    const fullImageUrls = data.images.map(image => `http://localhost:8000${image}`);
                    setImages(fullImageUrls);
                } else if (response.status === 404) {
                    console.warn('No images found for this story.');
                } else {
                    //toast.error('Failed to load images.');
                }
            } catch (error) {
                console.error('Error fetching images:', error);
                //toast.error('Error loading images.');
            }
        };

        if (!story) {
            fetchStory();
        }
        fetchImages();
    }, [id, story]);

    // Text-to-Speech Functionality
    const handleSpeak = () => {
        if (!story?.plot) {
            
            return;
        }

        const synth = window.speechSynthesis;
        if (synth.speaking) {
            toast.warning('Speech is already in progress.');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(story.plot);

        // Get available voices and select a female voice
        const voices = synth.getVoices();
        const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female') || voice.gender === 'female');

        if (femaleVoice) {
            utterance.voice = femaleVoice;
        } else {
            console.warn('No female voice found. Using default voice.');
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            
            setIsSpeaking(false);
        };

        synth.speak(utterance);
    };

    const handleStop = () => {
        const synth = window.speechSynthesis;

        // Check if speech synthesis is active
        if (synth.speaking || synth.pending) {
            synth.cancel();
            setIsSpeaking(false);
            toast.success('Speech stopped.');
        } else {
            toast.info('No speech is currently active.');
        }
    };

    // Custom loading animation
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{
                            rotate: 360,
                            borderRadius: ["50% 50% 50% 50%", "40% 60% 60% 40%", "50% 50% 50% 50%"],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            borderRadius: { duration: 1, repeat: Infinity, repeatType: "reverse" }
                        }}
                        className="w-16 h-16 border-4 border-emerald-400 border-t-transparent mx-auto"
                    />
                    <p className="mt-4 text-emerald-400 animate-pulse">Loading your story...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout user={user}>
            <div className="max-w-6xl mx-auto px-4">
                {/* Hero section with title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="bg-gradient-to-r from-emerald-900/50 to-gray-800/50 rounded-xl p-8 shadow-2xl border border-emerald-800/30">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                            {story?.title || 'Your Story'}
                        </h1>
                        <StoryMeta story={story} />

                        {/* Text-to-Speech Buttons */}
                        <div className="mt-4 flex space-x-4">
                            <button
                                onClick={handleSpeak}
                                className={`px-6 py-3 rounded-lg transition-colors duration-300 flex items-center ${isSpeaking ? 'bg-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    }`}
                                disabled={isSpeaking}
                            >
                                <Volume2 className="mr-2" />
                                {isSpeaking ? 'Speaking...' : 'Read Aloud'}
                            </button>

                            <button
                                onClick={handleStop}
                                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-300 flex items-center"
                            >
                                <VolumeX className="mr-2" />
                                Stop
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Main content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-gray-800 rounded-xl shadow-xl flex flex-col lg:flex-row gap-8 relative overflow-hidden"
                >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-800/10 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>

                    {/* Story Content */}
                    <div className="flex-1 p-8">
                        <div className="prose prose-lg prose-invert max-w-none">
                            {story?.plot && story.plot.split('\n\n').map((paragraph, index) => (
                                <motion.p
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                                    className="text-gray-300 mb-6 leading-relaxed"
                                >
                                    {paragraph}
                                </motion.p>
                            ))}
                        </div>
                    </div>

                    {/* Image Gallery */}
                    <div className="w-full lg:w-1/3 bg-gray-850 p-8 border-t lg:border-t-0 lg:border-l border-gray-700">
                        <ImageGallery images={images} />
                    </div>
                </motion.div>

                {/* Navigation or actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 flex justify-between items-center"
                >
                    <button
                        onClick={handleSpeak}
                        className={`px-6 py-3 rounded-lg transition-colors duration-300 flex items-center ${isSpeaking ? 'bg-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                        disabled={isSpeaking}
                    >
                        <Volume2 className="mr-2" />
                        {isSpeaking ? 'Speaking...' : 'Read Aloud'}
                    </button>

                    <button
                        onClick={handleStop}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors duration-300 flex items-center"
                    >
                        <VolumeX className="mr-2" />
                        Stop
                    </button>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default Story;