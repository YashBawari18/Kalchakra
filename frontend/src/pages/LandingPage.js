import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef(null);
  const [audioError, setAudioError] = useState(false);

  const handleStart = () => {
    setHasStarted(true);
    if (audioRef.current) {
      audioRef.current.play().catch(e => {
        console.error("Audio play failed:", e);
        setAudioError(true);
      });
    }
  };

  return (
    <div className="landing-container">
      {!hasStarted && (
        <div className="entry-overlay" onClick={handleStart}>
          <div className="entry-content">
            <h2 className="flicker">DO YOU DARE TO ENTER?</h2>
            <p className="pulse">CLICK TO START THE RITUAL</p>
          </div>
        </div>
      )}

      <audio 
        ref={audioRef} 
        loop 
        src="https://www.chosic.com/wp-content/uploads/2021/07/The-Darkness-Ambient-Horror-Music.mp3"
      />

      <div className="vignette"></div>
      
      {/* Floating Ghost Asset */}
      <img src="/ghost.png" alt="Ghost" className="floating-ghost ghost-1" />
      <img src="/ghost.png" alt="Ghost" className="floating-ghost ghost-2" />

      <div className={`landing-content ${hasStarted ? 'fade-in' : 'hidden'}`}>
        <h1 className="horror-title flicker">KALCHAKRA</h1>
        <div className="ghost-visage"></div>
        <p className="horror-subtitle">A MAYA TRAP</p>
        
        <div className="horror-description">
          <p>The loop has restarted. The shadows are waiting.</p>
          <p>Will you escape the temporal maze or be lost in the void forever?</p>
        </div>

        <div className="entry-point">
          <button className="k-btn register-btn glitch-anim" onClick={() => navigate('/register')}>
            REGISTER TEAM
          </button>
          <p className="login-link" onClick={() => navigate('/login')}>
            Already registered? Login here
          </p>
        </div>
      </div>

      <style jsx>{`
        .entry-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: black;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .entry-content {
          text-align: center;
          color: var(--red-glow);
        }
        .entry-content h2 {
          font-family: var(--horror);
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .pulse {
          animation: pulse-red 2s infinite;
          font-family: var(--mono);
          letter-spacing: 0.3em;
        }
        .hidden {
          opacity: 0;
          pointer-events: none;
        }
        .floating-ghost {
          position: absolute;
          width: 300px;
          opacity: 0.2;
          pointer-events: none;
          z-index: 1;
          filter: blur(2px);
        }
        .ghost-1 {
          top: 10%;
          left: -50px;
          animation: float-ghost 20s infinite linear;
        }
        .ghost-2 {
          bottom: 10%;
          right: -50px;
          animation: float-ghost-alt 25s infinite linear;
          transform: scaleX(-1);
        }
        @keyframes float-ghost {
          0% { transform: translateY(0) translateX(0) rotate(5deg); }
          50% { transform: translateY(-50px) translateX(30px) rotate(-5deg); }
          100% { transform: translateY(0) translateX(0) rotate(5deg); }
        }
        @keyframes float-ghost-alt {
          0% { transform: scaleX(-1) translateY(0) translateX(0) rotate(-5deg); }
          50% { transform: scaleX(-1) translateY(50px) translateX(-40px) rotate(5deg); }
          100% { transform: scaleX(-1) translateY(0) translateX(0) rotate(-5deg); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
