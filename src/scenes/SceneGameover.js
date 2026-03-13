'use strict';

//import { Button } from '../ui/Button.js';
//import { Utils } from '../game/Utils.js';
import { SaveGameHelper } from '../game/SaveGameHelper.js';

export class SceneGameover extends Phaser.Scene {  

    level_status;
    choosenLevel;
    deathReason;
    btn_tryagain;
    btn_home;
    btn_nextLevel;
    gameOverImage;
    backgroundGraphics;
    score;
    stars;
    textScore;
    textStars;
    textOuch;

    constructor() {
        super('SceneGameover');
    }

    init(data) {
        this.level_status = data.status;
        this.choosenLevel = data.choosenLevel;
        this.score = data.score;
        this.stars = data.stars;
        this.deathReason = data.deathReason || null;
    }

    preload() {
        // const progress = Utils.createLoadingProgressBar(this, { text: 'Loading game over...', backgroundColor: '#000000' });
        // this.load.on('progress', progress.updateProgress);
        // this.load.on('complete', progress.destroyProgress);

        this.load.image('gameover', 'assets/images/gameover.png');
        this.load.image('gamewon', 'assets/images/gamewon.png');
        this.load.image('home_icon', 'assets/images/home.png');
        this.load.image('replay_icon', 'assets/images/replay.png');
        this.load.image('play_circle_icon', 'assets/images/play_circle.png');
    }

    create() {
        const { width, height } = this.scale.gameSize;
        const centerX = width / 2;
        const centerY = height / 2;

        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        // Log death type
        if (this.level_status === 'DIED') {
            const deathLabels = {
                'hero_bee':       'Death by bee collision',
                'enemy_attack':   'Death by bee collision (enemy attack)',
                'hero_trap':      'Death by trap',
                'oxygen_depleted':'Death by oxygen depletion',
            };
            console.log('[GameOver] Death type:', deathLabels[this.deathReason] ?? this.deathReason ?? 'unknown');
        }

        // Background
        this.drawBackground();

        // Score and stars (only when the level is won)
        if (this.level_status === "WON") {
            const displayScore = SaveGameHelper.getDisplayScore(this.score ?? 0);
            this.textScore = this.add.text(0, 0, `Score : ${displayScore}`, {
                fontSize: 10 + 'px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            const earned = Math.max(0, Math.min(2, this.stars || 0));

            const star1 = this.add.text(0, 0, earned >= 1 ? '★' : '☆', {
                fontSize: 10 + 'px',
                fontFamily: 'Arial',
                color: earned >= 1 ? '#ffd700' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const star2 = this.add.text(0, 0, earned >= 2 ? '★' : '☆', {
                fontSize: 10 + 'px',
                fontFamily: 'Arial',
                color: earned >= 2 ? '#ffd700' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            this.textStars = [star1, star2];
        } else {
            // Lost case: show a simple message where the score would be
            this.textOuch = this.add.text(0, 0, 'Ouch!', {
                fontSize: 10 + 'px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
        }

        // Buttons
        this.btn_tryagain = this.add.image(0, 0, 'replay_icon');
        this.btn_tryagain.setScale(1);
        this.btn_tryagain.setInteractive({ useHandCursor: true });
        this.btn_tryagain.on('pointerover', () => this.btn_tryagain.setScale(this.btn_tryagain.scale * 1.1));
        this.btn_tryagain.on('pointerout', () => this.btn_tryagain.setScale(this.btn_tryagain.scale));
        this.btn_tryagain.on('pointerup', () => this.tryAgain());
        this.btn_home = this.add.image(0, 0, 'home_icon');
        this.btn_home.setScale(1);
        this.btn_home.setInteractive({ useHandCursor: true });
        this.btn_home.on('pointerover', () => this.btn_home.setScale(this.btn_home.scale * 1.1));
        this.btn_home.on('pointerout', () => this.btn_home.setScale(this.btn_home.scale));
        this.btn_home.on('pointerup', () => this.goHome());
        this.btn_nextLevel = this.add.image(0, 0, 'play_circle_icon');
        this.btn_nextLevel.setScale(1);
        this.btn_nextLevel.setInteractive({ useHandCursor: true });
        this.btn_nextLevel.on('pointerover', () => this.btn_nextLevel.setScale(this.btn_nextLevel.scale * 1.1));
        this.btn_nextLevel.on('pointerout', () => this.btn_nextLevel.setScale(this.btn_nextLevel.scale));
        this.btn_nextLevel.on('pointerup', () => this.nextLevel());

        // Game Over / Won Image
        const imgKey = this.level_status == "WON" ? 'gamewon' : 'gameover';
        this.gameOverImage = this.add.image(centerX, centerY - height * 0.05, imgKey);
        const imgScale = Math.max(Math.min(width / 600, height / 400) * 0.8, 0.5);
        this.gameOverImage.setScale(imgScale);
        this.btn_nextLevel.setVisible(this.level_status == "WON");

        this.updateLayout();
    }
    
    updateLayout() {
        const { width, height } = this.scale.gameSize;
        const centerX = width / 2;

        // --- 1. Define ideal sizes (percentages that look good on mobile) ---
        let fontSize = Math.min(height * 0.10, 80); // Max 10% of height
        let starFontSize = fontSize * 1.5;
        let buttonIconBaseSize = Math.min(height * 0.12, 100); 
        let buttonScale = (buttonIconBaseSize / 100) * 1.5; // Scale relative to base icon size
        let spacing = height * 0.03; // 3% spacing

        // --- 2. Calculate Vertical Space Usage ---
        const scoreHeight = fontSize; 
        const hasStars = this.textStars && this.textStars.length === 2;
        const starsHeight = hasStars ? starFontSize : 0;
        const buttonImgHeight = 64 * buttonScale; // Approximate visual height of buttons

        // Calculate space required for "fixed" content (Text + Stars + Buttons + Spacings)
        // Structure: Margin + Score + Gap + Stars + Gap + Image + Gap + Buttons + Margin
        const totalFixedContent = scoreHeight + (hasStars ? spacing + starsHeight : 0) + spacing + spacing + buttonImgHeight;
        
        // --- 3. Determine Image Size & Global Scaling ---
        // Verify what remains for the image
        let availableForImage = height - totalFixedContent - (height * 0.1); // Keep 10% margin total

        let globalScale = 1;
        // If remaining space is too small (less than 20% of screen), scale everything down
        if (availableForImage < height * 0.20) {
            // We want the content to fit. We'll find a scale strictly to fit everything
            // including a minimal image height of 20%
            const targetTotalHeight = height * 0.95; // Use 95% of screen max
            const minImageHeight = height * 0.20;
            const currentTotalWithMinImage = totalFixedContent + minImageHeight;
            
            globalScale = targetTotalHeight / currentTotalWithMinImage;
            
            // Apply scale reduction
            fontSize *= globalScale;
            starFontSize *= globalScale;
            buttonScale *= globalScale;
            spacing *= globalScale;
            
            // Recalculate available space for image with new sizes
            const newFixedContent = (scoreHeight * globalScale) + (hasStars ? spacing * globalScale + starsHeight * globalScale : 0) + spacing * 2 + (buttonImgHeight * globalScale);
            availableForImage = height - newFixedContent - (height * 0.05);
        }

        // Calculate Image Scale to fit in available box (width limited & height limited)
        let imgScale = Math.min(width / 600, height / 400); // Start with 'ideal' scale
        if (this.gameOverImage) {
            const naturalW = this.gameOverImage.width || 100;
            const naturalH = this.gameOverImage.height || 100;
            
            // Constrain by width (80% of screen)
            const maxW = width * 0.8;
            const scaleW = maxW / naturalW;
            
            // Constrain by available height
            const maxH = availableForImage;
            const scaleH = maxH / naturalH;

            // Pick smallest to fit bounds
            imgScale = Math.min(imgScale, scaleW, scaleH);
        }
        
        // --- 4. Position Elements (Vertical Stack) ---
        const finalImgHeight = this.gameOverImage ? (this.gameOverImage.height * imgScale) : 0;
        const finalButtonHeight = 64 * buttonScale;
        
        // Calculate total actual height of the stack
        const finalTotalHeight = 
            fontSize + 
            (hasStars ? spacing + starFontSize : 0) + 
            spacing + 
            finalImgHeight + 
            spacing + 
            finalButtonHeight;

        // Start Y - Centered vertically
        let currentY = (height - finalTotalHeight) / 2;

        // Background
        this.drawBackground();

        // A. Score / Ouch Text
        currentY += fontSize / 2; // Move to center of text line
        if (this.textScore) {
            this.textScore.setFontSize(fontSize);
            this.textScore.setPosition(centerX, currentY);
        }
        if (this.textOuch) {
            this.textOuch.setFontSize(fontSize);
            this.textOuch.setPosition(centerX, currentY);
        }
        currentY += fontSize / 2;

        // B. Stars (if won)
        if (hasStars) {
            currentY += spacing;
            currentY += starFontSize / 2;
            const starXOffset = starFontSize * 0.6;
            this.textStars[0].setFontSize(starFontSize);
            this.textStars[1].setFontSize(starFontSize);
            this.textStars[0].setPosition(centerX - starXOffset, currentY);
            this.textStars[1].setPosition(centerX + starXOffset, currentY);
            currentY += starFontSize / 2;
        }

        // C. Image (Game Over / Won)
        currentY += spacing;
        currentY += finalImgHeight / 2;
        if (this.gameOverImage) {
            this.gameOverImage.setScale(imgScale);
            this.gameOverImage.setPosition(centerX, currentY);
        }
        currentY += finalImgHeight / 2;

        // D. Buttons
        currentY += spacing;
        currentY += finalButtonHeight / 2;
        const btnSpacingX = Math.min(width / 4, 150 * globalScale); 

        this.btn_tryagain.setScale(buttonScale);
        this.btn_tryagain.setPosition(centerX - btnSpacingX, currentY);

        this.btn_home.setScale(buttonScale);
        this.btn_home.setPosition(centerX, currentY);

        this.btn_nextLevel.setScale(buttonScale);
        this.btn_nextLevel.setPosition(centerX + btnSpacingX, currentY);

        this.btn_nextLevel.setVisible(this.level_status == "WON");
    }
    
    handleResize() {
        this.updateLayout();
    }

    drawBackground() {
        if (!this.backgroundGraphics) {
            this.backgroundGraphics = this.add.graphics();
        } else {
            this.backgroundGraphics.clear();
        }
        this.backgroundGraphics.fillStyle(0x000000, 0.9); // Translucent black
        this.backgroundGraphics.fillRect(0, 0, this.scale.gameSize.width, this.scale.gameSize.height);
        this.backgroundGraphics.setDepth(-1);
    }

    cleanupObjects() {
        this.scale.off('resize', this.handleResize, this);
        [this.btn_tryagain, this.btn_home, this.btn_nextLevel].forEach(btn => {
            if (btn && btn.active) btn.destroy();
        });
        this.btn_tryagain = null;
        this.btn_home = null;
        this.btn_nextLevel = null;
        if (this.buttonBand) {
            this.buttonBand.destroy();
            this.buttonBand = null;
        }
        if (this.backgroundGraphics) {
            this.backgroundGraphics.destroy();
            this.backgroundGraphics = null;
        }
        if (this.gameOverImage) {
            this.gameOverImage.destroy();
            this.gameOverImage = null;
        }
        if (this.textScore) {
            this.textScore.destroy();
            this.textScore = null;
        }
        if (this.textOuch) {
            this.textOuch.destroy();
            this.textOuch = null;
        }
        if (this.textStars && this.textStars.length) {
            this.textStars.forEach(st => st.destroy());
            this.textStars = null;
        }
    }

    tryAgain() {
        this.cleanupObjects();

        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneMain', { "choosenLevel": this.choosenLevel });
    }

    goHome() {
        this.cleanupObjects();

        // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
        this.scene.stop('SceneMain');
        this.scene.start('SceneHome');
    }

    nextLevel() {
        var next_level = Number(this.choosenLevel) + 1
        if (next_level <= 200){
            this.cleanupObjects();

            // First, explicitly stop the paused main scene to trigger its shutdown cleanup.
            this.scene.stop('SceneMain');
            this.scene.start('SceneMain', { 
                "choosenLevel": next_level
            });
        } else {
            // If there are no more levels, go back to the home screen.
            this.goHome();
        }
    }
}