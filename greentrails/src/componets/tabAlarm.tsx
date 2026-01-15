import { useEffect, useRef, useState } from 'react';

// ============================================
// MULTIPLE TAB DETECTION CONFIGURATION
// Set this to false to allow multiple tabs
// ============================================
const PREVENT_MULTIPLE_TABS = true;
// ============================================

const MultipleTabDetector: React.FC = () => {
    const [isMultipleTabsOpen, setIsMultipleTabsOpen] = useState(false);
    const [showCloseInstructions, setShowCloseInstructions] = useState(false);
    const tabIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
    const heartbeatIntervalRef = useRef<number | null>(null);

    // Multiple tab detection
    useEffect(() => {
        if (!PREVENT_MULTIPLE_TABS) return;

        const tabId = tabIdRef.current;
        const STORAGE_KEY = 'greentrails_active_tabs';
        const HEARTBEAT_INTERVAL = 1000; // 1 second
        const TAB_TIMEOUT = 2000; // 2 seconds - reduced to minimize reload issues

        // Helper function to clean up and check tabs
        const updateTabsList = () => {
            const now = Date.now();
            const storedData = localStorage.getItem(STORAGE_KEY);
            let tabs: { [key: string]: number } = {};
            
            if (storedData) {
                try {
                    tabs = JSON.parse(storedData);
                    // Remove expired tabs first
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
            
            // Check if multiple tabs are open (after cleanup and adding current tab)
            const activeTabCount = Object.keys(tabs).length;
            return activeTabCount > 1;
        };

        // On initial load, do an aggressive cleanup first to remove any stale entries
        // This prevents false positives on page reload
        const now = Date.now();
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            try {
                const tabs = JSON.parse(storedData);
                // Be more aggressive on initial cleanup - remove anything older than 1.5 seconds
                const cleanedTabs: { [key: string]: number } = {};
                Object.keys(tabs).forEach(id => {
                    if (now - tabs[id] <= 1500) {
                        cleanedTabs[id] = tabs[id];
                    }
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedTabs));
            } catch (e) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
            }
        }

        // Now do the first check
        const isMultiple = updateTabsList();
        
        // Don't show warning immediately - wait to confirm it's genuinely multiple tabs
        if (isMultiple) {
            // Wait longer to be absolutely sure this isn't a reload scenario
            setTimeout(() => {
                const recheckMultiple = updateTabsList();
                setIsMultipleTabsOpen(recheckMultiple);
            }, 500);
        }

        // Set up heartbeat to keep tab alive
        heartbeatIntervalRef.current = window.setInterval(() => {
            const isMultiple = updateTabsList();
            setIsMultipleTabsOpen(isMultiple);
        }, HEARTBEAT_INTERVAL);

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
                zIndex: 99999,
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

export default MultipleTabDetector;
