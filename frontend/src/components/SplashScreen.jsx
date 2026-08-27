import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 1: Fade in logo (0-500ms)
    const t1 = setTimeout(() => setStage(1), 200);
    // Stage 2: Reveal Text out of blur (800-2200ms)
    const t2 = setTimeout(() => setStage(2), 900);
    // Stage 3: Fade out everything (3000-3500ms)
    const t3 = setTimeout(() => setStage(3), 3000);
    // Complete
    const t4 = setTimeout(() => onComplete(), 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#050b14', // Slightly darker, deeper blue/black for cinematic feel
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
      opacity: stage === 3 ? 0 : 1,
      visibility: stage === 3 ? 'hidden' : 'visible'
    }}>
      
      {/* Deep Cinematic Glow Effect */}
      <div style={{
        position: 'absolute',
        width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(5,11,20,0) 60%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0
      }}></div>

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        // Slow cinematic zoom throughout the entire animation
        transform: stage >= 1 ? 'scale(1.05)' : 'scale(0.95)',
        transition: 'transform 4s cubic-bezier(0.25, 1, 0.5, 1)'
      }}>
        
        {/* Logo Icon */}
        <img 
          src="/logo-new.jpg" 
          alt="IN-TA Solutions" 
          style={{ 
            height: '90px', 
            borderRadius: '16px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), 0 0 20px rgba(59,130,246,0.2)',
            transform: stage >= 1 ? 'translateY(0)' : 'translateY(30px)',
            opacity: stage >= 1 ? 1 : 0,
            filter: stage >= 1 ? 'blur(0px)' : 'blur(10px)',
            transition: 'all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }} 
        />

        {/* Text Reveal Container */}
        <div style={{ 
          marginTop: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: '300', // Thinner font looks more cinematic/premium
            letterSpacing: '14px', // Extremely wide tracking
            margin: '0 -14px 0 0', // Offset the last letter's tracking
            background: 'linear-gradient(180deg, #ffffff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transform: stage >= 2 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            opacity: stage >= 2 ? 1 : 0,
            filter: stage >= 2 ? 'blur(0px)' : 'blur(12px)',
            transition: 'all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }}>
            IN-TA
          </h1>
        </div>

        {/* Subtitle Reveal */}
        <div style={{ 
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{
            color: '#64748b',
            fontSize: '0.85rem',
            letterSpacing: '6px',
            margin: '0 -6px 0 0',
            textTransform: 'uppercase',
            fontWeight: '500',
            transform: stage >= 2 ? 'translateY(0)' : 'translateY(10px)',
            opacity: stage >= 2 ? 1 : 0,
            filter: stage >= 2 ? 'blur(0px)' : 'blur(8px)',
            transition: 'all 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s' // 300ms delay after title
          }}>
            Financial Command Center
          </p>
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;
