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
            colorFull: 0x4fc3f7,       // Oxygen fill color
            colorEmpty: 0x2a2f3a,      // Empty slot color
            trackColor: 0x1a1a2e,      // Dark track background
            trackBorderColor: 0x4a90e2, // Blue border glow
            trackBorderAlpha: 0.6,
            
            // Padding inside the bar
            padding: 4,
            
            // Bar styling
            borderRadius: 12,
            slotRadius: 4,
            
            // Fade duration matches Wappo move animation (500ms)
            fadeDuration: 500,
            
            ...options
        };
        
        // Graphics layers
        this.trackGraphics = this.scene.add.graphics();
        this.slotsGraphics = this.scene.add.graphics();
        
        this.add(this.trackGraphics);
        this.add(this.slotsGraphics);
        
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
            // Start fading the topmost slot(s) that were consumed
            for (let i = this.currentSlots - 1; i >= nextSlots; i--) {
                this.stopFade();
                this.fadingSlotIndex = i;
                this.fadingAlpha = 1;
                this.startFadeAnimation();
            }
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
        this.fadingSlotIndex = -1;
        this.fadingAlpha = 1;
    }

    /**
     * Start a fade tween for the currently set fading slot index.
     * Tweens a simple alpha value and redraws on updates.
     */
    startFadeAnimation() {
        if (!this.scene || !this.scene.tweens) return;
        
        // Create a simple object to tween
        const fadeTarget = { alpha: 1 };
        
        this.fadeTween = this.scene.tweens.add({
            targets: fadeTarget,
            alpha: 0,
            duration: this.options.fadeDuration,
            ease: 'Linear',
            onUpdate: () => {
                this.fadingAlpha = fadeTarget.alpha;
                // Debug draw update
                // console.log('[OxygenBar] fade onUpdate alpha=', this.fadingAlpha);
                this.drawSlots();
            },
            onComplete: () => {

                this.fadingSlotIndex = -1;
                this.fadingAlpha = 1;
                this.fadeTween = null;
                this.drawSlots();
            }
        });
    }

    /**
     * (Re)create visual elements. Called after layout or size changes.
     */
    createBar() {
        this.drawTrack();
        this.drawSlots();
        this.setSize(this.options.barWidth, this.options.barHeight);
    }

    /**
     * Draw the continuous track (background + glow) for the oxygen bar.
     */
    drawTrack() {
        const { barWidth, barHeight, trackColor, trackBorderColor, trackBorderAlpha, borderRadius } = this.options;
        
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
        const { barWidth, barHeight, padding, orientation, colorFull, colorEmpty, slotRadius } = this.options;
        const count = this.maxSlots;

        this.slotsGraphics.clear();

        if (count <= 0) return;

        const availableWidth = barWidth - padding * 2;
        const availableHeight = barHeight - padding * 2;

        if (orientation === 'vertical') {
            const slotHeight = availableHeight / count;
            const slotWidth = availableWidth;
            const startX = -availableWidth / 2;
            const startY = -availableHeight / 2;

            for (let i = 0; i < count; i++) {
                const y = startY + i * slotHeight;
                const slotIndex = count - 1 - i; // Index from bottom
                
                const isFull = slotIndex < this.currentSlots;
                const isFading = slotIndex === this.fadingSlotIndex;
                
                let color, alpha;
                if (isFull) {
                    color = colorFull;
                    alpha = 0.95;
                } else if (isFading) {
                    // Fading from full to empty
                    color = colorFull;
                    alpha = 0.95 * this.fadingAlpha;
                } else {
                    color = colorEmpty;
                    alpha = 0.35;
                }
                
                this.slotsGraphics.fillStyle(color, alpha);
                this.slotsGraphics.fillRoundedRect(startX, y, slotWidth, slotHeight, slotRadius);

                // Separator line
                if (i > 0) {
                    this.slotsGraphics.lineStyle(1, 0x0a0f14, 0.8);
                    this.slotsGraphics.beginPath();
                    this.slotsGraphics.moveTo(startX, y);
                    this.slotsGraphics.lineTo(startX + slotWidth, y);
                    this.slotsGraphics.strokePath();
                }
            }
        } else {
            // Horizontal
            const slotWidth = availableWidth / count;
            const slotHeight = availableHeight;
            const startX = -availableWidth / 2;
            const startY = -availableHeight / 2;

            for (let i = 0; i < count; i++) {
                const x = startX + i * slotWidth;
                const slotIndex = i;
                
                const isFull = slotIndex < this.currentSlots;
                const isFading = slotIndex === this.fadingSlotIndex;
                
                let color, alpha;
                if (isFull) {
                    color = colorFull;
                    alpha = 0.95;
                } else if (isFading) {
                    // Fading from full to empty
                    color = colorFull;
                    alpha = 0.95 * this.fadingAlpha;
                } else {
                    color = colorEmpty;
                    alpha = 0.35;
                }
                
                this.slotsGraphics.fillStyle(color, alpha);
                this.slotsGraphics.fillRoundedRect(x, startY, slotWidth, slotHeight, slotRadius);

                // Separator line
                if (i > 0) {
                    this.slotsGraphics.lineStyle(1, 0x0a0f14, 0.8);
                    this.slotsGraphics.beginPath();
                    this.slotsGraphics.moveTo(x, startY);
                    this.slotsGraphics.lineTo(x, startY + slotHeight);
                    this.slotsGraphics.strokePath();
                }
            }
        }
    }

    /**
     * Destroy visual resources used by the bar.
     */
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
        super.destroy();
    }
}
