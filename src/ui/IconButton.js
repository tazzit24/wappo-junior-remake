export class IconButton {
    constructor(scene, textures, x, y, scale, callback) {
        this.scene = scene;
        this.textures = textures;
        this.baseScale = scale;
        this.img = scene.add.image(x, y, textures[0]);
        this.img.setOrigin(0.5, 0.5); // Center the icon
        this.img.setScale(scale);
        this.img.setInteractive();
        this.img.on('pointerdown', callback);
        this.img.on('pointerover', () => {
            this.img.setScale(this.baseScale * 1.1);
        });
        this.img.on('pointerout', () => {
            this.img.setScale(this.baseScale);
        });
        this.currentIndex = 0;
    }

    setEnabled(enabled) {
        if (enabled) {
            this.img.setInteractive();
        } else {
            this.img.disableInteractive();
        }
    }

    setScale(scale) {
        this.baseScale = scale;
        this.img.setScale(scale);
        return this;
    }

    updateTexture(index) {
        if (index < this.textures.length) {
            this.currentIndex = index;
            this.img.setTexture(this.textures[index]);
        }
    }

    destroy() {
        this.img.destroy();
    }
}