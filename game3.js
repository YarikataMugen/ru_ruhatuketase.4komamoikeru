class DOGame {
    constructor() {
        this.selectedLevel = 3; // ★デフォルトレベル3（1+2）
        this.mapData = [];
        this.mouseRuRu = [];
        this.boardSize = 0;
        this.tileSize = 70;
        this.tiles = [];
        this.startTime = 0;
        this.sumMouseRuRu = 0;
        this.colorMode = true;
        this.heldTile = null;
        this.heldTileMousePos = null;
        this.selectedTileValue = null;
        this.isCleared = false;
        this.clearButtonRect = null;
        this.initializeElements();
        this.setupEventListeners();
    }
    
    initializeElements() {
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            rules: document.getElementById('rulesScreen'),
            game: document.getElementById('gameScreen'),
            end: document.getElementById('endScreen')
        };
        this.elements = {
            levelSelect: document.getElementById('levelSelect'),
            playButton: document.getElementById('playButton'),
            rulesButton: document.getElementById('rulesButton'),
            closeRulesButton: document.getElementById('closeRulesButton'),
            retireButton: document.getElementById('retireButton'),
            backToMenuButton: document.getElementById('backToMenuButton'),
            timer: document.getElementById('timer'),
            clearTime: document.getElementById('clearTime'),
            levelClearInfo: document.getElementById('levelClearInfo'),
            colorMode: document.getElementById('colorMode')
        };
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    setupEventListeners() {
        this.elements.playButton.addEventListener('click', () => this.startGame());
        this.elements.rulesButton.addEventListener('click', () => this.showRules());
        this.elements.closeRulesButton.addEventListener('click', () => this.showMainMenu());
        this.elements.retireButton.addEventListener('click', () => this.showMainMenu());
        this.elements.backToMenuButton.addEventListener('click', () => this.showMainMenu());
        this.elements.levelSelect.addEventListener('change', (e) => {
            this.selectedLevel = parseInt(e.target.value) + 3;
        });
        this.elements.colorMode.addEventListener('change', (e) => {
            this.colorMode = e.target.checked;
            if (this.screens.game.classList.contains('active')) {
                this.drawGame();
            }
        });
        this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        this.elements.levelSelect.value = "0";
        this.selectedLevel = 3;
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
        
        if (screenName !== 'game' && this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    showMainMenu() { 
        this.showScreen('mainMenu'); 
        this.resetGame(); 
    }
    
    showRules() { this.showScreen('rules'); }

    startGame() {
        if (this.selectedLevel === 0 || this.selectedLevel < 3) {
            alert('レベルを選択してください');
            return;
        }
        this.showScreen('game');
        this.initializeGame();
        this.startTimer();
    }
    
    initializeGame() {
        this.boardSize = this.selectedLevel;
        this.generateDiamondMap();
        this.setupCanvas();
        this.drawGame();
    }
    
    generateDiamondMap() {
        const N = this.boardSize;
        this.mapData = Array(N).fill().map(() => Array(N).fill(999));
        this.mouseRuRu = Array(N).fill().map(() => Array(N).fill(0));
        this.tiles = [];
        let upperPos = [], lowerPos = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
            if (x + y < N - 1) upperPos.push([x, y]);
            else if (x + y > N - 1) lowerPos.push([x, y]);
        }
        let upperVals = [];
        for (let i = 1; i <= upperPos.length; i++) upperVals.push(i);
        upperVals = upperVals.sort(() => Math.random() - 0.5);
        let lowerVals = [];
        for (let i = 1; i <= lowerPos.length; i++) lowerVals.push(i);
        lowerVals = lowerVals.sort(() => Math.random() - 0.5);
        upperPos.forEach(([x, y], idx) => { this.mapData[y][x] = upperVals[idx]; });
        lowerPos.forEach(([x, y], idx) => { this.mapData[y][x] = lowerVals[idx]; });
    }
    
    setupCanvas() {
        const N = this.boardSize, s = this.tileSize, margin = s;
        const TOP_MARGIN = 120;

        const boardHeight = (N - 1) * s + s;
        const canvasW = ((N - 1) * s) + s * 2 + margin * 2;
        const canvasH = boardHeight + TOP_MARGIN + margin * 2;

        this.canvas.width = canvasW;
        this.canvas.height = canvasH;

        this.centerX = Math.floor(canvasW / 2);
        this.centerY = TOP_MARGIN;

        this.ms = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
            this.ms.push({
                x, y,
                screenX: this.centerX + (x - y) * s / 2,
                screenY: this.centerY + (x + y) * s / 2,
                value: this.mapData[y][x]
            });
        this.tiles = this.ms.filter(cell => cell.value < 999);

        if (this.canvasScale === undefined) {
            const maxW = window.innerWidth;
            const maxH = window.innerHeight;
            this.canvasScale = Math.min(1, maxW / canvasW, maxH / canvasH);
            this.canvas.style.width = (canvasW * this.canvasScale) + 'px';
            this.canvas.style.height = (canvasH * this.canvasScale) + 'px';
        }
    }
    
    drawGrid() {
        const s = this.tileSize;
        this.ctx.save();
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;
        for (const cell of this.ms) {
            const cx = cell.screenX, cy = cell.screenY;
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy - s / 2);
            this.ctx.lineTo(cx + s / 2, cy);
            this.ctx.lineTo(cx, cy + s / 2);
            this.ctx.lineTo(cx - s / 2, cy);
            this.ctx.closePath();
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
    
    drawGame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // ★豪華なゲーム背景
        this.ctx.save();

        // ベースのグラデーション
        const baseGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        baseGradient.addColorStop(0, '#f8f9fa');
        baseGradient.addColorStop(0.3, '#e9ecef');
        baseGradient.addColorStop(0.7, '#dee2e6');
        baseGradient.addColorStop(1, '#ced4da');
        this.ctx.fillStyle = baseGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 放射状のグラデーション（中央の光）
        const centerGradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.boardSize * this.tileSize * 1.5
        );
        centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        centerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = centerGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 微細なドット模様（削除済み）

        // 装飾的な円
        this.ctx.globalAlpha = 0.1;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.boardSize * this.tileSize * 0.8;
            const x = this.centerX + Math.cos(angle) * radius;
            const y = this.centerY + Math.sin(angle) * radius;

            const circleGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 50);
            circleGradient.addColorStop(0, '#40CFFF');
            circleGradient.addColorStop(1, 'rgba(64, 207, 255, 0)');
            this.ctx.fillStyle = circleGradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 50, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;

        // 波紋効果
        this.ctx.globalAlpha = 0.08;
        for (let i = 0; i < 5; i++) {
            const waveRadius = (this.boardSize * this.tileSize * 0.3) + (i * 20);
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, waveRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#40CFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;

        // 四隅の装飾
        this.ctx.globalAlpha = 0.15;
        const corners = [
            {x: 0, y: 0}, {x: this.canvas.width, y: 0},
            {x: 0, y: this.canvas.height}, {x: this.canvas.width, y: this.canvas.height}
        ];
        corners.forEach(corner => {
            const cornerGradient = this.ctx.createRadialGradient(
                corner.x, corner.y, 0,
                corner.x, corner.y, 100
            );
            cornerGradient.addColorStop(0, '#5555FF');
            cornerGradient.addColorStop(1, 'rgba(85, 85, 255, 0)');
            this.ctx.fillStyle = cornerGradient;
            this.ctx.beginPath();
            this.ctx.arc(corner.x, corner.y, 100, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        this.ctx.restore();

        this.drawGrid();
        this.tiles.forEach(tile => {
            if (this.heldTile && tile.x === this.heldTile.x && tile.y === this.heldTile.y) return;
            this.drawDiamondTile(tile, this.selectedTileValue !== null && tile.value === this.selectedTileValue);
        });
        if (this.heldTile) {
            this.drawDiamondTile({
                ...this.heldTile,
                screenX: this.heldTileMousePos ? this.heldTileMousePos[0] : this.heldTile.screenX,
                screenY: this.heldTileMousePos ? this.heldTileMousePos[1] : this.heldTile.screenY,
                isHeld: true
            }, true);
        }

        // ★著作権表示
        this.ctx.save();
        this.ctx.font = "11px Arial";
        this.ctx.fillStyle = "rgba(102, 102, 102, 0.5)";
        this.ctx.textAlign = "left";
        this.ctx.fillText("このゲームをパクらないで", 10, this.canvas.height - 50);
        this.ctx.fillText("作成日: 2025/7/5", 10, this.canvas.height - 35);
        this.ctx.fillText("クリエイター: Yaminion", 10, this.canvas.height - 20);
        this.ctx.restore();

        // ★クリア時の表示（上部に配置）
        if (this.isCleared) {
            this.ctx.save();
            this.ctx.font = "bold 32px Arial";
            this.ctx.fillStyle = "#40CFFF";
            this.ctx.strokeStyle = "#fff";
            this.ctx.lineWidth = 2;
            this.ctx.textAlign = "center";
            this.ctx.shadowColor = "rgba(64, 207, 255, 0.5)";
            this.ctx.shadowBlur = 20;
            this.ctx.strokeText("🎉 CLEAR! 🎉", this.canvas.width / 2, 50);
            this.ctx.fillText("🎉 CLEAR! 🎉", this.canvas.width / 2, 50);
            this.ctx.restore();

            // 次へボタン（右上に配置）
            const btnX = this.canvas.width - 100;
            const btnY = 80;
            const btnW = 160, btnH = 50;

            this.ctx.save();
            const buttonGradient = this.ctx.createLinearGradient(btnX - btnW/2, btnY - btnH/2, btnX + btnW/2, btnY + btnH/2);
            buttonGradient.addColorStop(0, '#40CFFF');
            buttonGradient.addColorStop(1, '#5555FF');

            // ★roundRectの代わりに手動で角丸四角形を描画
            this.drawRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 15);
            this.ctx.fillStyle = buttonGradient;
            this.ctx.shadowColor = "rgba(64, 207, 255, 0.4)";
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.strokeStyle = "#fff";
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.font = "bold 18px Arial";
            this.ctx.fillStyle = "#fff";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText("✨ 次へ ✨", btnX, btnY);
            this.ctx.restore();
            
            this.clearButtonRect = { x: btnX - btnW / 2, y: btnY - btnH / 2, w: btnW, h: btnH };
        } else {
            this.clearButtonRect = null;
        }
    }
    
    // ★手動で角丸四角形を描画する関数
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    drawDiamondTile(tile, highlight = false) {
        const s = this.tileSize * 0.8, cx = tile.screenX, cy = tile.screenY;
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#E95D72', '#66B933', '#A575F5', '#FF9D32'];
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - s / 2);
        this.ctx.lineTo(cx + s / 2, cy);
        this.ctx.lineTo(cx, cy + s / 2);
        this.ctx.lineTo(cx - s / 2, cy);
        this.ctx.closePath();
        this.ctx.fillStyle = this.colorMode ? colors[(tile.value - 1) % colors.length] : '#E0E0E0';
        this.ctx.globalAlpha = tile.isHeld ? 0.7 : 1;
        this.ctx.fill(); this.ctx.globalAlpha = 1;
        
        if (highlight) {
            this.ctx.save();
            this.ctx.strokeStyle = "#40CFFF";
            this.ctx.lineWidth = 6;
            this.ctx.shadowColor = "#40CFFF";
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            this.ctx.restore();
        }
        if (this.mouseRuRu[tile.y][tile.x] === 1) { this.ctx.strokeStyle = '#FFD700'; this.ctx.lineWidth = 3; }
        else if (tile.isHeld) { this.ctx.strokeStyle = '#FF3333'; this.ctx.lineWidth = 4; }
        else { this.ctx.strokeStyle = '#333'; this.ctx.lineWidth = 2; }
        this.ctx.stroke();
        this.ctx.fillStyle = this.colorMode ? "#222" : "#333";
        this.ctx.font = `bold ${this.tileSize / 2.3}px Arial`;
        this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tile.value, cx, cy);
        this.ctx.restore();
    }
    
    onCanvasClick(event) {
        const [cx, cy] = this.getCanvasXY(event);
        
        if (this.isCleared && this.clearButtonRect) {
            const r = this.clearButtonRect;
            if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
                this.isCleared = false;
                this.clearButtonRect = null;
                this.endGame();
                return;
            }
        }
        if (!this.heldTile) {
            const tile = this.getTileAt(cx, cy, false, true);
            if (tile) {
                this.heldTile = { ...tile };
                this.heldTileMousePos = [cx, cy];
                this.selectedTileValue = tile.value;
                this.drawGame();
            } else {
                this.selectedTileValue = null;
                this.drawGame();
            }
        } else {
            const emptyTile = this.getTileAt(cx, cy, true);
            if (emptyTile && this.mapData[emptyTile.y][emptyTile.x] >= 999) {
                const sx = this.heldTile.x, sy = this.heldTile.y;
                const isNeighbor =
                    (emptyTile.x === sx && Math.abs(emptyTile.y - sy) === 1) ||
                    (emptyTile.y === sy && Math.abs(emptyTile.x - sx) === 1);
                if (isNeighbor) {
                    this.mapData[emptyTile.y][emptyTile.x] = this.heldTile.value;
                    this.mapData[sy][sx] = 999;
                    this.updateMouseRuRuAfterMove(emptyTile.x, emptyTile.y);
                    this.updateMouseRuRuAfterMove(sx, sy);
                    this.setupCanvas();
                    if (this.checkWin()) {
                        this.isCleared = true;
                        this.stopTimer();
                        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                        this.clearTimeSeconds = elapsed;
                        this.heldTile = null;
                        this.heldTileMousePos = null;
                        this.selectedTileValue = null;
                        this.drawGame();
                        return;
                    }
                }
            }
            this.heldTile = null;
            this.heldTileMousePos = null;
            this.selectedTileValue = null;
            this.drawGame();
        }
    }
    
    onMouseMove(event) {
        if (this.isCleared) return;
        
        if (this.heldTile) {
            this.heldTileMousePos = this.getCanvasXY(event);
            this.drawGame();
        }
    }
    
    getCanvasXY(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return [
            (event.clientX - rect.left) * scaleX,
            (event.clientY - rect.top) * scaleY
        ];
    }
    
    getTileAt(x, y, emptyOnly = false, movableOnly = false) {
        const s = this.tileSize * 0.8;
        let res = null;
        for (const cell of this.ms) {
            if (emptyOnly && this.mapData[cell.y][cell.x] < 999) continue;
            if (!emptyOnly && this.mapData[cell.y][cell.x] >= 999) continue;
            if (movableOnly && this.mouseRuRu[cell.y][cell.x] === 1) continue;
            const dx = Math.abs(x - cell.screenX), dy = Math.abs(y - cell.screenY);
            if (dx / (s / 2) + dy / (s / 2) <= 1) { res = cell; break; }
        }
        return res;
    }
    
    updateMouseRuRuAfterMove(x, y) {
        if (this.mapData[y][x] >= 999) return;
        const dirs = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];
        for (const dir of dirs) {
            const nx = x + dir.dx, ny = y + dir.dy;
            if (
                ny >= 0 && ny < this.mapData.length &&
                nx >= 0 && nx < this.mapData.length &&
                this.mapData[ny][nx] < 999 &&
                this.mapData[y][x] === this.mapData[ny][nx]
            ) {
                if (this.mouseRuRu[y][x] === 0) { this.mouseRuRu[y][x] = 1; this.sumMouseRuRu++; }
                if (this.mouseRuRu[ny][nx] === 0) { this.mouseRuRu[ny][nx] = 1; this.sumMouseRuRu++; }
            }
        }
    }
    
    checkWin() {
        let totalTiles = 0;
        for (let y = 0; y < this.mapData.length; y++)
            for (let x = 0; x < this.mapData.length; x++)
                if (this.mapData[y][x] < 999) totalTiles++;
        return this.sumMouseRuRu >= totalTiles;
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.elements.timer.textContent = `Time: 0s`;
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.elements.timer.textContent = `Time: ${elapsed}s`;
        }, 100);
    }
    
    stopTimer() { if (this.timerInterval) clearInterval(this.timerInterval); }
    
    endGame() {
        if (this.clearTimeSeconds !== undefined) {
            this.elements.clearTime.textContent = `Time: ${this.clearTimeSeconds}s`;
        }
        
        const currentLevel = this.selectedLevel - 2;
        this.elements.levelClearInfo.textContent = `Level ${currentLevel} クリア！`;
        
        if (currentLevel < 10) {
            const nextLevelIndex = currentLevel;
            this.elements.levelSelect.value = nextLevelIndex.toString();
            this.selectedLevel = nextLevelIndex + 3;
        }
        
        this.showScreen('end');
    }
    
    resetGame() {
        this.stopTimer();
        this.mapData = [];
        this.tiles = [];
        this.heldTile = null;
        this.heldTileMousePos = null;
        this.sumMouseRuRu = 0;
        this.mouseRuRu = [];
        this.canvasScale = undefined;
        this.isCleared = false;
        this.clearButtonRect = null;
        this.clearTimeSeconds = undefined;
        
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.elements.timer.textContent = 'Time: 0s';
    }
}

document.addEventListener('DOMContentLoaded', () => { new DOGame(); });
