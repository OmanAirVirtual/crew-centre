import React from 'react';
import './Loading.css';

const Loading = ({ fullScreen = false, text = 'Loading...' }) => {
    return (
        <div className={`loading-container ${fullScreen ? 'full-screen' : ''}`}>
            <div className="spinner"></div>
            <div className="loading-text">{text}</div>
        </div>
    );
};

export default Loading;
