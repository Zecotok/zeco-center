import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

let browser: Browser | null = null;
let page: Page | null = null;
let isLaunching = false;
let currentBrowserDataDir: string | null = null;
let socketHeartbeatInterval: NodeJS.Timeout | null = null;
let lastActivityTime = Date.now();

// Track activity to prevent idle disconnection
const updateActivity = () => {
  lastActivityTime = Date.now();
};

// Function to check if there's been any activity in the last 30 minutes
const isIdle = () => {
  const idleTime = (Date.now() - lastActivityTime) / (1000 * 60); // minutes
  return idleTime > 30; // 30 minutes idle threshold
};

// Clean up old session directories
const cleanupOldSessions = () => {
  try {
    const browserDataParentDir = path.join(process.cwd(), 'browser-data');
    if (!fs.existsSync(browserDataParentDir)) return;
    
    const items = fs.readdirSync(browserDataParentDir);
    
    // Find and remove session directories
    for (const item of items) {
      if (item.startsWith('session-')) {
        const sessionDir = path.join(browserDataParentDir, item);
        const stats = fs.statSync(sessionDir);
        
        // Check if directory is older than 1 hour
        const ageInHours = (Date.now() - stats.ctimeMs) / (1000 * 60 * 60);
        if (ageInHours > 1) {
          try {
            // Try to delete the SingletonLock file first
            const lockFile = path.join(sessionDir, 'SingletonLock');
            if (fs.existsSync(lockFile)) {
              fs.unlinkSync(lockFile);
            }
            
            // Try to remove directory recursively
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log(`Cleaned up old session directory: ${item}`);
          } catch (error) {
            console.error(`Error removing old session directory ${item}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
  }
};

// Create a fresh browser data directory for each session
const createBrowserDataDir = () => {
  try {
    // Clean up old sessions first
    cleanupOldSessions();
    
    // Create parent directory if it doesn't exist
    const browserDataParentDir = path.join(process.cwd(), 'browser-data');
    if (!fs.existsSync(browserDataParentDir)) {
      fs.mkdirSync(browserDataParentDir, { recursive: true });
    }
    
    // Create a unique subdirectory for this session
    const sessionDir = path.join(browserDataParentDir, `session-${uuidv4()}`);
    fs.mkdirSync(sessionDir, { recursive: true });
    console.log('Created browser session directory:', sessionDir);
    
    currentBrowserDataDir = sessionDir;
    return sessionDir;
  } catch (error) {
    console.error('Error creating browser data directory:', error);
    return null;
  }
};

// Clean up browser resources
const cleanupBrowser = async (force = false) => {
  try {
    // Only close browser if forced or if it's idle
    if (force || isIdle()) {
      if (browser) {
        console.log("Closing browser...");
        await browser.close().catch(err => console.error('Error closing browser:', err));
        browser = null;
        page = null;
      }
      
      // Remove the browser data directory
      if (currentBrowserDataDir && fs.existsSync(currentBrowserDataDir)) {
        try {
          // Try to delete the SingletonLock file if it exists
          const lockFile = path.join(currentBrowserDataDir, 'SingletonLock');
          if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
            console.log('Deleted SingletonLock file');
          }
          
          // Try to remove the entire directory
          fs.rmSync(currentBrowserDataDir, { recursive: true, force: true });
          console.log('Removed browser session directory');
        } catch (unlinkError) {
          console.error('Error cleaning up browser data directory:', unlinkError);
        }
        currentBrowserDataDir = null;
      }
      
      // Clear heartbeat interval
      if (socketHeartbeatInterval) {
        clearInterval(socketHeartbeatInterval);
        socketHeartbeatInterval = null;
      }
    } else {
      console.log("Browser still active, skipping cleanup");
    }
  } catch (error) {
    console.error('Error cleaning up browser:', error);
  }
};

// Take a screenshot of the entire browser window including UI
const takeFullScreenshot = async (page: Page): Promise<string> => {
  try {
    // Use Chrome DevTools Protocol to capture the full browser window
    const client = await page.target().createCDPSession();
    
    // Get browser window dimensions
    const { windowId } = await client.send('Browser.getWindowForTarget');
    const { bounds } = await client.send('Browser.getWindowBounds', { windowId });
    
    // Take screenshot of full window
    const { data } = await client.send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: 0,
        y: 0,
        width: bounds.width || 1366,
        height: bounds.height || 768,
        scale: 1
      },
      captureBeyondViewport: true,
      fromSurface: true
    });
    
    return data;
  } catch (error) {
    console.error('Error taking full screenshot:', error);
    // Fallback to regular screenshot
    const regularScreenshot = await page.screenshot({ 
      encoding: 'base64',
      fullPage: true
    });
    return regularScreenshot as string;
  }
};

const SocketHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (res.socket && (res.socket as any).server.io) {
    console.log('Socket already running');
    res.end();
    return;
  }

  console.log('Setting up Socket.IO server');
  const io = new SocketIOServer((res.socket as any).server, {
    pingTimeout: 60000, // 60 seconds ping timeout
    pingInterval: 25000, // 25 seconds ping interval
  });
  (res.socket as any).server.io = io;

  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);
    updateActivity();

    // Start heartbeat to keep connection alive
    if (socketHeartbeatInterval) {
      clearInterval(socketHeartbeatInterval);
    }
    
    socketHeartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { timestamp: Date.now() });
      } else if (isIdle()) {
        // If no client is connected and it's idle, clean up
        cleanupBrowser(false);
      }
    }, 30000); // Send heartbeat every 30 seconds

    // Function to initialize the browser with error handling
    const initBrowser = async () => {
      if (browser || isLaunching) {
        console.log('Browser already launching or running');
        return browser !== null;
      }
      
      try {
        isLaunching = true;
        console.log('Launching Puppeteer browser...');
        updateActivity();
        
        // Clean up any existing browser instance
        await cleanupBrowser(true);
        
        // Create a fresh data directory
        const userDataDir = createBrowserDataDir();
        if (!userDataDir) {
          throw new Error('Failed to create browser data directory');
        }
        
        // Launch the browser with headless: false to show the full browser UI
        browser = await puppeteer.launch({
          headless: false, // Show the full browser UI
          defaultViewport: null, // Allow the viewport to be resizable
          ignoreDefaultArgs: ['--enable-automation'], // Hide the automation message  
          channel: 'chrome', // Use Chrome instead of Chromium
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--window-size=1366,768', // Standard window size
            '--start-maximized',
            '--disable-infobars',
            '--disable-automation-controlled',
            '--disable-features=site-per-process,TranslateUI',
            '--enable-features=NetworkService',
            '--disable-extensions-except=',
            '--disable-component-extensions-with-background-pages'
          ],
          userDataDir,
          timeout: 30000 // 30 seconds timeout for browser launch
        });
        
        console.log('Browser launched successfully!');
        
        // Setup browser close handler
        browser.on('disconnected', () => {
          console.log('Browser disconnected...');
          browser = null;
          page = null;
        });
        
        // Get the first page
        const pages = await browser.pages();
        page = pages[0] || await browser.newPage();
        
        // Track URL changes and send to client
        if (page) {
          page.on('framenavigated', async frame => {
            if (frame === page?.mainFrame()) {
              const currentUrl = page.url();
              console.log('URL changed:', currentUrl);
              socket.emit('urlChanged', { url: currentUrl });
            }
          });
        }
        
        // Ensure the browser window is actually visible
        // This is necessary for showing the URL bar and other browser UI
        const browserWSEndpoint = browser.wsEndpoint();
        console.log('Browser running at:', browserWSEndpoint);

        // Navigate to a default page
        await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
        console.log('Navigated to Google');
        
        // Wait for the browser UI to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // Take a screenshot of the entire browser window including the UI
          const screenshot = await takeFullScreenshot(page);
          socket.emit('screenshot', screenshot);
          console.log('Initial screenshot sent');
        } catch (screenshotError) {
          console.error('Initial screenshot error:', screenshotError);
        }
        
        return true;
      } catch (error: any) {
        console.error('Browser launch error:', error.message || error);
        socket.emit('error', { message: `Failed to launch browser: ${error.message || 'Unknown error'}` });
        
        // Clean up if launch fails
        await cleanupBrowser(true);
        return false;
      } finally {
        isLaunching = false;
      }
    };

    socket.emit('status', { message: 'Connected to server' });

    // Initialize browser when client connects
    console.log('Initializing browser');
    const browserInitialized = await initBrowser();
    console.log('Browser initialization result:', browserInitialized);

    // Heartbeat from client
    socket.on('heartbeat-response', () => {
      updateActivity();
    });

    // Navigate to a URL
    socket.on('navigate', async (url) => {
      console.log('Navigate request:', url);
      updateActivity();
      
      if (!browser || !page) {
        console.log('Browser not available, initializing...');
        const success = await initBrowser();
        if (!success || !page) {
          console.log('Failed to initialize browser');
          socket.emit('error', { message: 'Browser not available' });
          return;
        }
      }
      
      try {
        console.log(`Navigating to ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('Navigation complete, taking screenshot');
        
        // Emit the current URL after navigation
        const currentUrl = page.url();
        socket.emit('urlChanged', { url: currentUrl });
        
        // Allow time for the UI to update
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const screenshot = await takeFullScreenshot(page);
        socket.emit('screenshot', screenshot);
      } catch (error: any) {
        console.error('Navigation error:', error);
        socket.emit('error', { message: `Failed to navigate: ${error.message || 'Unknown error'}` });
      }
    });

    // Click at coordinates
    socket.on('click', async ({ x, y }) => {
      console.log(`Click request at (${x}, ${y})`);
      updateActivity();
      
      if (!page) {
        socket.emit('error', { message: 'Browser not available' });
        return;
      }
      
      try {
        await page.mouse.click(x, y);
        
        // Wait a moment for any UI updates
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const screenshot = await takeFullScreenshot(page);
        socket.emit('screenshot', screenshot);
      } catch (error) {
        console.error('Click error:', error);
        socket.emit('error', { message: 'Failed to click' });
      }
    });

    // Type text
    socket.on('type', async (text) => {
      console.log('Type request:', text);
      updateActivity();
      
      if (!page) {
        socket.emit('error', { message: 'Browser not available' });
        return;
      }
      
      try {
        await page.keyboard.type(text);
        
        // Wait a moment for any UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const screenshot = await takeFullScreenshot(page);
        socket.emit('screenshot', screenshot);
      } catch (error) {
        console.error('Type error:', error);
        socket.emit('error', { message: 'Failed to type' });
      }
    });

    // Press a key
    socket.on('keypress', async (key) => {
      console.log('Keypress request:', key);
      updateActivity();
      
      if (!page) {
        socket.emit('error', { message: 'Browser not available' });
        return;
      }
      
      try {
        // Use a more reliable method for key presses
        // For special keys, we need special handling
        if (key === 'Enter') {
          await page.keyboard.press('Enter');
        } else if (key === 'Tab') {
          await page.keyboard.press('Tab');
        } else if (key === 'Escape') {
          await page.keyboard.press('Escape');
        } else if (key === 'Backspace') {
          await page.keyboard.press('Backspace');
        } else if (key === 'ArrowUp') {
          await page.keyboard.press('ArrowUp');
        } else if (key === 'ArrowDown') {
          await page.keyboard.press('ArrowDown');
        } else if (key === 'ArrowLeft') {
          await page.keyboard.press('ArrowLeft');
        } else if (key === 'ArrowRight') {
          await page.keyboard.press('ArrowRight');
        } else {
          // For normal character keys
          await page.keyboard.press(key);
        }
        
        // Use setTimeout to wait for UI updates
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const screenshot = await takeFullScreenshot(page);
        socket.emit('screenshot', screenshot);
      } catch (error) {
        console.error('Keypress error:', error);
        socket.emit('error', { message: `Failed to press key: ${key}` });
      }
    });

    // Get a new screenshot
    socket.on('getScreenshot', async () => {
      console.log('Screenshot request');
      updateActivity();
      
      if (!page) {
        socket.emit('error', { message: 'Browser not available' });
        return;
      }
      
      try {
        const screenshot = await takeFullScreenshot(page);
        socket.emit('screenshot', screenshot);
      } catch (error) {
        console.error('Screenshot error:', error);
        socket.emit('error', { message: 'Failed to take screenshot' });
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      // Don't close browser immediately, keep it for potential reconnections
      // It will be closed by the heartbeat check if idle for too long
    });
  });

  console.log('Socket handler initialized');
  res.end();
};

// Disable body parsing, we don't need it for this API
export const config = {
  api: {
    bodyParser: false,
  },
};

export default SocketHandler; 