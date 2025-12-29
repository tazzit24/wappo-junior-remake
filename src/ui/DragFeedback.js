export class DragFeedback {
    constructor(scene, depth = 950) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(depth).setVisible(false);
        this.pointerId = null;
        this.start = null;
        this.circleRadius = 28; // Outer stroke radius
    }

    begin(pointer) {
        this.pointerId = pointer.id;
        this.start = { x: pointer.x, y: pointer.y };
        this._drawStartCircle(pointer.x, pointer.y);
    }

    update(pointer) {
        if (!this.start || !this.graphics || pointer.id !== this.pointerId) {
            return;
        }

        const { x: startX, y: startY } = this.start;
        const dx = pointer.x - startX;
        const dy = pointer.y - startY;
        const distance = Math.hypot(dx, dy);

        this.graphics.clear();
        this._drawStartCircle(startX, startY);

        if (distance <= 30) {
            this.graphics.setVisible(true);
            return;
        }

        // Determine dominant direction (4 directions: UP, DOWN, LEFT, RIGHT)
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        let directionAngle;
        if (absDx > absDy) {
            // Horizontal direction
            directionAngle = dx > 0 ? 0 : Math.PI; // RIGHT or LEFT
        } else {
            // Vertical direction
            directionAngle = dy > 0 ? Math.PI / 2 : -Math.PI / 2; // DOWN or UP
        }
        
        // Arrow parameters
        const arrowLength = 40 + Math.min(distance / 5, 30); // Dynamic length
        const arrowHeadLength = 20;
        const arrowHeadWidth = 16;
        const lineWidth = 6;
        
        // Calculate arrow start position (edge of circle)
        const arrowStartX = startX + Math.cos(directionAngle) * this.circleRadius;
        const arrowStartY = startY + Math.sin(directionAngle) * this.circleRadius;
        
        // Calculate arrow end position
        const arrowEndX = arrowStartX + Math.cos(directionAngle) * arrowLength;
        const arrowEndY = arrowStartY + Math.sin(directionAngle) * arrowLength;

        // Draw arrow line
        this.graphics.lineStyle(lineWidth, 0xffc400, 0.9);
        this.graphics.beginPath();
        this.graphics.moveTo(arrowStartX, arrowStartY);
        this.graphics.lineTo(arrowEndX, arrowEndY);
        this.graphics.strokePath();

        // Draw arrow head
        const headAngleOffset = Math.PI / 6;
        const leftHeadX = arrowEndX - Math.cos(directionAngle - headAngleOffset) * arrowHeadLength;
        const leftHeadY = arrowEndY - Math.sin(directionAngle - headAngleOffset) * arrowHeadLength;
        const rightHeadX = arrowEndX - Math.cos(directionAngle + headAngleOffset) * arrowHeadLength;
        const rightHeadY = arrowEndY - Math.sin(directionAngle + headAngleOffset) * arrowHeadLength;

        this.graphics.fillStyle(0xffc400, 0.95);
        this.graphics.beginPath();
        this.graphics.moveTo(arrowEndX, arrowEndY);
        this.graphics.lineTo(leftHeadX, leftHeadY);
        this.graphics.lineTo(rightHeadX, rightHeadY);
        this.graphics.closePath();
        this.graphics.fillPath();

        // Optional: glow at arrow tip
        this.graphics.fillStyle(0xffe066, 0.2);
        this.graphics.fillCircle(arrowEndX, arrowEndY, 12);
        
        this.graphics.setVisible(true);
    }

    end(pointer) {
        if (pointer && this.pointerId !== null && pointer.id !== this.pointerId) {
            return;
        }
        this._reset();
    }

    destroy() {
        this._reset();
        if (this.graphics) {
            this.graphics.destroy();
            this.graphics = null;
        }
        this.scene = null;
    }

    _drawStartCircle(x, y) {
        if (!this.graphics) {
            return;
        }
        this.graphics.lineStyle(4, 0xffe066, 0.9);
        this.graphics.fillStyle(0xffe066, 0.25);
        this.graphics.fillCircle(x, y, 24);
        this.graphics.strokeCircle(x, y, 28);
        this.graphics.setVisible(true);
    }

    _reset() {
        if (this.graphics) {
            this.graphics.clear();
            this.graphics.setVisible(false);
        }
        this.pointerId = null;
        this.start = null;
    }
}
