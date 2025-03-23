import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AddStory = () => {
    const navigate = useNavigate();
    const [storyPreferences, setStoryPreferences] = useState({
        genre: '',
        ageGroup: '',
        theme: '',
        length: '',
        additionalNotes: ''
    });
    const [loading, setLoading] = useState(false);

    const genres = ['Fantasy', 'Adventure', 'Mystery', 'Educational', 'Fairy Tale'];
    const ageGroups = ['3-5 years', '6-8 years', '9-12 years', '13+ years'];
    const themes = ['Friendship', 'Family', 'Nature', 'Magic', 'Science', 'History'];
    const lengths = ['Short', 'Medium', 'Long'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(storyPreferences)
            });

            if (response.ok) {
                navigate('/dashboard');
            } else {
                console.error('Failed to create story');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900/90 backdrop-blur-sm border-r border-gray-800">
                <div className="p-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                        Odysseus
                    </h2>
                </div>
                <nav className="mt-6">
                    <Link
                        to="/dashboard"
                        className="block px-6 py-3 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-all duration-200"
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/add-story"
                        className="block px-6 py-3 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-all duration-200"
                    >
                        Add Story
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto bg-gray-900/90 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
                    <h1 className="text-3xl font-bold text-white mb-6">Create New Story</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Genre Selection */}
                        <div>
                            <label className="block text-white mb-2">Genre</label>
                            <select
                                value={storyPreferences.genre}
                                onChange={(e) => setStoryPreferences({ ...storyPreferences, genre: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                            >
                                <option value="">Select Genre</option>
                                {genres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Age Group Selection */}
                        <div>
                            <label className="block text-white mb-2">Age Group</label>
                            <select
                                value={storyPreferences.ageGroup}
                                onChange={(e) => setStoryPreferences({ ...storyPreferences, ageGroup: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                            >
                                <option value="">Select Age Group</option>
                                {ageGroups.map(age => (
                                    <option key={age} value={age}>{age}</option>
                                ))}
                            </select>
                        </div>

                        {/* Theme Selection */}
                        <div>
                            <label className="block text-white mb-2">Theme</label>
                            <select
                                value={storyPreferences.theme}
                                onChange={(e) => setStoryPreferences({ ...storyPreferences, theme: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                            >
                                <option value="">Select Theme</option>
                                {themes.map(theme => (
                                    <option key={theme} value={theme}>{theme}</option>
                                ))}
                            </select>
                        </div>

                        {/* Story Length */}
                        <div>
                            <label className="block text-white mb-2">Story Length</label>
                            <select
                                value={storyPreferences.length}
                                onChange={(e) => setStoryPreferences({ ...storyPreferences, length: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                            >
                                <option value="">Select Length</option>
                                {lengths.map(length => (
                                    <option key={length} value={length}>{length}</option>
                                ))}
                            </select>
                        </div>

                        {/* Additional Notes */}
                        <div>
                            <label className="block text-white mb-2">Additional Notes</label>
                            <textarea
                                value={storyPreferences.additionalNotes}
                                onChange={(e) => setStoryPreferences({ ...storyPreferences, additionalNotes: e.target.value })}
                                className="w-full h-32 px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                                placeholder="Add any specific requirements or preferences..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg 
                            hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-green-300 
                            transition-all duration-200 font-medium disabled:opacity-50"
                        >
                            {loading ? 'Creating Story...' : 'Create Story'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddStory;