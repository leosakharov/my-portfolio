import React, { useRef, useEffect, useState } from 'react';
import { useVisualizer } from 'react-audio-viz';

const AudioReactiveDrawing = ({ audioSrc }) => {
    const canvasRef = useRef(null);
    const audioRef = useRef(null);
    const animationRef = useRef(null);
    const penRef = useRef({
        x: 0,
        y: 0,
        angle: Math.random() * Math.PI * 2,
        speed: 1,
        history: []
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [analyzerData, setAnalyzerData] = useState(null);
    
    // Set up audio context and analyzer
    useEffect(() => {
        if (!audioRef.current) return;
        
        // Create audio context and analyzer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 512;
        
        // Connect audio element to analyzer
        const audioSource = audioContext.createMediaElementSource(audioRef.current);
        audioSource.connect(analyzer);
        analyzer.connect(audioContext.destination);
        
        // Create data array for frequency data
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        setAnalyzerData({ analyzer, dataArray });
        
        return () => {
            // Clean up
            audioSource.disconnect();
            analyzer.disconnect();
            audioContext.close();
        };
    }, [audioRef.current]);
    
    // Set up the canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const resizeCanvas = () => {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth || window.innerWidth;
            canvas.height = 400;
            
            // Reset pen position when canvas is resized
            penRef.current = {
                x: canvas.width / 2,
                y: canvas.height / 2,
                angle: Math.random() * Math.PI * 2,
                speed: 1,
                history: []
            };
            
            // Clear canvas
            ctx.fillStyle = '#f8f8f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Set drawing styles
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#222222';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);
    
    // Animation loop
    useEffect(() => {
        if (!canvasRef.current || !analyzerData || !isPlaying) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const { analyzer, dataArray } = analyzerData;
        const pen = penRef.current;
        
        // Animation function
        const draw = () => {
            // Get frequency data
            analyzer.getByteFrequencyData(dataArray);
            
            // Calculate energy in different frequency bands with better sensitivity
            const lowFreqEnergy = Array.from(dataArray.slice(0, 10)).reduce((sum, val) => sum + val, 0) / 10;
            const midFreqEnergy = Array.from(dataArray.slice(10, 50)).reduce((sum, val) => sum + val, 0) / 40;
            const highFreqEnergy = Array.from(dataArray.slice(50, 100)).reduce((sum, val) => sum + val, 0) / 50;
            
            // Adjust movement based on frequency bands - increased reactivity
            const amplitude = (lowFreqEnergy * 0.3 + midFreqEnergy * 0.6 + highFreqEnergy * 0.3) / 255;
            pen.speed = 1 + amplitude * 6; // Increased speed multiplier for more reactivity
            
            // Reduced random wobble significantly and make it proportional to amplitude
            // This makes the drawing smoother during quiet parts and more dynamic during louder parts
            pen.angle += (Math.random() - 0.5) * 0.02 * amplitude;
            
            // Apply smoothed movement
            pen.x += Math.cos(pen.angle) * pen.speed;
            pen.y += Math.sin(pen.angle) * pen.speed;
            
            // Keep within bounds and bounce softly with smoother transitions
            if (pen.x < 0 || pen.x > canvas.width) {
                pen.angle = Math.PI - pen.angle;
                // Move slightly away from the edge to prevent sticking
                pen.x = pen.x < 0 ? 2 : canvas.width - 2;
            }
            if (pen.y < 0 || pen.y > canvas.height) {
                pen.angle = -pen.angle;
                // Move slightly away from the edge to prevent sticking
                pen.y = pen.y < 0 ? 2 : canvas.height - 2;
            }
            
            // Add current position to history
            pen.history.push({ x: pen.x, y: pen.y });
            if (pen.history.length > 200) pen.history.shift();
            
            // Clear canvas with a slightly more transparent overlay for smoother trails
            ctx.fillStyle = 'rgba(248, 248, 240, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the line
            if (pen.history.length > 1) {
                ctx.beginPath();
                ctx.moveTo(pen.history[0].x, pen.history[0].y);
                
                for (let i = 1; i < pen.history.length; i++) {
                    const p = pen.history[i];
                    ctx.lineTo(p.x, p.y);
                }
                
                ctx.stroke();
            }
            
            // Continue animation
            animationRef.current = requestAnimationFrame(draw);
        };
        
        // Start animation
        animationRef.current = requestAnimationFrame(draw);
        
        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyzerData, isPlaying]);
    
    // Handle audio events
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        
        const handlePlay = () => {
            setIsPlaying(true);
            // Resume audio context if it was suspended
            if (analyzerData && analyzerData.analyzer.context.state === 'suspended') {
                analyzerData.analyzer.context.resume();
            }
        };
        
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);
        
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        
        return () => {
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [analyzerData]);
    
    return (
        <div className="audio-reactive-container">
            <h2>Audio Reactive Drawing</h2>
            <div className="canvas-container" style={{ width: '100%', position: 'relative' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
            </div>
            <div className="audio-controls" style={{ marginTop: '20px' }}>
                <audio ref={audioRef} src={audioSrc} controls />
                <p style={{ fontSize: '14px', color: '#666' }}>
                    {isPlaying ? 'Drawing is active - play with the audio to see the visualization!' : 'Press play to start the visualization'}
                </p>
            </div>
        </div>
    );
};

export default AudioReactiveDrawing;
