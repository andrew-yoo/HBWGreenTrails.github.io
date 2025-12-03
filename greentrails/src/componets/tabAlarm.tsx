import { useEffect, useRef } from 'react';

// ============================================
// TAB ALARM CONFIGURATION
// Set this to false to disable the tab alarm
// ============================================
const TAB_ALARM_ENABLED = true;
// ============================================

// Alarm sound settings
const ALARM_FREQUENCY = 800;
const ALARM_VOLUME = 0.3;
const PULSE_FADE_DURATION = 0.25;
const PULSE_CYCLE_DURATION = 0.5;
const PULSE_INTERVAL_MS = 500;

// Voice message settings
const VOICE_MESSAGE = "Go back to Green Trails";
const VOICE_REPEAT_INTERVAL_MS = 3000;

// Type for webkit AudioContext (Safari compatibility)
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

const TabAlarm: React.FC = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const isPlayingRef = useRef<boolean>(false);
    const voiceIntervalRef = useRef<number | null>(null);

    const speakMessage = () => {
        if (!isPlayingRef.current) return;
        
        try {
            if ('speechSynthesis' in window) {
                // Cancel any pending speech before starting new one to avoid overlap
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(VOICE_MESSAGE);
                utterance.rate = 1.0;
                utterance.volume = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Failed to speak message:', error);
        }
    };

    const startAlarm = () => {
        if (!TAB_ALARM_ENABLED || isPlayingRef.current) return;
        
        try {
            // Create audio context if not exists
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
                if (AudioContextClass) {
                    audioContextRef.current = new AudioContextClass();
                }
            }
            
            if (!audioContextRef.current) return;
            
            const audioContext = audioContextRef.current;
            
            // Create oscillator for alarm sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(ALARM_FREQUENCY, audioContext.currentTime);
            
            // Create a pulsing alarm effect
            gainNode.gain.setValueAtTime(ALARM_VOLUME, audioContext.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            oscillatorRef.current = oscillator;
            gainNodeRef.current = gainNode;
            isPlayingRef.current = true;
            
            // Create pulsing effect
            const pulse = () => {
                if (!isPlayingRef.current || !gainNodeRef.current || !audioContextRef.current) return;
                
                const currentTime = audioContextRef.current.currentTime;
                gainNodeRef.current.gain.setValueAtTime(ALARM_VOLUME, currentTime);
                gainNodeRef.current.gain.linearRampToValueAtTime(0, currentTime + PULSE_FADE_DURATION);
                gainNodeRef.current.gain.setValueAtTime(ALARM_VOLUME, currentTime + PULSE_CYCLE_DURATION);
                
                if (isPlayingRef.current) {
                    setTimeout(pulse, PULSE_INTERVAL_MS);
                }
            };
            pulse();
            
            // Start voice message - speak immediately and repeat at intervals
            speakMessage();
            voiceIntervalRef.current = window.setInterval(speakMessage, VOICE_REPEAT_INTERVAL_MS);
        } catch (error) {
            console.error('Failed to start alarm:', error);
        }
    };

    const stopAlarm = () => {
        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            } catch (error) {
                // Ignore errors when stopping
            }
            oscillatorRef.current = null;
        }
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }
        // Stop voice message
        if (voiceIntervalRef.current) {
            clearInterval(voiceIntervalRef.current);
            voiceIntervalRef.current = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isPlayingRef.current = false;
    };

    useEffect(() => {
        if (!TAB_ALARM_ENABLED) return;
        
        const handleVisibilityChange = () => {
            if (document.hidden) {
                startAlarm();
            } else {
                stopAlarm();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            stopAlarm();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // This component doesn't render anything visible
    return null;
};

export default TabAlarm;
