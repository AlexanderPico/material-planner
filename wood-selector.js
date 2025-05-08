/**
 * Wooden Texture Selector
 * Controls the wood texture selection interface
 */

(() => {
    // Constants
    const TEXTURE_PATH = './assets/wood/';
    // Order alphabetically for easier maintenance
    const WOOD_TYPES = ['bamboo', 'beech', 'cherry', 'maple', 'oak', 'walnut'];
    
    // DOM elements
    const textureRing = document.querySelector('.texture-ring');
    const woodName = document.querySelector('.wood-name');
    const dots = document.querySelectorAll('.texture-dot');
    
    // State
    let currentIndex = 0;
    
    // Expose current wood type globally
    window.getCurrentWoodType = () => WOOD_TYPES[currentIndex];
    window.getCurrentWoodPath = () => `${TEXTURE_PATH}${WOOD_TYPES[currentIndex]}.jpg`;
    
    // Position dots evenly around the ring
    function positionDots() {
        // Get ring dimensions
        const ringRect = textureRing.getBoundingClientRect();
        const ringRadius = ringRect.width / 2;
        const dotRadius = 20; // Half the dot width (40px total)
        
        // Use a smaller circle to position dots more tightly
        // Reduced to 0.5 for tighter grouping and overlapping effect
        const circleRadius = ringRadius * 0.5; 
        
        // Position each dot around the ring at equal angles
        dots.forEach((dot, index) => {
            // Calculate angle in radians (subtract PI/2 to start at top)
            const angle = (index * (2 * Math.PI / WOOD_TYPES.length)) - (Math.PI / 2);
            
            // Calculate position using the adjusted circle radius
            const x = Math.cos(angle) * circleRadius;
            const y = Math.sin(angle) * circleRadius;
            
            // Calculate z-index to create proper stacking order (later dots on top)
            // This creates the illusion of a stack of coasters
            const zIndex = 5 + index;
            dot.style.zIndex = index === currentIndex ? 20 : zIndex;
            
            // Position dot relative to ring center
            // We need to adjust for the dot's size to center it precisely
            dot.style.left = `${ringRadius + x - dotRadius}px`;
            dot.style.top = `${ringRadius + y - dotRadius}px`;
            
            // Apply a slight rotation based on position to enhance 3D appearance
            // This creates the effect of dots facing the center
            const rotationDeg = Math.atan2(y, x) * (180 / Math.PI) + 90;
            // Add slight offset for each dot to create staggered appearance
            const offsetZ = index * 1; // 1px offset per dot for subtle stacking
            dot.style.transform = `rotate(${rotationDeg}deg) translateZ(${offsetZ}px)`;
            
            // Set data attribute for wood type to ensure it matches the array
            dot.setAttribute('data-wood', WOOD_TYPES[index]);
            
            // Set background image directly to ensure it matches
            dot.style.backgroundImage = `url(${TEXTURE_PATH}${WOOD_TYPES[index]}.jpg)`;
            
            // Add click handler to each dot
            dot.addEventListener('click', () => selectWoodType(index));
        });
        
        // Update active dot after positioning
        updateActiveDot();
    }
    
    // Select a wood type by index
    function selectWoodType(index) {
        if (index === currentIndex) return;
        
        currentIndex = index;
        
        // Update wood name
        woodName.textContent = formatWoodName(WOOD_TYPES[currentIndex]);
        
        // Set wood texture
        setWoodTexture(WOOD_TYPES[currentIndex]);
        
        // Update active dot
        updateActiveDot();
        
        // Play sound
        playWoodSound();
    }
    
    // Format wood type for display
    function formatWoodName(woodType) {
        // Capitalize the first letter of the wood type
        return woodType.charAt(0).toUpperCase() + woodType.slice(1);
    }
    
    // Initialize from localStorage
    function init() {
        const savedWood = localStorage.getItem('woodSpecies');
        if (savedWood) {
            const savedIndex = WOOD_TYPES.indexOf(savedWood);
            if (savedIndex !== -1) {
                currentIndex = savedIndex;
            }
        }
        
        // Position dots after a small delay to ensure DOM is ready
        setTimeout(positionDots, 100);
        
        // Initialize with the current wood type
        woodName.textContent = formatWoodName(WOOD_TYPES[currentIndex]);
        setWoodTexture(WOOD_TYPES[currentIndex]);
        
        // Add keyboard handlers for arrow keys
        document.addEventListener('keydown', handleKeyPress);
        
        // Dispatch event that wood selector is ready
        document.dispatchEvent(new CustomEvent('woodSelectorReady', {
            detail: { woodType: WOOD_TYPES[currentIndex] }
        }));
        
        // Reposition dots when window is resized
        window.addEventListener('resize', positionDots);
    }
    
    // Key press handler for arrow keys
    function handleKeyPress(e) {
        if (e.key === 'ArrowRight') {
            selectWoodType((currentIndex + 1) % WOOD_TYPES.length);
        } else if (e.key === 'ArrowLeft') {
            selectWoodType((currentIndex - 1 + WOOD_TYPES.length) % WOOD_TYPES.length);
        }
    }
    
    // Update the active dot
    function updateActiveDot() {
        // Remove active class from all dots
        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            
            // Reset the transform for non-active dots to keep proper positioning
            if (index !== currentIndex) {
                const angle = (index * (2 * Math.PI / WOOD_TYPES.length)) - (Math.PI / 2);
                const x = Math.cos(angle);
                const y = Math.sin(angle);
                const rotationDeg = Math.atan2(y, x) * (180 / Math.PI) + 90;
                const offsetZ = index * 1; // maintain the staggered appearance
                dot.style.transform = `rotate(${rotationDeg}deg) translateZ(${offsetZ}px)`;
                // Make sure z-index is set correctly
                dot.style.zIndex = 5 + index;
            }
        });
        
        // Find the active dot by wood type
        const activeDot = document.querySelector(`.texture-dot[data-wood="${WOOD_TYPES[currentIndex]}"]`);
        
        if (activeDot) {
            // Add active class to highlight it
            activeDot.classList.add('active');
            
            // Enhance 3D effect for active dot - lift it higher
            const index = currentIndex;
            const angle = (index * (2 * Math.PI / WOOD_TYPES.length)) - (Math.PI / 2);
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            const rotationDeg = Math.atan2(y, x) * (180 / Math.PI) + 90;
            // Lift the active dot higher (10px) and scale it for emphasis
            activeDot.style.transform = `rotate(${rotationDeg}deg) translateZ(10px) scale(1.1)`;
            // Ensure active dot is always on top
            activeDot.style.zIndex = 20;
            
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
        document.querySelectorAll('.block, .widget').forEach(element => {
            element.style.backgroundImage = `url(${TEXTURE_PATH}${woodType}.jpg)`;
        });
        
        // Update panel
        const panel = document.getElementById('panel');
        if (panel) {
            panel.style.backgroundImage = `url(${TEXTURE_PATH}${woodType}.jpg)`;
        }
        
        // Save preference
        localStorage.setItem('woodSpecies', woodType);
        
        // Dispatch custom event for wood change
        document.dispatchEvent(new CustomEvent('woodTypeChanged', {
            detail: { woodType }
        }));
    }
    
    // Play a wooden sound effect
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
    
    // Initialize when the DOM is loaded
    document.addEventListener('DOMContentLoaded', init);
})(); 