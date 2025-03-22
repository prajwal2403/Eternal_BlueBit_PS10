import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Generate = () => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Add your API call logic here
        setLoading(false);
    };

    return (
        <div className="flex h-screen bg-black">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-green-500">MedBot</h2>
                </div>
                <nav className="mt-6">
                    <Link
                        to="/dashboard"
                        className="block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-green-500"
                    >
                        Dashboard
                    </Link>
                    <Link
                        to="/generate"
                        className="block px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-green-500"
                    >
                        Generate
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-black p-8">
                <div className="bg-gray-900 rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-white mb-6">Generate</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-white mb-2">Enter your prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-32 px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                                placeholder="Enter your medical query here..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-2 rounded-lg 
              hover:from-green-600 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-300 
              transition-all duration-200 font-medium"
                        >
                            {loading ? 'Generating...' : 'Generate'}
                        </button>
                    </form>

                    {result && (
                        <div className="mt-8">
                            <h2 className="text-xl font-bold text-white mb-4">Result:</h2>
                            <div className="bg-gray-800 p-6 rounded-lg">
                                <p className="text-white">{result}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Generate;