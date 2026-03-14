'use strict';

/**
 * OxygenBar - A continuous bar with oxygen slots representing available moves
 * 
 * Features:
 * - Single continuous bar containing oxygen slots
 * - Number of slots = number of allowed moves
 * - Slots sized to fill the bar length
 * - Supports horizontal (portrait) and vertical (landscape) orientations
 * - Compact, clean visual style inspired by SpaceSlider
 */
export class OxygenBar extends Phaser.GameObjects.Container {
    constructor(scene, maxSlots, options = {}) {
        super(scene, 0, 0);
        scene.add.existing(this);
        
        this.maxSlots = Math.max(0, Number(maxSlots) || 0);
        this.currentSlots = this.maxSlots;
        
        // Simple fade state: which slot is fading and its alpha
        this.fadingSlotIndex = -1;
        this.fadingAlpha = 1;
        this.fadeTween = null;
        
        // Configuration options
        this.options = {
            // Bar dimensions (will be set via setBarSize)
            barWidth: 200,
            barHeight: 24,
            
            // Orientation
            orientation: 'horizontal', // 'horizontal' or 'vertical'
            
            // Colors
            colorFull: 0x4a90e2,       // Soft blue (filled) - matches game theme
            colorEmpty: 0x1a2332,      // Dark blue-grey (empty)
            trackColor: 0x0a1525,      // Darker blue-black track
            trackBorderColor: 0x4a90e2, // Soft blue glow - matches theme
            trackBorderAlpha: 0.6,
            
            // Padding inside the bar
            padding: 4,
            
            // Bar styling
            borderRadius: 12,
            slotRadius: 8,
            slotSpacing: 0,  // Space between slots
            
            // Fade duration matches Wappo move animation (500ms)
            fadeDuration: 500,
            
            ...options
        };

        // Preserve original colors so we can restore them
        this._baseTrackColor = this.options.trackColor;
        this._baseTrackBorderColor = this.options.trackBorderColor;

        // Busy state visuals (shown during animation)
        this.busy = false;
        this.busyTrackColor = this._baseTrackColor; // same color but could be modified for effect
        this.busyTrackBorderColor = 0xFFEA00; // brighter gold
        
        // Graphics layers
        this.trackGraphics = this.scene.add.graphics();
        this.slotsGraphics = this.scene.add.graphics();
        // Per-slot graphics for efficient per-slot updates
        this.slotGraphics = [];
        
        this.add(this.trackGraphics);
        this.add(this.slotsGraphics);
        // Add per-slot graphics after static layers so they render above
        this.createBar();
    }

    /**
     * Get the maximum number of slots available (level move budget)
     * @returns {number} Maximum slots
     */
    getMaxSlots() {
        return this.maxSlots;
    }

    /**
     * Get the current number of remaining slots (moves left)
     * @returns {number} Remaining slots
     */
    getCurrentSlots() {
        return this.currentSlots;
    }

    /**
     * Set the bar's overall size and relayout the visuals.
     * @param {number} width - Total width of the bar
     * @param {number} height - Total height of the bar
     */
    setBarSize(width, height) {
        this.options.barWidth = Math.max(20, Math.floor(width));
        this.options.barHeight = Math.max(12, Math.floor(height));
        this.createBar();
    }

    /**
     * Legacy layout helper kept for compatibility. Computes and applies an overall bar size
     * from individual slot dimensions and spacing.
     * @param {number} slotWidth - Preferred slot width
     * @param {number} slotHeight - Preferred slot height
     * @param {number} spacing - Spacing between slots
     */
    applyLayout(slotWidth, slotHeight, spacing) {
        const count = this.maxSlots;
        if (this.options.orientation === 'vertical') {
            const totalHeight = count > 0 ? slotHeight * count + spacing * Math.max(0, count - 1) : slotHeight;
            this.setBarSize(slotWidth + this.options.padding * 2, totalHeight + this.options.padding * 2);
        } else {
            const totalWidth = count > 0 ? slotWidth * count + spacing * Math.max(0, count - 1) : slotWidth;
            this.setBarSize(totalWidth + this.options.padding * 2, slotHeight + this.options.padding * 2);
        }
    }

    /**
     * Set the bar orientation and relayout.
     * @param {'horizontal'|'vertical'} orientation
     */
    setOrientation(orientation) {
        this.options.orientation = orientation === 'vertical' ? 'vertical' : 'horizontal';
        this.createBar();
    }

    /**
     * Update the total number of slots (e.g., when a new level loads).
     * Any active fade is cancelled and visuals are rebuilt.
     * @param {number} maxSlots
     */
    setSlots(maxSlots) {
        this.maxSlots = Math.max(0, Number(maxSlots) || 0);
        this.currentSlots = Math.min(this.currentSlots, this.maxSlots);
        this.stopFade();
        this.createBar();
    }

    /**
     * Set the current remaining slots. If the value decreases this method
     * triggers a fade animation for the consumed slot(s). If it increases
     * it resets any fade state.
     * @param {number} currentSlots
     */
    setCurrentSlots(currentSlots) {
        const normalized = Math.max(0, Number(currentSlots) || 0);
        const nextSlots = Math.min(normalized, this.maxSlots);

        if (nextSlots < this.currentSlots) {
            // Determine the highest slot index that was consumed
            const consumedTopIndex = this.currentSlots - 1;

            // Any slots above the new level (excluding the one we're animating) become empty immediately
            for (let i = consumedTopIndex; i > nextSlots; i--) {
                this.slotFills[i] = 0;
            }

            // Animate the topmost consumed slot
            this.stopFade();
            this.fadingSlotIndex = consumedTopIndex >= 0 ? consumedTopIndex : -1;
            this.fadingAlpha = 1;
            this.startFadeAnimation();
        } else if (nextSlots > this.currentSlots) {
            // Refill - reset any fade state
            this.stopFade();
        }

        this.currentSlots = nextSlots;
        this.drawSlots();

    }

    /**
     * Reset the bar to full (all slots available) and cancel any fades.
     */
    reset() {
        this.currentSlots = this.maxSlots;
        this.stopFade();
        this.drawSlots();
    }

    /**
     * Consume one slot with fade animation
     */
    /**
     * Consume one slot immediately and animate its fade.
     * Returns the remaining slots.
     * @returns {number}
     */
    consumeSlot() {
        if (this.currentSlots <= 0) return this.currentSlots;

        // Stop any existing fade
        this.stopFade();
        
        // Start fading the slot that's about to be consumed
        this.fadingSlotIndex = this.currentSlots - 1;
        this.fadingAlpha = 1;
        
        // Decrease slot count
        this.currentSlots = this.currentSlots - 1;

        
        // Start fade animation
        this.startFadeAnimation();
        
        return this.currentSlots;
    }

    /**
     * Stop any active fade animation and reset fading state immediately.
     */
    stopFade() {
        if (this.fadeTween) {
            this.fadeTween.stop();
            this.fadeTween = null;
        }
        
        // If we are destroyed or have no graphics, just reset state vars and exit
        if (!this.slotGraphics) {
            this.fadingSlotIndex = -1;
            this.fadingAlpha = 1;
            return;
        }

        // Reset fading state and make slot fills consistent with currentSlots
        for (let i = 0; i < (this.slotFills ? this.slotFills.length : 0); i++) {
            this.slotFills[i] = i < this.currentSlots ? 1 : 0;
            // Update color to match state
            if (i < this.maxSlots) {
                this.updateSlotColor(i);
            }
        }

        this.fadingSlotIndex = -1;
        this.fadingAlpha = 1;
    }

    /**
     * Start a fade tween for the currently set fading slot index.
     * Tweens a simple alpha value and redraws on updates.
     */
    startFadeAnimation() {
        if (!this.scene || !this.scene.tweens) return;

        const index = this.fadingSlotIndex;
        if (index < 0 || index >= this.maxSlots) return;

        // Ensure the slotFills array exists
        this.slotFills = this.slotFills || [];
        this.slotFills[index] = typeof this.slotFills[index] === 'number' ? this.slotFills[index] : 1;

        // Tween the fill value from current (likely 1) to 0
        const fadeTarget = { v: this.slotFills[index] };

        this.fadeTween = this.scene.tweens.add({
            targets: fadeTarget,
            v: 0,
            duration: this.options.fadeDuration,
            ease: 'Linear',
            onUpdate: () => {
                this.slotFills[index] = fadeTarget.v;
                this.updateSlotColor(index);
            },
            onComplete: () => {
                this.slotFills[index] = 0;
                this.updateSlotColor(index);
                this.fadeTween = null;
                this.fadingSlotIndex = -1;
            }
        });
    }

    /**
     * (Re)create visual elements. Called after layout or size changes.
     */
    createBar() {
        // Pre-calculate custom color objects for interpolation
        this.colorFullObj = Phaser.Display.Color.ValueToColor(this.options.colorFull);
        this.colorEmptyObj = Phaser.Display.Color.ValueToColor(this.options.colorEmpty);
        
        this.drawTrack();
        this.ensureSlotGraphics();
        this.drawSlots();
        this.setSize(this.options.barWidth, this.options.barHeight);
    }

    /**
     * Update the busy state (e.g., during animations) and redraw the track.
     * @param {boolean} isBusy
     */
    setBusy(isBusy) {
        this.busy = Boolean(isBusy);
        this.drawTrack();
    }

    /**
     * Draw the continuous track (background + glow) for the oxygen bar.
     */
    drawTrack() {
        const { barWidth, barHeight, trackBorderAlpha, borderRadius } = this.options;
        const trackColor = this.busy ? this.busyTrackColor : this._baseTrackColor;
        const trackBorderColor = this.busy ? this.busyTrackBorderColor : this._baseTrackBorderColor;
        
        this.trackGraphics.clear();
        
        // Draw track background
        this.trackGraphics.fillStyle(trackColor, 0.9);
        this.trackGraphics.fillRoundedRect(
            -barWidth / 2,
            -barHeight / 2,
            barWidth,
            barHeight,
            borderRadius
        );
        
        // Draw track border with glow
        this.trackGraphics.lineStyle(2, trackBorderColor, trackBorderAlpha);
        this.trackGraphics.strokeRoundedRect(
            -barWidth / 2,
            -barHeight / 2,
            barWidth,
            barHeight,
            borderRadius
        );

        // Outer glow effect
        this.trackGraphics.lineStyle(4, trackBorderColor, 0.15);
        this.trackGraphics.strokeRoundedRect(
            -barWidth / 2 - 2,
            -barHeight / 2 - 2,
            barWidth + 4,
            barHeight + 4,
            borderRadius + 2
        );
    }

    /**
     * Draw all slot segments inside the track. Uses the current fading state
     * to show a smooth fade for the most recently consumed slot.
     */
    drawSlots() {
        const { barWidth, barHeight, padding, orientation } = this.options;
        const count = this.maxSlots;

        // Clear static layer and separators
        this.slotsGraphics.clear();

        if (count <= 0) return;

        const availableWidth = barWidth - padding * 2;
        const availableHeight = barHeight - padding * 2;

        // Draw separators and static full/empty slots using per-slot graphics
        if (orientation === 'vertical') {
            const slotHeight = availableHeight / count;
            const slotWidth = availableWidth;
            const startX = -availableWidth / 2;
            const startY = -availableHeight / 2;

            for (let idx = 0; idx < count; idx++) {
                // logical index 0 = bottom slot
                const slotIndex = idx; // 0..count-1 from bottom to top
                
                // Draw slot shape once, color update applies fills
                this.drawSlotShape(slotIndex);
                this.updateSlotColor(slotIndex);

                // Separator line (draw once per slot row)
                if (slotIndex < count - 1) {
                    const y = startY + (count - 1 - slotIndex) * slotHeight;
                    const sepY = y + slotHeight;
                    this.slotsGraphics.lineStyle(1, 0x0a0f14, 0.8);
                    this.slotsGraphics.beginPath();
                    this.slotsGraphics.moveTo(startX, sepY);
                    this.slotsGraphics.lineTo(startX + slotWidth, sepY);
                    this.slotsGraphics.strokePath();
                }
            }
        } else {
            const slotWidth = availableWidth / count;
            const slotHeight = availableHeight;
            const startX = -availableWidth / 2;
            const startY = -availableHeight / 2;

            for (let slotIndex = 0; slotIndex < count; slotIndex++) {
                
                this.drawSlotShape(slotIndex);
                this.updateSlotColor(slotIndex);

                // Vertical separator per slot
                if (slotIndex < count - 1) {
                    const x = startX + slotIndex * slotWidth;
                    const sepX = x + slotWidth;
                    this.slotsGraphics.lineStyle(1, 0x0a0f14, 0.8);
                    this.slotsGraphics.beginPath();
                    this.slotsGraphics.moveTo(sepX, startY);
                    this.slotsGraphics.lineTo(sepX, startY + slotHeight);
                    this.slotsGraphics.strokePath();
                }
            }
        }
    }

    /**
     * Draw the visual geometry for a single slot.
     * This is called during initial layout - updateSlotColor handles colors.
     * @param {number} slotIndex
     */
    drawSlotShape(slotIndex) {
        if (!this.slotGraphics || !this.slotGraphics[slotIndex]) return;
        const g = this.slotGraphics[slotIndex];
        const { barWidth, barHeight, padding, orientation } = this.options;
        const count = this.maxSlots;
        const availableWidth = barWidth - padding * 2;
        const availableHeight = barHeight - padding * 2;

        // Set position only
        if (orientation === 'vertical') {
            const slotHeight = availableHeight / count;
            const startX = -availableWidth / 2;
            const startY = -availableHeight / 2;
            
            const y = startY + (count - 1 - slotIndex) * slotHeight;
            const x = startX;
            g.x = x;
            g.y = y;
        } else {
            const startX = -availableWidth / 2;
            const startY = -availableHeight / 2;
            
            const x = startX + slotIndex * (availableWidth / count);
            const y = startY;
            g.x = x;
            g.y = y;
        }
    }

    /**
     * Update the color and alpha of a slot based on its current fill state.
     * Graphics objects don't support tinting, so we redraw with the correct color.
     * @param {number} slotIndex
     */
    updateSlotColor(slotIndex) {
        if (!this.slotGraphics || !this.slotGraphics[slotIndex]) return;
        const g = this.slotGraphics[slotIndex];

        // Ensure fill state exists
        const fill = Math.max(0, Math.min(1, (this.slotFills && typeof this.slotFills[slotIndex] === 'number') ? this.slotFills[slotIndex] : 0));

        // Use Phaser's native color interpolation
        const resultColor = Phaser.Display.Color.Interpolate.ColorWithColor(
            this.colorEmptyObj, 
            this.colorFullObj, 
            1, 
            fill
        );
        const color = Phaser.Display.Color.GetColor(resultColor.r, resultColor.g, resultColor.b);
        const alpha = 0.35 + fill * (0.95 - 0.35);

        // Graphics objects need to be redrawn with the new color
        const { barWidth, barHeight, padding, orientation, slotRadius, slotSpacing } = this.options;
        const count = this.maxSlots;
        const availableWidth = barWidth - padding * 2;
        const availableHeight = barHeight - padding * 2;
        const spacing = slotSpacing;

        g.clear();
        g.fillStyle(color, alpha);

        if (orientation === 'vertical') {
            const slotHeight = availableHeight / count;
            const slotWidth = availableWidth;
            g.fillRoundedRect(spacing / 2, spacing / 2, slotWidth - spacing, slotHeight - spacing, slotRadius);
        } else {
            const slotWidth = availableWidth / count;
            const slotHeight = availableHeight;
            g.fillRoundedRect(spacing / 2, spacing / 2, slotWidth - spacing, slotHeight - spacing, slotRadius);
        }
    }

    /**
     * Ensure we have a dedicated Graphics object for each slot and a matching fill state.
     */
    ensureSlotGraphics() {
        // Create or destroy Graphics to match this.maxSlots
        // Remove excess
        while (this.slotGraphics.length > this.maxSlots) {
            const g = this.slotGraphics.pop();
            g.destroy();
        }
        // Add missing
        for (let i = this.slotGraphics.length; i < this.maxSlots; i++) {
            const g = this.scene.add.graphics();
            // Insert per-slot graphics above the static slots layer
            this.add(g);
            this.slotGraphics.push(g);
        }

        // Initialize slot fill states: trim or extend to match maxSlots
        this.slotFills = this.slotFills || [];
        this.slotFills.length = this.maxSlots;
        for (let i = 0; i < this.maxSlots; i++) {
            if (typeof this.slotFills[i] === 'undefined' || this.slotFills[i] === null) {
                // full slots are 1, empty 0
                this.slotFills[i] = i < this.currentSlots ? 1 : 0;
            }
        }
    }

    destroy() {
        this.stopFade();
        if (this.trackGraphics) {
            this.trackGraphics.destroy();
            this.trackGraphics = null;
        }
        if (this.slotsGraphics) {
            this.slotsGraphics.destroy();
            this.slotsGraphics = null;
        }
        if (this.slotGraphics) {
            for (const g of this.slotGraphics) {
                if (g) g.destroy();
            }
            this.slotGraphics = null;
        }
        super.destroy();
    }
}
