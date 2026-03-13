import { GlobalSettings } from '../game/GlobalSettings.js';
import { SaveGameHelper } from '../game/SaveGameHelper.js';
import { Utils } from '../game/Utils.js';

export class SceneSettings extends Phaser.Scene {
    constructor() {
        super('SceneSettings');
    }

    preload() {
        const progress = Utils.createLoadingProgressBar(this, { text: 'Loading settings...', backgroundColor: '#000000' });
        this.load.on('progress', progress.updateProgress);
        this.load.on('complete', progress.destroyProgress);
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    create() {
        this.cameras.main.setBackgroundColor('#000000');

        // Back button lives outside the scroll panel, always visible at the top.
        this.backBtn = this.add.text(0, 0, '↩', {
            fontFamily: 'Arial',
            color: '#4a90e2',
            stroke: '#000',
            strokeThickness: 2,
        }).setOrigin(0.5)
            .setInteractive({ cursor: 'pointer' })
            .on('pointerdown', () => this.scene.start('SceneHome'))
            .on('pointerover',  () => this.backBtn.setColor('#FFFFFF'))
            .on('pointerout',   () => this.backBtn.setColor('#4a90e2'))
            .setDepth(10);

        // Build the scroll panel exactly once.
        // updateLayout() will only reposition + resize it — never destroy it.
        this.scrollPanel = this._buildScrollPanel();
        this.scrollPanel.setDepth(0);

        this.scale.on('resize', this.handleResize, this);
        this.events.on('shutdown', this.onSceneShutdown, this);

        this.updateLayout();
    }

    handleResize() {
        this.updateLayout();
    }

    onSceneShutdown() {
        this.scale.off('resize', this.handleResize, this);
        // Destroying the scrollPanel cascades to the sizer and all its children.
        if (this.scrollPanel) {
            this.scrollPanel.destroy();
            this.scrollPanel = null;
        }
        if (this.backBtn) {
            this.backBtn.destroy();
            this.backBtn = null;
        }
    }

    // ─── Layout ───────────────────────────────────────────────────────────────

    /**
     * Called on create() and on every resize event.
     * RULE: only reposition / resize the panel. Never touch sizer internals.
     */
    updateLayout() {
        // prevent recursion if layout() triggers another resize/layout event
        if (this._isUpdating) {
            return;
        }
        this._isUpdating = true;

        const { width, height } = this.scale.gameSize;
        const minDim = Math.min(width, height);
        const isLandscape = width > height;

        // Responsive font values
        const titleSize     = Math.max(Math.round(minDim * 0.09),  28);
        const subtitleSize  = Math.max(Math.round(minDim * 0.055), 18);
        const versionSize   = Math.max(Math.round(minDim * 0.032), 12);
        const toggleSize    = Math.max(Math.round(minDim * 0.055), 18);
        const checkboxSide  = Math.max(Math.round(minDim * 0.065), 22);
        const saveTitleSize = Math.max(Math.round(minDim * 0.05),  16);
        const btnTextSize   = Math.max(Math.round(minDim * 0.048), 15);
        const btnPadH       = Math.max(Math.round(minDim * 0.03),  12);
        const btnPadV       = Math.max(Math.round(minDim * 0.018),  8);
        const copySize      = Math.max(Math.round(minDim * 0.028), 10);
        const sepWidth      = Math.min(width * 0.75, 480);
        const itemSpace     = Math.max(Math.round(minDim * 0.03), 12);

        // Back button
        const navH     = Math.max(Math.round(height * 0.10), 56);
        const backSize = Math.max(Math.round(navH * 0.45), 26);
        this.backBtn.setFontSize(backSize).setPosition(20 + backSize / 2, navH / 2);

        // Update header texts
        if (this.titleObj)    this.titleObj.setFontSize(titleSize);
        if (this.subtitleObj) this.subtitleObj.setFontSize(subtitleSize);
        if (this.versionObj)  this.versionObj.setFontSize(versionSize);

        // Update separators width
        if (this.sep1) this.sep1.width = sepWidth;
        if (this.sep2) this.sep2.width = sepWidth;

        // Update toggles
        [this.musicToggle, this.updatesToggle, this.wakeLockToggle].forEach(toggle => {
            if (!toggle || !toggle.checkBg) {
                return;
            }
            const text = toggle.label.getElement('text');
            text.setFontSize(toggleSize);
            toggle.checkBg.setSize(checkboxSide, checkboxSide);
            toggle.checkmark.setFontSize(toggleSize);
            toggle.label.layout();
        });

        // Update difficulty dropdown font sizes
        if (this.difficultyDropdown) {
            const { label, dropDown, labelTextObj } = this.difficultyDropdown;
            if (labelTextObj) labelTextObj.setFontSize(toggleSize);
            if (dropDown) {
                const dropDownWidth = Math.max(140, Math.round(minDim * 0.25));
                dropDown.setMinSize(dropDownWidth, 0);
                const textEl = dropDown.getElement('text');
                if (textEl) textEl.setFontSize(toggleSize);
            }
            if (label) label.layout();
        }

        // Save section
        if (this.saveSectionTitle) this.saveSectionTitle.setFontSize(saveTitleSize);
        if (this.saveSectionDescription) {
            this.saveSectionDescription.setFontSize(Math.max(Math.round(minDim * 0.03), 14));
            this.saveSectionDescription.setWordWrapWidth(Math.min(width * 0.8, 520));
        }

        // Buttons
        [this.exportBtnLabel, this.importBtnLabel].forEach(label => {
            if (!label) return;
            const text = label.getElement('text');
            if (text) text.setFontSize(btnTextSize);
            label.layout();
        });

        // Copyright
        if (this.copyrightObj) this.copyrightObj.setFontSize(copySize);

        // Reposition/rescale panel
        const panelW = width;
        const panelH = height - navH;
        this.scrollPanel
            .setPosition(width / 2, navH + panelH / 2)
            .setMinSize(panelW, panelH)
            .layout();

        // done updating
        this._isUpdating = false;
    }

    // ─── Panel builders (called once in create) ───────────────────────────────

    _buildScrollPanel() {
        const sizer = this._buildSizer();

        const panel = this.rexUI.add.scrollablePanel({
            x: 0, y: 0,
            width: 100, height: 100,
            scrollMode: 0,
            panel: {
                child: sizer,
                mask: { padding: 1 },
            },
            slider: {
                track: this.rexUI.add.roundRectangle(0, 0, 7, 10, 3, 0x222244),
                thumb: this.rexUI.add.roundRectangle(0, 0, 7, 40, 3, 0x4a90e2),
                position: 'right',
                hideUnscrollableSlider: true,
            },
            mouseWheelScroller: { focus: false, speed: 1 },
            space: { left: 10, right: 10, top: 8, bottom: 8, panel: 8 },
        });

        // RexUI scrollablePanel intercepts pointer events for scrolling.
        // setChildrenInteractive is the standard way to get clicks on children.
        panel.setChildrenInteractive({ targets: [panel.getElement('panel')] });
        panel.on('child.click', (child) => child.settingsAction?.());
        panel.on('child.over',  (child) => child.onHoverIn?.());
        panel.on('child.out',   (child) => child.onHoverOut?.());

        return panel;
    }

    _buildSizer() {
        const { width, height } = this.scale.gameSize;
        const minDim = Math.min(width, height);

        // Responsive font sizes
        const titleSize     = Math.max(Math.round(minDim * 0.09),  28) + 'px';
        const subtitleSize  = Math.max(Math.round(minDim * 0.055), 18) + 'px';
        const versionSize   = Math.max(Math.round(minDim * 0.032), 12) + 'px';
        const toggleFontSize = Math.max(Math.round(minDim * 0.055), 18);
        const toggleSize    = toggleFontSize + 'px';
        const checkboxSide  = Math.max(Math.round(minDim * 0.065), 22);
        const saveTitleSize = Math.max(Math.round(minDim * 0.05),  16) + 'px';
        const btnTextSize   = Math.max(Math.round(minDim * 0.048), 15) + 'px';
        const copySize      = Math.max(Math.round(minDim * 0.028), 10) + 'px';
        const sepWidth      = Math.min(width * 0.75, 480);
        const btnPadH       = Math.max(Math.round(minDim * 0.03),  12);
        const btnPadV       = Math.max(Math.round(minDim * 0.018),  8);

        // Header
        this.titleObj = this.add.text(0, 0, GlobalSettings.gameName, {
            fontFamily: '"Arial Black", Gadget, sans-serif',
            fontSize: titleSize,
            color: '#4a90e2',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5);

        this.subtitleObj = this.add.text(0, 0, 'Settings', {
            fontFamily: 'Arial',
            fontSize: subtitleSize,
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.versionObj = this.add.text(0, 0, `v${GlobalSettings.version}`, {
            fontFamily: 'Arial',
            fontSize: versionSize,
            color: '#888888',
        }).setOrigin(0.5);

        // Separators
        this.sep1 = this.rexUI.add.roundRectangle(0, 0, sepWidth, 1, 0, 0x444466);
        this.sep2 = this.rexUI.add.roundRectangle(0, 0, sepWidth, 1, 0, 0x444466);

        // Toggles
        this.musicToggle = this._createToggle(
            'Music', GlobalSettings.musicEnabled, checkboxSide, toggleSize, () => {
                GlobalSettings.toggleMusic();
                return GlobalSettings.musicEnabled;
            }
        );

        this.updatesToggle = this._createToggle(
            'Show Updates', GlobalSettings.updatesEnabled, checkboxSide, toggleSize, () => {
                GlobalSettings.toggleUpdates();
                return GlobalSettings.updatesEnabled;
            }
        );

        this.wakeLockToggle = this._createToggle(
            'Wake Lock', GlobalSettings.wakeLockEnabled, checkboxSide, toggleSize, () => {
                GlobalSettings.toggleWakeLock();
                return GlobalSettings.wakeLockEnabled;
            }
        );

        // Difficulty selector
        const dropDownWidth = Math.max(140, Math.round(minDim * 0.25));
        this.difficultyDropdown = this._createDifficultyDropdown(toggleFontSize, dropDownWidth);

        // Save section
        this.saveSectionTitle = this.add.text(0, 0, 'Saves', {
            fontFamily: 'Arial',
            fontSize: saveTitleSize,
            color: '#b1c9ff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.exportBtnLabel = this._createButton('📤 Export Scores', btnTextSize, btnPadH, btnPadV, () => this.handleExport());
        this.importBtnLabel = this._createButton('📥 Import Scores', btnTextSize, btnPadH, btnPadV, () => this.handleImport());

        // Copyright
        this.copyrightObj = this.add.text(0, 0,
            `© ${new Date().getFullYear()} https://github.com/tazzit24/`, {
            fontFamily: 'Arial',
            fontSize: copySize,
            color: '#ffffff',
        }).setOrigin(0.5);
        this.copyrightObj.settingsAction = () => window.open?.('https://github.com/tazzit24/', '_blank');
        this.copyrightObj.onHoverIn  = () => this.copyrightObj.setColor('#4a90e2');
        this.copyrightObj.onHoverOut = () => this.copyrightObj.setColor('#ffffff');

        // Item spacing also scales
        const itemSpace = Math.max(Math.round(minDim * 0.03), 12);

        // Assemble sizer — items added ONCE, never re-added
        const sizer = this.rexUI.add.sizer({
            orientation: 'y',
            space: { item: itemSpace, top: itemSpace, bottom: itemSpace },
        });

        sizer.add(this.titleObj,                 { align: 'center' });
        sizer.add(this.subtitleObj,              { align: 'center' });
        sizer.add(this.versionObj,               { align: 'center', padding: { bottom: itemSpace } });
        sizer.add(this.sep1,                     { align: 'center', padding: { bottom: itemSpace } });
        // let toggles stretch full width so the left-aligned icon appears flush
        sizer.add(this.musicToggle.label,        { align: 'left', expand: true });
        sizer.add(this.updatesToggle.label,      { align: 'left', expand: true });
        sizer.add(this.wakeLockToggle.label,     { align: 'left', expand: true });
        sizer.add(this.difficultyDropdown.label, { align: 'left', expand: true });
        sizer.add(this.sep2,                     { align: 'center', padding: { top: itemSpace, bottom: itemSpace } });
        sizer.add(this.saveSectionTitle,         { align: 'center', padding: { bottom: Math.round(itemSpace * 0.5) } });
        sizer.add(this.exportBtnLabel,           { align: 'center' });
        sizer.add(this.importBtnLabel,           { align: 'center' });
        sizer.add(this.copyrightObj,             { align: 'center', padding: { top: itemSpace * 2 } });

        return sizer;
    }

    // ─── UI Factories ─────────────────────────────────────────────────────────

    _createToggle(labelText, initialState, checkboxSide, fontSize, callback) {
        const checkBg   = this.add.rectangle(0, 0, checkboxSide, checkboxSide, 0x333333).setStrokeStyle(2, 0xffffff);
        const checkmark = this.add.text(0, 0, '✓', {
            fontFamily: 'Arial', fontSize: fontSize, color: '#4a90e2', fontStyle: 'bold',
        }).setOrigin(0.5).setVisible(initialState);

        const checkbox = this.rexUI.add.overlapSizer({ width: checkboxSide, height: checkboxSide });
        checkbox.add(checkBg,   { expand: false, align: 'center' });
        checkbox.add(checkmark, { expand: false, align: 'center' });

        const textObj = this.add.text(0, 0, labelText, {
            fontFamily: 'Arial', fontSize: fontSize, color: '#ffffff',
        });

        const label = this.rexUI.add.label({
            orientation: 'x',
            align: 'left',            // place icon at left edge of label
            text: textObj,
            icon: checkbox,
            space: { icon: 12, left: 10, right: 10 },
        });

        label.addBackground(this.rexUI.add.roundRectangle(0, 0, 2, 2, 0, 0x000000, 0));

        // Store callback + refs on label so the panel-level child.click handler can use them
        label.settingsAction = () => { checkmark.setVisible(callback()); };

        return { label, checkBg, checkmark, textObj };
    }

    _createDifficultyDropdown(fontSize, dropdownWidth) {
        const options = [
            { text: 'Easy',   value: 'easy'   },
            { text: 'Normal', value: 'normal' },
        ];

        const currentOption = options.find(o => o.value === GlobalSettings.difficulty) || options[0];

        // dropDownList IS a Label — it MUST have background + text at the top level.
        // Without them getElement(...) inside openListPanel returns undefined and crashes.
        const dropDown = this.rexUI.add.dropDownList({
            background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 6, 0x1a1a2e).setStrokeStyle(1, 0x4a90e2),
            text: this.add.text(0, 0, currentOption.text, {
                fontFamily: 'Arial',
                fontSize: fontSize,
                color: '#4a90e2',
                fontStyle: 'bold',
            }),
            space: { left: 10, right: 10, top: 4, bottom: 4 },

            options,

            list: {
                createBackgroundCallback: (scene) => {
                    return scene.rexUI.add.roundRectangle(0, 0, 2, 2, 8, 0x0a1525).setStrokeStyle(1, 0x4a90e2);
                },
                createButtonCallback: (scene, option) => {
                    return scene.rexUI.add.label({
                        background: scene.rexUI.add.roundRectangle(0, 0, 2, 2, 0, 0x0a1525),
                        text: scene.add.text(0, 0, option.text, {
                            fontFamily: 'Arial',
                            fontSize: fontSize,
                            color: '#ffffff',
                        }),
                        space: { left: 12, right: 12, top: 6, bottom: 6 },
                    });
                },
                onButtonClick: (button, index) => {
                    const option = options[index];
                    if (!option) return;
                    GlobalSettings.difficulty = option.value;
                    GlobalSettings.saveSettings();
                    // Manually update the displayed text on the collapsed button
                    dropDown.getElement('text')?.setText(option.text);
                },
            },
        });

        dropDown.setMinSize(dropdownWidth, 0);
        dropDown.layout();

        const labelTextObj = this.add.text(0, 0, 'Difficulty', {
            fontFamily: 'Arial', fontSize: fontSize + 'px', color: '#ffffff',
        });

        // "Difficulty" text on the left (as 'text'), dropdown widget on the right (as 'action')
        const label = this.rexUI.add.label({
            orientation: 'x',
            align: 'left',
            text: labelTextObj,
            action: dropDown,
            space: { action: 12, left: 10, right: 10, top: 4, bottom: 4 },
        });
        label.addBackground(this.rexUI.add.roundRectangle(0, 0, 2, 2, 0, 0x000000, 0));

        // child.click on the scrollPanel will call this, opening/closing the list
        label.settingsAction = () => dropDown.toggleListPanel();

        return { label, dropDown, labelTextObj };
    }

    _createButton(text, fontSize, padH, padV, onClick) {
        const bg  = this.rexUI.add.roundRectangle(0, 0, 0, 0, 8, 0x1a1a2e).setStrokeStyle(2, 0x4a90e2);
        const txt = this.add.text(0, 0, text, {
            fontFamily: 'Arial', fontSize: fontSize, color: '#ffffff',
        });

        const label = this.rexUI.add.label({
            background: bg,
            text: txt,
            space: { left: padH * 2, right: padH * 2, top: padV, bottom: padV },
        });

        // Store refs so panel child.click/over/out handlers work
        label.settingsAction = onClick;
        label.onHoverIn  = () => bg.setFillStyle(0x2a3a6e);
        label.onHoverOut = () => bg.setFillStyle(0x1a1a2e);

        return label;
    }

    // ─── Actions ──────────────────────────────────────────────────────────────

    handleExport() {
        SaveGameHelper.downloadScores();
        this.showToast('Saves exported!');
    }

    async handleImport() {
        const selection = await SaveGameHelper.selectScoresFile();
        if (!selection.success) {
            this.showToast(selection.message || 'Import cancelled');
            return;
        }

        const confirmed = await this.confirmImportOverwrite(selection);
        if (!confirmed) {
            this.showToast('Import cancelled');
            return;
        }

        const result = SaveGameHelper.importScores(selection.data);
        this.showToast(result.message);
    }

    async confirmImportOverwrite(selection) {
        const { width, height } = this.scale.gameSize;
        const dialog = Utils.CreateCustomDialog(this, {
            titleText: 'Overwrite local scores?',
            contentText: this.buildImportSummary(selection),
            confirmText: 'Overwrite',
            cancelText: 'Cancel',
        });
        dialog.setPosition(width / 2, height / 2);
        dialog.layout();
        const response = await dialog.modalPromise({
            manualClose: true,
            duration: { in: 150, out: 150 },
        });
        return response && response.text === 'Overwrite';
    }

    buildImportSummary(selection) {
        const lines = [];
        if (selection.fileName) lines.push(`File: ${selection.fileName}`);
        const d = this.formatExportDate(selection.exportDate);
        if (d) lines.push(`Exported: ${d}`);
        if (typeof selection.levelCount === 'number') lines.push(`Levels: ${selection.levelCount}`);
        lines.push('This will overwrite the current local save.');
        return lines.join('\n');
    }

    formatExportDate(isoString) {
        if (!isoString) return null;
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return null;
        const pad = (v) => String(v).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    showToast(message) {
        const { width } = this.scale.gameSize;
        const toast = this.add.text(width / 2, 24, message, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#333355',
            padding: { x: 14, y: 8 },
        }).setOrigin(0.5).setDepth(1000);
        this.time.delayedCall(3000, () => toast.destroy());
    }
}
