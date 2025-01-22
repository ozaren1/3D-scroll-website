"use client"
import { useState } from "react";

const Home = () => {
  const [showContent, setShowContent] = useState(false);

  const handleVideoEnd = () => {
    setShowContent(true); // Показываем контент после завершения видео
  };

  return (
    <div>
      {!showContent ? (
        <div className="preloader">
          <video
            src="/vvvv.mp4"
            autoPlay
            muted
            onEnded={handleVideoEnd}
            className="preloader-video"
          ></video>
        </div>
      ) : (
        <div className="main-content">
          <h1>Добро пожаловать на сайт!</h1>
          {/* Основной контент сайта */}
        </div>
      )}
    </div>
  );
};

export default Home;



