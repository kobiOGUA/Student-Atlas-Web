// Game Fixes - To be integrated into dashboard.html
// This file contains all the JavaScript fixes for the games section

// Add this script block right before the closing </body> tag in dashboard.html

/*
<script type="module">
    import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

    const gameDb = getFirestore();
    let currentGame = null;
    let gameMode = null; // 'local' or 'online'
    let currentPlayer = 'X';
    let gameBoard = ['', '', '', '', '', '', '', '', ''];
    let gameActive = false;
    let onlinePlayersListener = null;
    let gameListener = null;
    let savedPlayer1Name = '';
    let savedPlayer2Name = '';

    // Helper functions to hide/show bottom nav
    function hideBottomNav() {
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'none';
        }
    }

    function showBottomNav() {
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            bottomNav.style.display = 'flex';
        }
    }

    // Game Selection
    window.selectGame = function (game) {
        if (game === 'tictactoe') {
            document.getElementById('game-selection').classList.add('hidden');
            document.getElementById('tictactoe-game').classList.remove('hidden');
        } else if (game === 'fiftyguesses') {
            document.getElementById('game-selection').classList.add('hidden');
            document.getElementById('fiftyguesses-game').classList.remove('hidden');
            hideBottomNav(); // Hide navbar when starting game
            initFiftyGuesses();
        }
    };

    window.backToGameSelection = function () {
        showBottomNav(); // Show navbar when going back
        document.getElementById('tictactoe-game').classList.add('hidden');
        document.getElementById('fiftyguesses-game').classList.add('hidden');
        document.getElementById('fg-leaderboard').classList.add('hidden');
        document.getElementById('game-selection').classList.remove('hidden');
        resetGameViews();
    };

    function resetGameViews() {
        document.getElementById('ttt-mode-selection').classList.remove('hidden');
        document.getElementById('ttt-player-names').classList.add('hidden');
        document.getElementById('ttt-online-players').classList.add('hidden');
        document.getElementById('ttt-game-board').classList.add('hidden');
        document.getElementById('ttt-leaderboard').classList.add('hidden');
    }

    // Start Local Game with Names
    window.startLocalGameWithNames = function () {
        const player1 = document.getElementById('player1-name').value.trim() || 'Player 1';
        const player2 = document.getElementById('player2-name').value.trim() || 'Player 2';

        savedPlayer1Name = player1;
        savedPlayer2Name = player2;

        gameMode = 'local';
        currentPlayer = 'X';
        gameBoard = ['', '', '', '', '', '', '', '', ''];
        gameActive = true;

        hideBottomNav(); // Hide navbar when game starts

        document.getElementById('ttt-player-names').classList.add('hidden');
        document.getElementById('ttt-game-board').classList.remove('hidden');
        document.getElementById('player-x-name').textContent = player1;
        document.getElementById('player-o-name').textContent = player2;
        document.getElementById('game-status').textContent = `${player1}'s Turn (X)`;
        document.getElementById('game-result').classList.add('hidden');

        createBoard();
    };

    // Challenge Player (Online)
    window.challengePlayer = async function (opponentId, opponentName) {
        const uid = localStorage.getItem('kobi_atlas_uid');
        const username = localStorage.getItem('kobi_atlas_username') || 'Anonymous';

        const gameId = `${uid}_${opponentId}_${Date.now()}`;
        currentGame = gameId;

        await setDoc(doc(gameDb, 'tictactoe_games', gameId), {
            gameId: gameId,
            playerX: uid,
            playerO: opponentId,
            playerXName: username,
            playerOName: opponentName,
            board: ['', '', '', '', '', '', '', '', ''],
            currentTurn: 'X',
            status: 'waiting',
            winner: null,
            createdAt: serverTimestamp()
        });

        await updateDoc(doc(gameDb, 'onlinePlayers', uid), { inGame: true });

        hideBottomNav(); // Hide navbar when game starts

        gameMode = 'online';
        document.getElementById('ttt-online-players').classList.add('hidden');
        document.getElementById('ttt-game-board').classList.remove('hidden');
        document.getElementById('player-x-name').textContent = username + ' (You)';
        document.getElementById('player-o-name').textContent = opponentName;
        document.getElementById('game-status').textContent = 'Waiting for opponent...';

        listenToGame(gameId, 'X');
    };

    // Make Move - Only update leaderboard for online games
    async function makeMove(index) {
        if (!gameActive || gameBoard[index] !== '') return;

        if (gameMode === 'local') {
            gameBoard[index] = currentPlayer;
            createBoard();

            const result = checkWinner();
            if (result) {
                gameActive = false;
                showGameResult(result, currentPlayer);
                // Don't update leaderboard for local games
            } else {
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                const playerName = currentPlayer === 'X' ?
                    document.getElementById('player-x-name').textContent :
                    document.getElementById('player-o-name').textContent;
                document.getElementById('game-status').textContent = `${playerName}'s Turn (${currentPlayer})`;
            }
        } else if (gameMode === 'online') {
            const uid = localStorage.getItem('kobi_atlas_uid');
            const gameDoc = await getDoc(doc(gameDb, 'tictactoe_games', currentGame));
            const game = gameDoc.data();

            const mySymbol = game.playerX === uid ? 'X' : 'O';
            if (currentPlayer !== mySymbol) return;

            gameBoard[index] = mySymbol;
            const result = checkWinner();

            await updateDoc(doc(gameDb, 'tictactoe_games', currentGame), {
                board: gameBoard,
                currentTurn: mySymbol === 'X' ? 'O' : 'X',
                status: result ? 'finished' : 'active',
                winner: result
            });

            // Only update leaderboard for online games
            if (result && result !== 'draw') {
                await updateLeaderboard(mySymbol);
            }
        }
    }

    // Quit Game
    window.quitGame = async function () {
        if (gameMode === 'online' && currentGame) {
            const uid = localStorage.getItem('kobi_atlas_uid');
            await updateDoc(doc(gameDb, 'onlinePlayers', uid), { inGame: false });
            await deleteDoc(doc(gameDb, 'tictactoe_games', currentGame));
            if (gameListener) gameListener();
        }

        showBottomNav(); // Show navbar when quitting game

        document.getElementById('ttt-game-board').classList.add('hidden');
        document.getElementById('ttt-mode-selection').classList.remove('hidden');
        currentGame = null;
        gameMode = null;
    };

    window.backToTTTMode = function () {
        showBottomNav(); // Show navbar when going back

        document.getElementById('ttt-online-players').classList.add('hidden');
        document.getElementById('ttt-leaderboard').classList.add('hidden');
        document.getElementById('ttt-player-names').classList.add('hidden');
        document.getElementById('ttt-mode-selection').classList.remove('hidden');

        if (onlinePlayersListener) onlinePlayersListener();
    };

    // 50 Guesses Leaderboard Functions
    window.showFGLeaderboard = async function () {
        document.getElementById('fg-game-over').classList.add('hidden');
        document.getElementById('fiftyguesses-game').classList.add('hidden');
        document.getElementById('fg-leaderboard').classList.remove('hidden');

        const leaderboardList = document.getElementById('fg-leaderboard-list');
        leaderboardList.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';

        const snapshot = await getDocs(collection(gameDb, 'fiftyguesses_leaderboard'));
        const players = [];

        snapshot.forEach(doc => {
            players.push({ id: doc.id, ...doc.data() });
        });

        players.sort((a, b) => b.highScore - a.highScore);

        if (players.length === 0) {
            leaderboardList.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">No games played yet</div>';
            return;
        }

        leaderboardList.innerHTML = '';
        players.forEach((player, index) => {
            const rank = index + 1;
            const rankColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-color)';
            const rankDisplay = `#${rank}`;

            const playerCard = document.createElement('div');
            playerCard.style.cssText = 'padding: 16px; background: var(--card-bg); border-radius: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;';
            playerCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 20px; font-weight: bold; min-width: 40px; color: ${rankColor};">${rankDisplay}</div>
                    <div>
                        <div style="font-weight: bold;">${player.username}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">
                            Level ${player.highLevel} • ${player.gamesPlayed} games played
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 20px; font-weight: bold; color: var(--primary-color);">${player.highScore}</div>
                    <div style="font-size: 10px; color: var(--text-secondary);">HIGH SCORE</div>
                </div>
            `;
            leaderboardList.appendChild(playerCard);
        });
    };

    window.hideFGLeaderboard = function () {
        document.getElementById('fg-leaderboard').classList.add('hidden');
        document.getElementById('fiftyguesses-game').classList.remove('hidden');
    };

    async function updateFGLeaderboard(score, level) {
        const uid = localStorage.getItem('kobi_atlas_uid');
        const username = localStorage.getItem('kobi_atlas_username') || 'Anonymous';

        const leaderboardRef = doc(gameDb, 'fiftyguesses_leaderboard', uid);
        const leaderboardDoc = await getDoc(leaderboardRef);

        if (leaderboardDoc.exists()) {
            const data = leaderboardDoc.data();
            await updateDoc(leaderboardRef, {
                highScore: Math.max(data.highScore, score),
                highLevel: Math.max(data.highLevel, level),
                gamesPlayed: data.gamesPlayed + 1
            });
        } else {
            await setDoc(leaderboardRef, {
                uid: uid,
                username: username,
                highScore: score,
                highLevel: level,
                gamesPlayed: 1
            });
        }
    }
</script>
*/
