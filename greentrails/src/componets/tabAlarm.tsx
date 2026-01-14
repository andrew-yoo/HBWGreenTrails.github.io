import { useEffect, useRef, useState } from 'react';

// ============================================
// TAB ALARM CONFIGURATION
// Set this to false to disable the tab alarm
// ============================================
const TAB_ALARM_ENABLED = true;
// ============================================

// ============================================
// MULTIPLE TAB DETECTION CONFIGURATION
// Set this to false to allow multiple tabs
// ============================================
const PREVENT_MULTIPLE_TABS = true;
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
    const [isMultipleTabsOpen, setIsMultipleTabsOpen] = useState(false);
    const [showCloseInstructions, setShowCloseInstructions] = useState(false);
    const tabIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
    const heartbeatIntervalRef = useRef<number | null>(null);

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

    // Multiple tab detection
    useEffect(() => {
        if (!PREVENT_MULTIPLE_TABS) return;

        const tabId = tabIdRef.current;
        const STORAGE_KEY = 'greentrails_active_tabs';
        const HEARTBEAT_INTERVAL = 1000; // 1 second
        const TAB_TIMEOUT = 3000; // 3 seconds

        // Initialize storage
        const updateTabsList = () => {
            const now = Date.now();
            const storedData = localStorage.getItem(STORAGE_KEY);
            let tabs: { [key: string]: number } = {};
            
            if (storedData) {
                try {
                    tabs = JSON.parse(storedData);
                    // Remove expired tabs
                    Object.keys(tabs).forEach(id => {
                        if (now - tabs[id] > TAB_TIMEOUT) {
                            delete tabs[id];
                        }
                    });
                } catch (e) {
                    tabs = {};
                }
            }
            
            // Add current tab
            tabs[tabId] = now;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
            
            // Check if multiple tabs are open
            const activeTabCount = Object.keys(tabs).length;
            setIsMultipleTabsOpen(activeTabCount > 1);
        };

        // Initial check
        updateTabsList();

        // Set up heartbeat to keep tab alive
        heartbeatIntervalRef.current = window.setInterval(updateTabsList, HEARTBEAT_INTERVAL);

        // Handle storage events from other tabs
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                const now = Date.now();
                const storedData = e.newValue;
                if (storedData) {
                    try {
                        const tabs = JSON.parse(storedData);
                        const activeTabs = Object.keys(tabs).filter(id => now - tabs[id] <= TAB_TIMEOUT);
                        setIsMultipleTabsOpen(activeTabs.length > 1);
                    } catch (error) {
                        console.error('Error parsing tabs data:', error);
                    }
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Clean up on unmount
        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            window.removeEventListener('storage', handleStorageChange);
            
            // Remove this tab from the list
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                try {
                    const tabs = JSON.parse(storedData);
                    delete tabs[tabId];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        };
    }, []);

    // Render warning if multiple tabs are open
    if (isMultipleTabsOpen && PREVENT_MULTIPLE_TABS) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
            }}>
                <h1 style={{ fontSize: '3em', marginBottom: '20px', color: '#4CAF50' }}>
                    ⚠️ Multiple Tabs Detected
                </h1>
                <p style={{ fontSize: '1.5em', marginBottom: '20px', maxWidth: '600px' }}>
                    You can only have one Green Trails tab open at a time.
                </p>
                <p style={{ fontSize: '1.2em', marginBottom: '30px', maxWidth: '600px' }}>
                    Please close this tab and return to your other Green Trails tab.
                </p>
                {!showCloseInstructions ? (
                    <button
                        onClick={() => {
                            // Try to close the tab
                            window.close();
                            // Show instructions after a short delay if tab is still open
                            setTimeout(() => setShowCloseInstructions(true), 500);
                        }}
                        style={{
                            padding: '15px 30px',
                            fontSize: '1.2em',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
                    >
                        Close This Tab
                    </button>
                ) : (
                    <p style={{ 
                        fontSize: '1.1em', 
                        maxWidth: '600px',
                        padding: '15px 30px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '5px'
                    }}>
                        Please manually close this tab using:<br/>
                        <strong>Ctrl+W</strong> (Windows/Linux) or <strong>Cmd+W</strong> (Mac)<br/>
                        or click the <strong>X</strong> button on the tab.
                    </p>
                )}
            </div>
        );
    }

    // This component doesn't render anything visible when tabs are OK
    return null;
};

export default TabAlarm;
