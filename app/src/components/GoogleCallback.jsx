import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCallback = ({ onLogin }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = searchParams.get('access_token');
        if (accessToken) {
            // Store the token
            localStorage.setItem('access_token', accessToken);

            // Call the onLogin handler
            onLogin();

            // Redirect to dashboard or stored pre-login path
            const redirectPath = sessionStorage.getItem('preLoginPath') || '/dashboard';
            sessionStorage.removeItem('preLoginPath'); // Clean up
            navigate(redirectPath);
        } else {
            // Handle error case
            navigate('/auth');
        }
    }, [searchParams, navigate, onLogin]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="text-white text-xl">Authenticating...</div>
        </div>
    );
};

export default GoogleCallback;