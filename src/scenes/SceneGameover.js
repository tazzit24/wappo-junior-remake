'use strict';

//import { Button } from '../ui/Button.js';
//import { Utils } from '../game/Utils.js';
import { SaveGameHelper } from '../game/SaveGameHelper.js';

export class SceneGameover extends Phaser.Scene {  

    level_status;
    choosenLevel;
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
        const centerY = height / 2;

        const infoFontSize = Math.max(Math.min(Math.round(height * 0.10), 80), 32);
        const scoreY = centerY - height * 0.32;

        const starFont = Math.max(Math.round(infoFontSize * 1.8), 36);
        const yStars = centerY - height * 0.26;
        const starXOffset = starFont * 0.6;

        const buttonY = centerY + height * 0.15;
        const buttonSpacing = Math.min(width / 4, 150);
        const buttonFontSize = Math.max(Math.min(Math.round(height * 0.12), 120), 48);
        const iconScale = (buttonFontSize / 100) * 1.8;

        const imgScale = Math.max(Math.min(width / 600, height / 400) * 0.8, 0.5);
        // Background
        this.drawBackground();
        // Score and stars
        if (this.textScore) {
            this.textScore.setFontSize(infoFontSize);
            this.textScore.setPosition(centerX, scoreY);
        }
        if (this.textOuch) {
            this.textOuch.setFontSize(infoFontSize);
            this.textOuch.setPosition(centerX, scoreY);
        }
        if (this.textStars && this.textStars.length === 2) {
            this.textStars[0].setFontSize(starFont);
            this.textStars[1].setFontSize(starFont);
            this.textStars[0].setPosition(centerX - starXOffset, yStars);
            this.textStars[1].setPosition(centerX + starXOffset, yStars);
        }
        // Buttons
        this.btn_tryagain.setPosition(centerX - buttonSpacing, buttonY);
        this.btn_tryagain.setScale(iconScale);
        this.btn_home.setPosition(centerX, buttonY);
        this.btn_home.setScale(iconScale);
        this.btn_nextLevel.setPosition(centerX + buttonSpacing, buttonY);
        this.btn_nextLevel.setScale(iconScale);
        // Game Over / Won Image
        this.gameOverImage.setPosition(centerX, centerY - height * 0.05);
        this.gameOverImage.setScale(imgScale);
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