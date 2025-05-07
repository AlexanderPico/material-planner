/**
 * Wooden Texture Selector
 * Controls the wooden dial interface for selecting different wood textures
 */

(() => {
    // Constants
    const TEXTURE_PATH = './assets/wood/';
    // Order matches the physical layout of dots, clockwise from top
    const WOOD_TYPES = ['red_oak', 'white_oak', 'cherry', 'walnut', 'bamboo', 'beech', 'maple'];
    const ROTATION_PER_WOOD = 360 / WOOD_TYPES.length; // 360 / 7 wood types ≈ 51.43 degrees each
    
    // DOM elements
    const dial = document.querySelector('.dial');
    const dialContainer = document.querySelector('.dial-container');
    const woodName = document.querySelector('.wood-name');
    const dots = document.querySelectorAll('.texture-dot');
    
    // State
    let currentIndex = 0;
    let currentRotation = 0;
    
    // Expose current wood type globally
    window.getCurrentWoodType = () => WOOD_TYPES[currentIndex];
    window.getCurrentWoodPath = () => `${TEXTURE_PATH}${WOOD_TYPES[currentIndex]}.jpg`;
    
    // Position dots evenly around the dial in a circle
    function positionDots() {
        // Get dial dimensions
        const dialRect = dial.getBoundingClientRect();
        const dialRadius = dialRect.width / 2;
        const dotRadius = 8; // Half the dot width
        
        // Position each dot around the dial at equal angles
        dots.forEach((dot, index) => {
            // Calculate angle in radians (subtract PI/2 to start at top)
            const angle = (index * (2 * Math.PI / WOOD_TYPES.length)) - (Math.PI / 2);
            
            // Calculate position (distance from edge)
            const distance = dialRadius - dotRadius - 5; // 5px from edge
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            // Position dot relative to dial center
            dot.style.position = 'absolute';
            dot.style.left = `${dialRadius + x}px`;
            dot.style.top = `${dialRadius + y}px`;
            dot.style.transform = 'translate(-50%, -50%)';
        });
    }
    
    // Format wood type for display
    function formatWoodName(woodType) {
        // Convert underscored names to space-separated and capitalize each word
        return woodType.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // Initialize from localStorage
    function init() {
        const savedWood = localStorage.getItem('woodSpecies');
        if (savedWood) {
            // Handle legacy 'oak' value by converting to 'red_oak'
            const adjustedSavedWood = savedWood === 'oak' ? 'red_oak' : savedWood;
            currentIndex = WOOD_TYPES.indexOf(adjustedSavedWood);
            if (currentIndex === -1) currentIndex = 0; // Default to red_oak if not found
        }
        
        // Position dots when layout is ready
        setTimeout(positionDots, 0);
        
        updateDial(false); // Initialize without animation
        
        // Add event listeners
        dial.addEventListener('click', rotateClockwise);
        dial.addEventListener('contextmenu', e => {
            e.preventDefault();
            rotateCounterClockwise();
        });
        
        document.addEventListener('keydown', handleKeyPress);
        
        // Highlight the active dot
        updateActiveDot();
        
        // Dispatch event that wood selector is ready
        document.dispatchEvent(new CustomEvent('woodSelectorReady', {
            detail: { woodType: WOOD_TYPES[currentIndex] }
        }));
        
        // Reposition dots when window is resized
        window.addEventListener('resize', positionDots);
    }
    
    // Key press handler
    function handleKeyPress(e) {
        if (e.key === 'ArrowRight') {
            rotateClockwise();
        } else if (e.key === 'ArrowLeft') {
            rotateCounterClockwise();
        }
    }
    
    // Rotate clockwise to next wood type
    function rotateClockwise() {
        currentIndex = (currentIndex + 1) % WOOD_TYPES.length;
        updateDial();
    }
    
    // Rotate counter-clockwise to previous wood type
    function rotateCounterClockwise() {
        currentIndex = (currentIndex - 1 + WOOD_TYPES.length) % WOOD_TYPES.length;
        updateDial();
    }
    
    // Update the dial position and wood texture
    function updateDial(animate = true) {
        const woodType = WOOD_TYPES[currentIndex];
        
        // Calculate rotation to position the selected wood at the top (0 degrees)
        // We need to calculate the opposite rotation to move the selected wood to the top
        // Formula: negative index * angle per wood type
        currentRotation = -currentIndex * ROTATION_PER_WOOD;
        
        if (animate) {
            dial.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        } else {
            dial.style.transition = 'none';
        }
        dial.style.transform = `rotate(${currentRotation}deg)`;
        
        // Update wood name
        woodName.textContent = formatWoodName(woodType);
        
        // Set wood texture
        setWoodTexture(woodType);
        
        // Update active dot
        updateActiveDot();
        
        // Play woodblock sound if animate is true
        if (animate) {
            playWoodSound();
        }
        
        // Dispatch custom event for wood change
        document.dispatchEvent(new CustomEvent('woodTypeChanged', {
            detail: { woodType }
        }));
    }
    
    // Update the active dot
    function updateActiveDot() {
        // Remove active class from all dots
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Find the active dot by wood type
        const activeDot = document.querySelector(`.texture-dot[data-wood="${WOOD_TYPES[currentIndex]}"]`);
        
        if (activeDot) {
            // Add active class to highlight it
            activeDot.classList.add('active');
            
            // Log for debugging
            console.log(`Activated wood type: ${WOOD_TYPES[currentIndex]}`);
        } else {
            console.warn(`Could not find dot for wood type: ${WOOD_TYPES[currentIndex]}`);
        }
    }
    
    // Set the wood texture on the page
    function setWoodTexture(woodType) {
        // Set the CSS variable for the texture URL
        document.documentElement.style.setProperty(
            '--wood-url',
            `url(${TEXTURE_PATH}${woodType}.jpg)`
        );
        
        // Update elements that use the wood texture
        document.querySelectorAll('.block, .widget, .dial').forEach(element => {
            element.style.backgroundImage = `url(${TEXTURE_PATH}${woodType}.jpg)`;
        });
        
        // Update panel
        const panel = document.getElementById('panel');
        if (panel) {
            panel.style.backgroundImage = `url(${TEXTURE_PATH}${woodType}.jpg)`;
        }
        
        // Save preference
        localStorage.setItem('woodSpecies', woodType);
    }
    
    // Play a wooden sound effect when rotating the dial
    function playWoodSound() {
        if (!window.AudioContext) return;
        
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create oscillator for the wooden "click" sound
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = 200 + currentIndex * 30; // Different pitch for each wood type
            
            // Create gain node for volume envelope
            const gain = ctx.createGain();
            gain.gain.value = 0.3;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            
            // Connect and play
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.warn('Could not play wood sound:', e);
        }
    }
    
    // Helper function to capitalize the first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Initialize when the DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
})(); 