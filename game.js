class DOGame {
    constructor() {
        this.selectedLevel = 0;
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
            this.selectedLevel = parseInt(e.target.value) + 2;
        });
        this.elements.colorMode.addEventListener('change', (e) => {
            this.colorMode = e.target.checked;
            this.drawGame();
        });
        this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }
    showMainMenu() { this.showScreen('mainMenu'); this.resetGame(); }
    showRules() { this.showScreen('rules'); }

    startGame() {
        if (this.selectedLevel === 0) {
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
    const TOP_MARGIN = 80; // ← 上端に余裕をつける

    // ダイヤ型の盤面の高さは (N-1)*s + s
    const boardHeight = (N - 1) * s + s;
    const canvasW = ((N - 1) * s) + s * 2 + margin * 2;
    const canvasH = boardHeight + TOP_MARGIN + margin * 2;

    // canvasサイズに余裕をもたせて大きめに
    this.canvas.width = canvasW;
    this.canvas.height = canvasH;

    this.centerX = Math.floor(canvasW / 2);
    // ダイヤの一番上（y=0,x=0〜N-1）の中心y座標がTOP_MARGIN
    // 各マスのscreenY計算式から、y=0,x=0の位置をTOP_MARGINに合わせる
    // 通常: centerY + (x+y-N+1)*s/2
    // y=0,x=0の場合→centerY + (0+0-N+1)*s/2 = centerY - (N-1)/2*s
    // これがTOP_MARGINになるようにする
    this.centerY = TOP_MARGIN + ((N - 1) / 2) * s;

    this.ms = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
        this.ms.push({
            x, y,
            screenX: this.centerX + (x - y) * s / 2,
            screenY: this.centerY + (x + y - N + 1) * s / 2,
            value: this.mapData[y][x]
        });
    this.tiles = this.ms.filter(cell => cell.value < 999);
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
        this.drawGrid();
        this.tiles.forEach(tile => {
            if (this.heldTile && tile.x === this.heldTile.x && tile.y === this.heldTile.y) return;
            this.drawDiamondTile(tile);
        });
        if (this.heldTile) {
            this.drawDiamondTile({
                ...this.heldTile,
                screenX: this.heldTileMousePos ? this.heldTileMousePos[0] : this.heldTile.screenX,
                screenY: this.heldTileMousePos ? this.heldTileMousePos[1] : this.heldTile.screenY,
                isHeld: true
            });
        }
    }
    drawDiamondTile(tile) {
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
        if (!this.heldTile) {
            const tile = this.getTileAt(cx, cy, false, true); // ← 修正! 固定された駒は対象外
            if (tile) {
                this.heldTile = { ...tile };
                this.heldTileMousePos = [cx, cy];
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
                    if (this.checkWin()) this.endGame();
                }
            }
            this.heldTile = null;
            this.heldTileMousePos = null;
            this.drawGame();
        }
    }
    onMouseMove(event) {
        if (this.heldTile) {
            const [cx, cy] = this.getCanvasXY(event);
            this.heldTileMousePos = [cx, cy];
            this.drawGame();
        }
    }
    getCanvasXY(event) {
        const rect = this.canvas.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
    }
    // emptyOnly: true ... 空きマスのみ, false ... 駒のみ
    // movableOnly: true ... 固定駒は選択不可(駒選択時だけtrueで呼ぶ)
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
        this.stopTimer();
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.elements.clearTime.textContent = `Time: ${elapsed}s`;
        setTimeout(() => { this.showScreen('end'); }, 500);
    }
    resetGame() {
        this.stopTimer();
        this.selectedLevel = 0;
        this.mapData = [];
        this.tiles = [];
        this.heldTile = null;
        this.heldTileMousePos = null;
        this.sumMouseRuRu = 0;
        this.mouseRuRu = [];
        this.elements.levelSelect.value = '';
    }
}
document.addEventListener('DOMContentLoaded', () => { new DOGame(); });