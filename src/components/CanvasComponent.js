import React, { useEffect, useRef, useState } from 'react';
import ambientAudio from '../assets/audio/NLK.mp3';

const CanvasComponent = () => {
    const canvasRef = useRef(null);
    const audioRef = useRef(null);
    const animationRef = useRef(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(false);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Add touch interaction variables
        let lastTouchX = null;
        let lastTouchY = null;
        let touchActive = false;

        // Set background color to off-white
        ctx.fillStyle = '#f8f8f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add signature in bottom left corner on initial load with responsive font size
        const isMobile = window.innerWidth < 768;
        ctx.font = `${isMobile ? '12px' : '14px'} "Diatype Variable", sans-serif`;
        ctx.fillStyle = '#222222';
        ctx.globalAlpha = 0.85;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Web and music by Leo Sakharov', 20, canvas.height - 20);

        // Create audio element but don't play it yet
        const audio = new Audio(ambientAudio);
        audioRef.current = audio;
        
        // Just mark when audio is loaded
        audio.addEventListener('canplaythrough', () => {
            setAudioLoaded(true);
        }, { once: true });

        // Set up initial parameters
        let centerX = canvas.width / 2;
        let centerY = canvas.height / 2;
        
        // Line style - pen-like appearance
        ctx.strokeStyle = '#222222'; // Black pen color
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;

        // Handle window resize
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            ctx.fillStyle = '#f8f8f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
            // Reset drawing style after resize
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.globalAlpha = 0.8;
            
            // Add signature in bottom left corner after resize with responsive font size
            const isMobile = window.innerWidth < 768;
            ctx.font = `${isMobile ? '12px' : '14px'} "Diatype Variable", sans-serif`;
            ctx.fillStyle = '#222222';
            ctx.globalAlpha = 0.85;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Web and music by Leo Sakharov', 20, canvas.height - 20);
        };

        // Handle touch events for mobile interaction
        const handleTouchStart = (e) => {
            if (!audioPlaying) return;
            const touch = e.touches[0];
            lastTouchX = touch.clientX;
            lastTouchY = touch.clientY;
            touchActive = true;
            
            // Draw a small circle at touch point
            ctx.beginPath();
            ctx.arc(lastTouchX, lastTouchY, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#222222';
            ctx.fill();
        };
        
        const handleTouchMove = (e) => {
            if (!touchActive || !audioPlaying) return;
            e.preventDefault(); // Prevent scrolling while drawing
            
            const touch = e.touches[0];
            const currentX = touch.clientX;
            const currentY = touch.clientY;
            
            // Draw a line from last position to current
            ctx.beginPath();
            ctx.moveTo(lastTouchX, lastTouchY);
            ctx.lineTo(currentX, currentY);
            ctx.strokeStyle = '#222222';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            lastTouchX = currentX;
            lastTouchY = currentY;
        };
        
        const handleTouchEnd = () => {
            touchActive = false;
            lastTouchX = null;
            lastTouchY = null;
        };
        
        // Add touch event listeners
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('touchcancel', handleTouchEnd);
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('touchcancel', handleTouchEnd);
            cancelAnimationFrame(animationRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Function to start audio and visualization when user clicks play button
    const startAudio = () => {
        const audio = audioRef.current;
        if (!audio) return;
        
        // Create audio context after user interaction
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        const source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        // Use a smaller FFT size on mobile for better performance
        const isMobile = window.innerWidth < 768;
        analyser.fftSize = isMobile ? 512 : 1024;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;
        
        // Start playing the audio
        audio.play().then(() => {
            setAudioPlaying(true);
            
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Set up a single control point for the pen-like drawing
            let penPosition = {
                x: canvas.width / 2,
                y: canvas.height / 2,
                prevX: canvas.width / 2,
                prevY: canvas.height / 2
            };
            
            // Function to get average amplitude in a frequency range
            function getAverageAmplitude(dataArray, startBin, endBin) {
                let sum = 0;
                for (let i = startBin; i < endBin; i++) {
                    sum += dataArray[i];
                }
                return sum / (endBin - startBin);
            }
            
            // Track time for smoother transitions
            let lastTime = Date.now();
            
            // Add noise factors that change over time
            let noiseFactor = 1.0;
            let noiseChangeRate = 0.5 + Math.random() * 0.5; // How quickly noise changes
            let noiseDirection = 1; // Whether noise is increasing or decreasing
            let noiseChangeTimer = 0; // Timer for noise changes
            let nextNoiseTarget = 0.5 + Math.random() * 1.5; // Target noise level
            
            // Set up the drawing function that uses audio data
            function draw() {
                const currentTime = Date.now();
                const deltaTime = (currentTime - lastTime) / 1000; // Time in seconds
                lastTime = currentTime;
                
                // Update noise factor over time
                noiseChangeTimer += deltaTime;
                if (noiseChangeTimer >= noiseChangeRate) {
                    // Set a new target noise level and change rate
                    nextNoiseTarget = 0.5 + Math.random() * 1.5;
                    noiseChangeRate = 0.5 + Math.random() * 1.5;
                    noiseChangeTimer = 0;
                }
                
                // Smoothly interpolate current noise factor toward target
                noiseFactor += (nextNoiseTarget - noiseFactor) * deltaTime * 1.5;
                
                // Add some small random fluctuations to the noise factor
                noiseFactor += (Math.random() - 0.5) * 0.1 * deltaTime;
                
                // Keep noise factor within reasonable bounds
                noiseFactor = Math.max(0.2, Math.min(noiseFactor, 2.5));
                
                // Don't clear the canvas to leave a trace
                analyser.getByteFrequencyData(dataArray);
                
                // Analyze different frequency ranges for more musical responsiveness
                // Adjusted frequency ranges for better sensitivity
                const bassRange = getAverageAmplitude(dataArray, 0, 10) / 255;
                const midRange = getAverageAmplitude(dataArray, 10, 100) / 255;
                const highRange = getAverageAmplitude(dataArray, 100, 200) / 255;
                
                // Overall energy of the music - increased weight on mid and high frequencies for more reactivity
                const musicEnergy = (bassRange * 3 + midRange * 2.5 + highRange * 1.5);
                
                // Save previous position
                penPosition.prevX = penPosition.x;
                penPosition.prevY = penPosition.y;
                
                // Calculate new position with smoother movement
                // Use perlin-like noise influenced by music for organic movement
                const angle = Date.now() * 0.01 * (0.1 + musicEnergy * 0.3); // Increased music influence
                const radius = 0.5 + musicEnergy * 3; // Increased radius for more reactivity
                
                // Move the pen position with more responsiveness to music
                penPosition.x += Math.cos(angle) * radius * deltaTime * 20;
                penPosition.y += Math.sin(angle) * radius * deltaTime * 20;
                
                // Add random influence scaled by the dynamic noise factor
                // Scale random movement by bass energy and current noise factor
                // Using (Math.random() - 0.5) to allow movement in both directions
                penPosition.x += (Math.random() - 0.5) * 2 * bassRange * noiseFactor;
                penPosition.y += (Math.random() - 0.5) * 2 * bassRange * noiseFactor;
                
                // Keep the pen within canvas bounds with smoother edge handling
                if (penPosition.x < 0) penPosition.x = 2;
                if (penPosition.x > canvas.width) penPosition.x = canvas.width - 2;
                if (penPosition.y < 0) penPosition.y = 2;
                if (penPosition.y > canvas.height) penPosition.y = canvas.height - 2;
                
                // Only draw if the pen has moved a minimum distance
                // This creates a more deliberate, slower drawing
                const distance = Math.sqrt(
                    Math.pow(penPosition.x - penPosition.prevX, 2) + 
                    Math.pow(penPosition.y - penPosition.prevY, 2)
                );
                
                if (distance > 0.2) {
                    // Set up line style for a pen-like appearance
                    ctx.strokeStyle = '#222222'; // Black pen color
                    ctx.lineWidth = 1.5 + bassRange * 1.5; // Increased thickness variation for more reactivity
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    
                    // Set opacity based on music energy - more reactive to audio
                    ctx.globalAlpha = 0.6 + musicEnergy * 0.4; // Increased reactivity
                    
                    // Rarely draw a straight line in a random direction
                    // Low chance, with slight music energy influence
                    const straightLineChance = 0.0002 + (musicEnergy * 0.0005);
                    
                    if (Math.random() < straightLineChance) {
                        // Save current position
                        const startX = penPosition.x;
                        const startY = penPosition.y;
                        
                        // Calculate a random angle and length for the straight line
                        const straightLineAngle = Math.random() * Math.PI * 2;
                        const straightLineLength = 20 + Math.random() * 80 * (1 + musicEnergy);
                        
                        // Calculate end point of straight line
                        const endX = startX + Math.cos(straightLineAngle) * straightLineLength;
                        const endY = startY + Math.sin(straightLineAngle) * straightLineLength;
                        
                        // Draw the straight line
                        ctx.beginPath();
                        ctx.moveTo(startX, startY);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                        
                        // Update pen position to the end of the straight line
                        penPosition.prevX = penPosition.x;
                        penPosition.prevY = penPosition.y;
                        penPosition.x = endX;
                        penPosition.y = endY;
                    } else {
                        // Draw a line from previous position to current
                        ctx.beginPath();
                        ctx.moveTo(penPosition.prevX, penPosition.prevY);
                        
                        // For a more organic pen-like feel, use a subtle bezier curve
                        // with dynamic randomness based on the current noise factor
                        const controlX = penPosition.prevX + (penPosition.x - penPosition.prevX) * 0.5 + 
                            (Math.random() - 0.5) * 0.1 * musicEnergy * noiseFactor;
                        const controlY = penPosition.prevY + (penPosition.y - penPosition.prevY) * 0.5 + 
                            0.1 * musicEnergy * (1 + (Math.random() - 0.5) * noiseFactor * 0.5);
                        ctx.quadraticCurveTo(controlX, controlY, penPosition.x, penPosition.y);
                        ctx.stroke();
                    }
                }
                
                // Add signature in bottom left corner with responsive font size
                const isMobile = window.innerWidth < 768;
                ctx.font = `${isMobile ? '12px' : '14px'} "Diatype Variable", sans-serif`;
                ctx.fillStyle = '#222222';
                ctx.globalAlpha = 0.85;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                ctx.fillText('Web and music by Leo Sakharov', 20, canvas.height - 20);
                
                // Draw audio timeline in bottom right corner with responsive width
                const isMobileTimeline = window.innerWidth < 768;
                const timelineWidth = isMobileTimeline ? 120 : 200; // Width of timeline - smaller on mobile
                const timelineHeight = 2; // Height of timeline
                const timelinePadding = 20; // Padding from edge
                const timelineY = canvas.height - timelinePadding - 5; // Y position
                
                // Calculate progress
                const progress = audio.currentTime / audio.duration;
                
                // Draw timeline background
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#222222';
                ctx.lineWidth = timelineHeight;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(canvas.width - timelinePadding - timelineWidth, timelineY);
                ctx.lineTo(canvas.width - timelinePadding, timelineY);
                ctx.stroke();
                
                // Draw progress
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.moveTo(canvas.width - timelinePadding - timelineWidth, timelineY);
                ctx.lineTo(canvas.width - timelinePadding - timelineWidth + (timelineWidth * progress), timelineY);
                ctx.stroke();
                
                // Add some noise to the timeline based on current music energy and noise factor
                // Reduce complexity on mobile
                const isMobileDevice = window.innerWidth < 768;
                if (musicEnergy > 0.2) {
                    const timelineNoiseCount = Math.floor(isMobileDevice ? 
                        (3 + musicEnergy * 5) : // Fewer noise lines on mobile
                        (5 + musicEnergy * 10)); // More noise lines on desktop
                    ctx.globalAlpha = 0.4 * musicEnergy;
                    ctx.lineWidth = 1;
                    
                    for (let i = 0; i < timelineNoiseCount; i++) {
                        const noiseX = canvas.width - timelinePadding - timelineWidth + 
                            (Math.random() * timelineWidth * progress);
                        const noiseY = timelineY + (Math.random() - 0.5) * 6 * noiseFactor;
                        
                        ctx.beginPath();
                        ctx.moveTo(noiseX, timelineY);
                        ctx.lineTo(noiseX, noiseY);
                        ctx.stroke();
                    }
                }
                
                // Keep drawing
                animationRef.current = requestAnimationFrame(draw);
            }
            
            // Start the animation
            draw();
        }).catch(error => {
            console.error('Audio play error:', error);
        });
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef}></canvas>
            {!audioPlaying && audioLoaded && (
                <div 
                    onClick={startAudio}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {/* Play button circle */}
                    <div style={{
                        width: window.innerWidth < 768 ? '80px' : '100px',
                        height: window.innerWidth < 768 ? '80px' : '100px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(34, 34, 34, 0.9)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '15px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        transform: 'scale(1)',
                        ':hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
                        }
                    }}>
                        {/* Play triangle */}
                        <div style={{
                            width: 0,
                            height: 0,
                            borderTop: window.innerWidth < 768 ? '15px solid transparent' : '20px solid transparent',
                            borderBottom: window.innerWidth < 768 ? '15px solid transparent' : '20px solid transparent',
                            borderLeft: window.innerWidth < 768 ? '25px solid #f8f8f0' : '32px solid #f8f8f0',
                            marginLeft: '5px' // Offset slightly to center visually
                        }}/>
                    </div>
                    
                    {/* Text label */}
                    <div style={{
                        fontFamily: '"Diatype Variable", sans-serif',
                        fontSize: window.innerWidth < 768 ? '16px' : '18px',
                        color: '#222222',
                        fontWeight: '500',
                        letterSpacing: '0.5px',
                        textAlign: 'center',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(248, 248, 240, 0.85)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        Start Experience
                    </div>
                </div>
            )}
        </div>
    );
};

export default CanvasComponent;
