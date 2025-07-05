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
        this.selectedTileValue = null; // ★追加: 選択中の値
        this.isCleared = false; // ★クリア状態
        this.clearButtonRect = null; // ★ボタン範囲
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
        
        // ★ゲーム画面以外に切り替わったときは念のためcanvasをクリア
        if (screenName !== 'game' && this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
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
        const TOP_MARGIN = 60; // ← 一番上のマスが上から60pxになるように固定

        // ダイヤ型の盤面の高さは (N-1)*s + s
        const boardHeight = (N - 1) * s + s;
        const canvasW = ((N - 1) * s) + s * 2 + margin * 2;
        const canvasH = boardHeight + TOP_MARGIN + margin * 2;

        // canvasサイズに余裕をもたせて大きめに
        this.canvas.width = canvasW;
        this.canvas.height = canvasH;

        this.centerX = Math.floor(canvasW / 2);
        // 一番上のマス（y=0,x=0〜N-1）の中心y座標がTOP_MARGINになるようにする
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

        // ★スマホ対応：最初の1回だけcanvasの表示倍率を自動調整
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
        
        // ★canvas左下に著作権表示（常に表示）
        this.ctx.save();
        this.ctx.font = "12px Arial";
        this.ctx.fillStyle = "#666";
        this.ctx.textAlign = "left";
        this.ctx.fillText("このゲームをパクらないで", 10, this.canvas.height - 50);
        this.ctx.fillText("作成日: 2025/7/5", 10, this.canvas.height - 35);
        this.ctx.fillText("クリエイター: Johnnie", 10, this.canvas.height - 20);
        this.ctx.restore();
        
        // ★クリア時のボタンと文字
        if (this.isCleared) {
            // より上に表示
            this.ctx.save();
            this.ctx.font = "bold 40px Arial";
            this.ctx.fillStyle = "#40CFFF";
            this.ctx.textAlign = "center";
            this.ctx.fillText("ゲームクリア！", this.canvas.width / 2, 30);
            this.ctx.restore();

            // 右端と下端の中心から伸ばした交点（盤面外右下）にボタン
            const N = this.boardSize, s = this.tileSize;
            const margin = s, TOP_MARGIN = 60;
            // 右端中心
            const rightX = this.centerX + (N - 1) * s / 2;
            const rightY = this.centerY + (N - 1) * s / 2;
            // 下端中心
            const bottomX = this.centerX;
            const bottomY = this.centerY + (N - 1) * s;
            // 交点（右端から水平、下端から垂直）
            const btnX = rightX + 80;
            const btnY = bottomY + 40;
            // ボタンサイズ
            const btnW = 160, btnH = 50;
            // ボタン描画
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH);
            this.ctx.fillStyle = "#40CFFF";
            this.ctx.shadowColor = "#40CFFF";
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = "#0077AA";
            this.ctx.stroke();
            this.ctx.font = "bold 28px Arial";
            this.ctx.fillStyle = "#fff";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText("次へ", btnX, btnY);
            this.ctx.restore();
            // ボタン範囲保存
            this.clearButtonRect = { x: btnX - btnW / 2, y: btnY - btnH / 2, w: btnW, h: btnH };
        } else {
            this.clearButtonRect = null;
        }
    }
    // highlight: trueなら水色で光らせる
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
        // ★水色ハイライト
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
        // ★クリア時はボタン判定
        if (this.isCleared && this.clearButtonRect) {
            const r = this.clearButtonRect;
            if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
                // ボタン押下時
                this.isCleared = false;
                this.clearButtonRect = null;
                this.endGame(); // 既存の終了画面へ
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
                        // ★クリア時にタイマーを止めて時間を記録
                        this.stopTimer();
                        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                        this.clearTimeSeconds = elapsed; // ★クリア時間を保存
                        // ★クリア時に持っている駒をリセット
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
        // ★クリア時は駒の追従を無効化
        if (this.isCleared) return;
        
        if (this.heldTile) {
            this.heldTileMousePos = this.getCanvasXY(event);
            this.drawGame();
        }
    }
    getCanvasXY(event) {
        const rect = this.canvas.getBoundingClientRect();
        // canvasのCSSサイズと実際の描画サイズの比率で補正
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return [
            (event.clientX - rect.left) * scaleX,
            (event.clientY - rect.top) * scaleY
        ];
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
        // ★クリア時間が保存されていれば表示
        if (this.clearTimeSeconds !== undefined) {
            this.elements.clearTime.textContent = `Time: ${this.clearTimeSeconds}s`;
        }
        this.showScreen('end');
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
        this.canvasScale = undefined;
        this.isCleared = false;
        this.clearButtonRect = null;
        this.clearTimeSeconds = undefined;
        
        // ★canvasをクリア
        if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // ★タイマーもリセット
        this.elements.timer.textContent = 'Time: 0s';
    }
}
document.addEventListener('DOMContentLoaded', () => { new DOGame(); });
