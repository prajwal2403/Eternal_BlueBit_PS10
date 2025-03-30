import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardLayout from './DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, PenTool, Users } from 'lucide-react';

const Dashboard = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showCollaborators, setShowCollaborators] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedStoryForCollab, setSelectedStoryForCollab] = useState(null);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);

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

                        // Store all story data in local storage
                        localStorage.setItem('stories', JSON.stringify(data));

                        // Store each story's complete data in local storage
                        data.forEach(story => {
                            localStorage.setItem(`story_${story.id}`, JSON.stringify({
                                id: story.id,
                                title: story.story_title,
                                genre: story.genre,
                                status: story.status,
                                createdAt: story.createdAt,
                                updatedAt: story.updatedAt,
                                // Add any other fields you receive from the backend
                            }));
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

    const handleReadStory = async (story) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('No token found. Please log in.');
                navigate('/auth');
                return;
            }

            // Send GET request to retrieve the story
            const response = await fetch(`http://localhost:8000/story/${story.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const storyData = await response.json();
                console.log('Retrieved story:', storyData);

                // Navigate to the story page with the retrieved story data
                navigate(`/story/${story.id}`, {
                    state: {
                        storyData: storyData,
                        userId: storyData.user_id,
                        showContinueButton: true,
                    },
                });
            } else if (response.status === 404) {
                toast.error('Story not found.');
            } else if (response.status === 401) {
                toast.error('Session expired. Please log in again.');
                navigate('/auth');
            } else {
                toast.error('Failed to retrieve the story.');
            }
        } catch (error) {
            console.error('Error retrieving story:', error);
            toast.error('An error occurred while retrieving the story.');
        }
    };

    const handleContinueStory = (story) => {
        const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
        localStorage.setItem('storyId', story.id);
        navigate('/continue-story', {
            state: {
                storyId: story.id,
                userId: userId,
                storyData: story // Pass the complete story data
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-500';
            case 'pending':
                return 'bg-yellow-500';
            case 'draft':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // New function to fetch all users for collaboration
    const fetchAllUsers = async () => {
        try {
            setLoadingUsers(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('No token found. Please log in.');
                navigate('/auth');
                return;
            }

            const response = await fetch('http://localhost:8000/users/all/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAllUsers(data);
            } else if (response.status === 401) {
                toast.error('Session expired. Please log in again.');
                navigate('/auth');
            } else {
                toast.error('Failed to load users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error loading users');
        } finally {
            setLoadingUsers(false);
        }
    };

    // New function to handle opening the collaborator modal
    const handleShowCollaborators = (story) => {
        setSelectedStoryForCollab(story);
        setSelectedCollaborators([]);
        setShowCollaborators(true);
        fetchAllUsers();
    };

    const handleAddCollaborators = async () => {
        if (!selectedStoryForCollab || selectedCollaborators.length === 0) {
            toast.warning('Please select a story and at least one collaborator');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('No token found. Please log in.');
                navigate('/auth');
                return;
            }

            // Log the storyId format for debugging
            const storyId = selectedStoryForCollab.id || selectedStoryForCollab._id;
            console.log('Story ID being sent:', storyId);

            const response = await fetch(`http://localhost:8000/stories/${storyId}/add_contributors/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contributors: selectedCollaborators,
                }),
            });

            const responseData = await response.json();

            if (response.ok) {
                toast.success('Collaborators added successfully');
                setShowCollaborators(false);

                // Refresh stories list
                const userData = localStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    const storiesResponse = await fetch(`http://localhost:8000/stories/user/${parsedUser.id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (storiesResponse.ok) {
                        const data = await storiesResponse.json();
                        setStories(data);
                    }
                }
            } else {
                console.error('Error response:', responseData);
                toast.error(responseData.detail || 'Failed to add collaborators');
            }
        } catch (error) {
            console.error('Error adding collaborators:', error);
            toast.error('Error adding collaborators');
        }
    };

    // Helper function to handle collaborator selection
    const toggleCollaborator = (userId) => {
        setSelectedCollaborators(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
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
                                key={story.id || index} // Use index as fallback to ensure uniqueness
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                                className="bg-gray-800 rounded-lg overflow-hidden shadow-xl border border-gray-700 hover:border-green-400/50 transition-all duration-300"
                            >
                                <div className="h-3 bg-gradient-to-r from-green-400 to-blue-500" />
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-xl font-bold text-white line-clamp-1 flex-1">
                                            {story.title || story.story_title || 'Untitled Story'}
                                        </h2>
                                        <span className={`${getStatusColor(story.status)} text-white text-xs px-2 py-1 rounded-full ml-2 capitalize`}>
                                            {story.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center text-gray-400">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <p className="text-sm">Updated: {formatDate(story.updatedAt)}</p>
                                        </div>
                                        <div className="flex items-center text-gray-400">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <p className="text-sm">Created: {formatDate(story.createdAt)}</p>
                                        </div>
                                        <p className="text-sm text-gray-400 flex items-center">
                                            <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                                            {story.genre || 'No genre specified'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex space-x-2">
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
                                                onClick={() => handleShowCollaborators(story)}
                                                className="text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md flex items-center"
                                            >
                                                <Users className="w-4 h-4 mr-2" />
                                                Collab
                                            </motion.button>
                                        </div>
                                        {story.status === 'End' ? (
                                            <motion.button
                                                disabled
                                                className="text-white bg-green-600 px-4 py-2 rounded-md flex items-center cursor-not-allowed"
                                            >
                                                Completed
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleContinueStory(story)}
                                                className="text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md flex items-center"
                                            >
                                                <PenTool className="w-4 h-4 mr-2" />
                                                Continue
                                            </motion.button>
                                        )}
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

            {/* Collaborators Modal */}
            {showCollaborators && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-xl"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">
                            Add Collaborators to "{selectedStoryForCollab?.title || selectedStoryForCollab?.story_title || 'Untitled Story'}"
                        </h2>
                        {loadingUsers ? (
                            <div className="flex justify-center py-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full"
                                />
                            </div>
                        ) : (
                            <>
                                {allUsers.length > 0 ? (
                                    <div className="max-h-64 overflow-y-auto my-4">
                                        {allUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className={`p-3 border-b border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-700 transition-colors ${selectedCollaborators.includes(user.id) ? 'bg-gray-700' : ''}`}
                                                onClick={() => toggleCollaborator(user.id)}
                                            >
                                                <div>
                                                    <p className="text-white font-medium">{user.name}</p>
                                                    <p className="text-gray-400 text-sm">{user.email}</p>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedCollaborators.includes(user.id) ? 'border-green-400 bg-green-400' : 'border-gray-500'}`}>
                                                    {selectedCollaborators.includes(user.id) && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-4">No other users found.</p>
                                )}
                            </>
                        )}
                        <div className="flex justify-end space-x-3 mt-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCollaborators(false)}
                                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAddCollaborators}
                                disabled={selectedCollaborators.length === 0}
                                className={`px-4 py-2 rounded-md text-white ${selectedCollaborators.length === 0 ? 'bg-blue-500 opacity-50 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                            >
                                Add Selected
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Dashboard;