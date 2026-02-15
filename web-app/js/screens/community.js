// Community Feed Screen
import { getPosts, likePost, unlikePost, deletePost } from '../services/social.js';
import { getUserProfile } from '../services/user.js';
import { storage } from '../utils/storage.js';
import { formatDate } from '../utils/helpers.js';

let userCache = {};

export function renderCommunityScreen() {
    return `
    <div id="community-screen" class="screen">
        <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <h2 style="margin: 0;">Community</h2>
                <div style="display: flex; gap: 16px; align-items: center; padding-right: 20px;">
                    <button onclick="showUserSearch()" style="background: none; border: none; cursor: pointer;">
                        <ion-icon name="search-outline" style="font-size: 24px; color: white;"></ion-icon>
                    </button>
                    <button onclick="showCreatePostModal()" style="display: none;">
                        <ion-icon name="add-outline" style="font-size: 24px; color: white;"></ion-icon>
                    </button>
                    <button onclick="showNotifications()" style="background: none; border: none; cursor: pointer; position: relative;">
                        <ion-icon name="notifications-outline" style="font-size: 24px; color: white;"></ion-icon>
                        <span id="notification-badge" class="hidden" style="position: absolute; top: -4px; right: -4px; background: #FF3B30; color: white; border-radius: 10px; min-width: 18px; height: 18px; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center; padding: 0 4px;">0</span>
                    </button>
                    <button onclick="showProfileSettings()" style="background: none; border: none; cursor: pointer;">
                        <ion-icon name="person-circle-outline" style="font-size: 24px; color: white;"></ion-icon>
                    </button>
                </div>
            </div>
        </div>

        <div class="tab-buttons" style="margin-bottom: 20px;">
            <button class="tab-btn active" id="comm-feed-tab" onclick="switchCommunityTab('feed')">Feed</button>
            <button class="tab-btn" id="comm-resources-tab" onclick="switchCommunityTab('resources')">Resources</button>
            <button class="tab-btn" id="comm-games-tab" onclick="switchCommunityTab('games')">Games</button>
            <button class="tab-btn" id="comm-messages-tab" onclick="switchCommunityTab('messages')">
                Messages
                <span id="inner-message-badge" class="badge current hidden" style="margin-left: 8px; font-size: 10px; padding: 2px 6px;">0</span>
            </button>
        </div>

        <div id="community-feed-container">
            <div id="posts-feed">
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>

        <div id="community-messages-container" class="hidden">
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                <button class="btn btn-primary" onclick="showUserSearch()" style="width: auto; padding: 8px 16px; font-size: 14px;">
                    <ion-icon name="create-outline" style="margin-right: 5px;"></ion-icon> New Message
                </button>
            </div>
            <div id="conversations-list"></div>
        </div>

        <div id="community-resources-wrapper" class="hidden" style="position: relative; min-height: 80vh;">
             <!-- Resources content placeholder - loaded by loadResources() in dashboard.html script which targets this ID -->
             <div id="community-resources-container" class="hidden">
                <div class="search-bar" style="margin-bottom: 20px;">
                    <input type="text" id="resource-search-input" placeholder="Search resources (code, title)..." oninput="filterResources(this.value)">
                </div>
                <div id="resources-list" style="padding-bottom: 80px;"></div>
                <button class="fab" onclick="handleFabClick()"><ion-icon name="add"></ion-icon></button>
             </div>
        </div>

        <!-- Games Container -->
        <div id="games-container-fixed" class="hidden" style="min-height: 100vh; position: relative; z-index: 10; opacity: 1; pointer-events: auto;">
            <!-- Game Selection -->
            <div id="game-selection">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; font-size: 20px;">Available Games</h3>
                    <div onclick="showTTTLeaderboard()" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 12px; padding: 8px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <ion-icon name="trophy-outline" style="font-size: 18px; color: white;"></ion-icon>
                        <span style="font-size: 12px; color: white; font-weight: bold;">Leaderboard</span>
                    </div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;">
                    <!-- Tic-Tac-Toe Card -->
                    <div onclick="selectGame('tictactoe')" style="flex: 1; min-width: 280px; max-width: 400px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 24px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.25)';" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                            <ion-icon name="grid-outline" style="font-size: 48px; color: white;"></ion-icon>
                            <div style="flex: 1;">
                                <h4 style="margin: 0; font-size: 20px; color: white;">Tic-Tac-Toe</h4>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Classic strategy game</p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                            <ion-icon name="people-outline" style="font-size: 16px; color: white;"></ion-icon>
                            <span style="font-size: 12px; color: white;">2 Players Required</span>
                        </div>
                    </div>

                    <!-- 50 Guesses Card -->
                    <div onclick="selectGame('fiftyguesses')" style="flex: 1; min-width: 280px; max-width: 400px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 16px; padding: 24px; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.25)';" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                            <ion-icon name="help-circle-outline" style="font-size: 48px; color: white;"></ion-icon>
                            <div style="flex: 1;">
                                <h4 style="margin: 0; font-size: 20px; color: white;">50 Guesses</h4>
                                <p style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.8);">Number guessing challenge</p>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(255,255,255,0.2); border-radius: 8px;">
                            <ion-icon name="person-outline" style="font-size: 16px; color: white;"></ion-icon>
                            <span style="font-size: 12px; color: white;">Single Player</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tic-Tac-Toe Game -->
            <div id="tictactoe-game" class="hidden">
                <!-- Mode Selection -->
                <div id="ttt-mode-selection" class="stat-card" style="margin-bottom: 20px; padding: 32px;">
                    <button onclick="backToGameSelection()"
                        style="background: none; border: none; color: var(--text-color); font-size: 20px; cursor: pointer; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; transition: all 0.3s;"
                        onmouseenter="this.style.background='var(--card-bg)'"
                        onmouseleave="this.style.background='none'">
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Back</span>
                    </button>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <h2
                            style="margin: 0 0 8px 0; font-size: 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                            Choose Your Mode</h2>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Select how you want to
                            play Tic-Tac-Toe</p>
                    </div>

                    <div style="max-width: 800px; margin: 0 auto;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <!-- Local Multiplayer Card -->
                            <div onclick="showPlayerNameInput()"
                                style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 24px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;"
                                onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(102, 126, 234, 0.3)'"
                                onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                <div
                                    style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">
                                    <ion-icon name="phone-portrait-outline"></ion-icon>
                                </div>
                                <div style="position: relative; z-index: 1;">
                                    <div
                                        style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                                        <div
                                            style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                            <ion-icon name="phone-portrait-outline"
                                                style="font-size: 32px; color: white;"></ion-icon>
                                        </div>
                                        <div style="flex: 1;">
                                            <h3 style="margin: 0; font-size: 22px; color: white; font-weight: 700;">
                                                Local Multiplayer</h3>
                                            <p
                                                style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">
                                                Play on one device</p>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                        <span
                                            style="padding: 6px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; color: white; font-weight: 500;">
                                            <ion-icon name="people-outline"
                                                style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                                            2 Players
                                        </span>
                                        <span
                                            style="padding: 6px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; color: white; font-weight: 500;">
                                            <ion-icon name="flash-outline"
                                                style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                                            Quick Start
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Online Multiplayer Card -->
                            <div onclick="showOnlinePlayers()"
                                style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 16px; padding: 24px; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;"
                                onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(17, 153, 142, 0.3)'"
                                onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                <div
                                    style="position: absolute; top: -20px; right: -20px; font-size: 120px; opacity: 0.1;">
                                    <ion-icon name="globe-outline"></ion-icon>
                                </div>
                                <div style="position: relative; z-index: 1;">
                                    <div
                                        style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                                        <div
                                            style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                            <ion-icon name="globe-outline"
                                                style="font-size: 32px; color: white;"></ion-icon>
                                        </div>
                                        <div style="flex: 1;">
                                            <h3 style="margin: 0; font-size: 22px; color: white; font-weight: 700;">
                                                Online Multiplayer</h3>
                                            <p
                                                style="margin: 4px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">
                                                Challenge other players</p>
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                        <span
                                            style="padding: 6px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; color: white; font-weight: 500;">
                                            <ion-icon name="wifi-outline"
                                                style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                                            Real-time
                                        </span>
                                        <span
                                            style="padding: 6px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 12px; color: white; font-weight: 500;">
                                            <ion-icon name="trophy-outline"
                                                style="vertical-align: middle; margin-right: 4px;"></ion-icon>
                                            Ranked
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mobile Responsive -->
                        <style>
                            @media (max-width: 768px) {
                                div[style*="grid-template-columns: 1fr 1fr"] {
                                    grid-template-columns: 1fr !important;
                                }
                            }
                        </style>
                    </div>
                </div>

                <!-- Player Name Input for Local Game -->
                <div id="ttt-player-names" class="hidden stat-card" style="margin-bottom: 20px; padding: 32px;">
                    <button onclick="backToTTTMode()"
                        style="background: none; border: none; color: var(--text-color); font-size: 20px; cursor: pointer; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; transition: all 0.3s;"
                        onmouseenter="this.style.background='var(--card-bg)'"
                        onmouseleave="this.style.background='none'">
                        <ion-icon name="arrow-back-outline"></ion-icon>
                        <span>Back</span>
                    </button>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <h2
                            style="margin: 0 0 8px 0; font-size: 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                            Enter Player Names</h2>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Who's playing today?
                        </p>
                    </div>

                    <div style="max-width: 500px; margin: 0 auto;">
                        <!-- Player 1 Card -->
                        <div
                            style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; position: relative; overflow: hidden;">
                            <div
                                style="position: absolute; top: -10px; right: -10px; font-size: 100px; opacity: 0.1; color: white;">
                                X</div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                    <div
                                        style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white;">
                                        X
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 700;">
                                            Player 1</h4>
                                        <p
                                            style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">
                                            Plays as X (goes first)</p>
                                    </div>
                                </div>
                                <input type="text" id="player1-name" placeholder="Enter name..."
                                    style="width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.95); border: none; border-radius: 12px; color: #1e293b; font-size: 16px; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                    onkeypress="if(event.key === 'Enter') document.getElementById('player2-name').focus()">
                            </div>
                        </div>

                        <!-- Player 2 Card -->
                        <div
                            style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px; padding: 24px; margin-bottom: 28px; position: relative; overflow: hidden;">
                            <div
                                style="position: absolute; top: -10px; right: -10px; font-size: 100px; opacity: 0.1; color: white;">
                                O</div>
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                                    <div
                                        style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white;">
                                        O
                                    </div>
                                    <div>
                                        <h4 style="margin: 0; color: white; font-size: 18px; font-weight: 700;">
                                            Player 2</h4>
                                        <p
                                            style="margin: 4px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">
                                            Plays as O (goes second)</p>
                                    </div>
                                </div>
                                <input type="text" id="player2-name" placeholder="Enter name..."
                                    style="width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.95); border: none; border-radius: 12px; color: #1e293b; font-size: 16px; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                                    onkeypress="if(event.key === 'Enter') startLocalGameWithNames()">
                            </div>
                        </div>

                        <!-- Start Button -->
                        <button onclick="startLocalGameWithNames()"
                            style="width: 100%; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 12px; color: white; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"
                            onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)'"
                            onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
                            <ion-icon name="play-outline"
                                style="vertical-align: middle; margin-right: 8px; font-size: 20px;"></ion-icon>
                            Start Game
                        </button>
                    </div>
                </div>

                <!-- Online Players List -->
                <div id="ttt-online-players" class="hidden stat-card" style="margin-bottom: 20px;">
                    <button onclick="backToTTTMode()"
                        style="background: none; border: none; color: var(--text-color); font-size: 20px; cursor: pointer; margin-bottom: 12px;">
                        <ion-icon name="arrow-back-outline"></ion-icon> Back
                    </button>
                    <h3 style="margin-bottom: 16px;">Online Players</h3>
                    <input type="text" id="player-search" placeholder="Search players..."
                        style="margin-bottom: 16px;" oninput="filterOnlinePlayers(this.value)">
                    <div id="online-players-list" style="max-height: 400px; overflow-y: auto;">
                        <!-- Players will be loaded here -->
                    </div>
                </div>

                <!-- Game Board -->
                <div id="ttt-game-board" class="hidden stat-card"
                    style="margin-bottom: 10px; padding: 16px; height: calc(100vh - 40px); overflow: hidden; display: flex; flex-direction: column;">
                    <div
                        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <button onclick="quitGame()"
                            style="background: none; border: none; color: var(--text-color); font-size: 20px; cursor: pointer;">
                            <ion-icon name="arrow-back-outline"></ion-icon> Quit
                        </button>
                        <div id="game-status" style="font-weight: bold; font-size: 18px;">Your Turn</div>
                    </div>

                    <div
                        style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Player X</div>
                            <div id="player-x-name" style="font-weight: bold;">You</div>
                        </div>
                        <div style="font-size: 24px; opacity: 0.5;">VS</div>
                        <div style="text-align: right;">
                            <div style="font-size: 12px; color: var(--text-secondary);">Player O</div>
                            <div id="player-o-name" style="font-weight: bold;">Opponent</div>
                        </div>
                    </div>

                    <div
                        style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0;">
                        <div id="ttt-board"
                            style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; max-width: min(400px, 80vh); aspect-ratio: 1;">
                            <!-- 9 cells will be created dynamically -->
                        </div>
                    </div>
                </div>

                <!-- Game Result Modal -->
                <div id="game-result" class="hidden"
                    onclick="if(event.target === this) this.classList.add('hidden')"
                    style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                    <div
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 40px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: modalSlideIn 0.3s ease;">
                        <div style="font-size: 60px; margin-bottom: 16px;">🎉</div>
                        <div id="result-text"
                            style="font-size: 28px; font-weight: bold; margin-bottom: 20px; color: white;"></div>
                        <button class="btn btn-primary" onclick="playAgain()"
                            style="background: white; color: #667eea; padding: 14px 32px; font-size: 16px; margin-bottom: 12px; width: 100%;">Play
                            Again</button>
                        <button onclick="quitGame()"
                            style="background: transparent; border: 2px solid white; color: white; padding: 12px 32px; font-size: 14px; border-radius: 10px; cursor: pointer; width: 100%;">Back
                            to Menu</button>
                    </div>
                </div>

                <style>
                    @keyframes modalSlideIn {
                        from {
                            transform: scale(0.8);
                            opacity: 0;
                        }

                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                </style>

                <!-- Leaderboard -->
                <div id="ttt-leaderboard" class="hidden stat-card" style="margin-bottom: 20px;">
                    <button onclick="backToGameSelection()"
                        style="background: none; border: none; color: var(--text-color); font-size: 20px; cursor: pointer; margin-bottom: 12px;">
                        <ion-icon name="arrow-back-outline"></ion-icon> Back
                    </button>
                    <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <ion-icon name="trophy-outline" style="font-size: 24px; color: #FFD700;"></ion-icon>
                        Tic-Tac-Toe Leaderboard
                    </h3>
                    <div id="leaderboard-list" style="max-height: 500px; overflow-y: auto;">
                        <!-- Leaderboard entries will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- 50 Guesses Game -->
            <div id="fiftyguesses-game" class="hidden"
                style="height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
                <div class="stat-card"
                    style="margin-bottom: 10px; padding: 16px; flex: 1; display: flex; flex-direction: column; overflow-y: auto;">
                    <button onclick="backToGameSelection()"
                        style="background: none; border: none; color: var(--text-color); font-size: 20px; cursor: pointer; margin-bottom: 12px;">
                        <ion-icon name="arrow-back-outline"></ion-icon> Back
                    </button>

                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2
                            style="margin: 0 0 8px 0; font-size: 28px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            50 Guesses</h2>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">Guess the number before
                            you run out of tries!</p>
                    </div>

                    <!-- Game Stats -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                        <div
                            style="background: rgba(240, 147, 251, 0.1); border-radius: 12px; padding: 16px; text-align: center;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Level
                            </div>
                            <div id="fg-level" style="font-size: 24px; font-weight: bold; color: #f093fb;">1</div>
                        </div>
                        <div
                            style="background: rgba(245, 87, 108, 0.1); border-radius: 12px; padding: 16px; text-align: center;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Guesses
                                Left</div>
                            <div id="fg-guesses-left" style="font-size: 24px; font-weight: bold; color: #f5576c;">50
                            </div>
                        </div>
                        <div
                            style="background: rgba(102, 126, 234, 0.1); border-radius: 12px; padding: 16px; text-align: center;">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Score
                            </div>
                            <div id="fg-score" style="font-size: 24px; font-weight: bold; color: #667eea;">0</div>
                        </div>
                    </div>

                    <!-- Range Display -->
                    <div
                        style="background: var(--card-bg); border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
                        <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">Guess a
                            number between</div>
                        <div style="font-size: 32px; font-weight: bold;">
                            <span id="fg-min-range">1</span> - <span id="fg-max-range">10</span>
                        </div>
                    </div>

                    <!-- Input and Submit -->
                    <!-- Numpad Input Display -->
                    <div style="margin-bottom: 20px;">
                        <input type="text" id="fg-guess-input" placeholder="?" readonly
                            style="width: 100%; padding: 20px; background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 16px; color: var(--text-color); font-size: 32px; text-align: center; font-weight: bold; letter-spacing: 2px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                    </div>

                    <!-- Numpad Grid -->
                    <div
                        style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 320px; margin: 0 auto 24px auto;">
                        <!-- Numbers 1-9 -->
                        <button onclick="fgAppendNumber(1)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">1</button>
                        <button onclick="fgAppendNumber(2)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">2</button>
                        <button onclick="fgAppendNumber(3)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">3</button>

                        <button onclick="fgAppendNumber(4)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">4</button>
                        <button onclick="fgAppendNumber(5)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">5</button>
                        <button onclick="fgAppendNumber(6)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">6</button>

                        <button onclick="fgAppendNumber(7)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">7</button>
                        <button onclick="fgAppendNumber(8)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">8</button>
                        <button onclick="fgAppendNumber(9)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">9</button>

                        <!-- Bottom Row -->
                        <button onclick="fgBackspace()" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: rgba(239, 68, 68, 0.1); color: #ef4444; cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(239, 68, 68, 0.2);">
                            <ion-icon name="backspace-outline"></ion-icon>
                        </button>
                        <button onclick="fgAppendNumber(0)" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: var(--card-bg); color: var(--text-color); cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 rgba(0,0,0,0.2);">0</button>
                        <button onclick="submitGuess()" class="numpad-btn"
                            style="padding: 20px; font-size: 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; cursor: pointer; transition: all 0.1s; box-shadow: 0 4px 0 #047857;">
                            <ion-icon name="checkmark-outline"></ion-icon>
                        </button>
                    </div>

                    <!-- Feedback Message -->
                    <div id="fg-feedback"
                        style="text-align: center; padding: 16px; border-radius: 12px; margin-bottom: 20px; display: none;">
                        <div id="fg-feedback-text" style="font-size: 18px; font-weight: bold;"></div>
                    </div>

                    <!-- Guess History -->
                    <div id="fg-history-container" style="display: none;">
                        <h4 style="margin: 0 0 12px 0; font-size: 16px;">Your Guesses</h4>
                        <div id="fg-guess-history" style="display: flex; flex-wrap: wrap; gap: 8px;">
                            <!-- Guess history will appear here -->
                        </div>
                    </div>

                    <!-- Game Over / Victory Modal -->
                    <div id="fg-game-over" class="hidden"
                        onclick="if(event.target === this) this.classList.add('hidden')"
                        style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 10000;">
                        <div
                            style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 20px; padding: 40px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: modalSlideIn 0.3s ease;">
                            <div id="fg-result-icon" style="font-size: 64px; margin-bottom: 16px;"></div>
                            <div id="fg-result-text"
                                style="font-size: 24px; font-weight: bold; color: white; margin-bottom: 8px;"></div>
                            <div id="fg-result-details"
                                style="font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 20px;"></div>
                            <button class="btn" onclick="restartFiftyGuesses()"
                                style="background: white; color: #f5576c; font-weight: bold; width: 100%; margin-bottom: 12px;">
                                <ion-icon name="refresh-outline" style="margin-right: 8px;"></ion-icon>
                                Play Again
                            </button>
                            <button onclick="showFGLeaderboard()"
                                style="background: transparent; border: 2px solid white; color: white; padding: 12px 32px; font-size: 14px; border-radius: 10px; cursor: pointer; width: 100%; margin-bottom: 12px;">
                                <ion-icon name="trophy-outline" style="margin-right: 8px;"></ion-icon>
                                Leaderboard
                            </button>
                            <button onclick="backToGameSelection()"
                                style="background: transparent; border: 2px solid white; color: white; padding: 12px 32px; font-size: 14px; border-radius: 10px; cursor: pointer; width: 100%;">Back
                                to Menu</button>
                        </div>
                    </div>
                </div>

                <!-- 50 Guesses Leaderboard -->
                <div id="fg-leaderboard" class="hidden stat-card" style="margin-bottom: 20px;">
                    <button onclick="hideFGLeaderboard()"
                        style="background: none; border: none; color: var(--text-color); font-size: 20px; cursor: pointer; margin-bottom: 12px;">
                        <ion-icon name="arrow-back-outline"></ion-icon> Back
                    </button>
                    <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <ion-icon name="trophy-outline" style="font-size: 24px; color: #FFD700;"></ion-icon>
                        50 Guesses Leaderboard
                    </h3>
                    <div id="fg-leaderboard-list" style="max-height: 500px; overflow-y: auto;">
                        <!-- Leaderboard entries will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export async function initCommunityScreen() {
    const userId = storage.getItem('kobi_atlas_uid');
    if (!userId) {
        window.location.hash = '#/login';
        return;
    }

    const posts = await getPosts();
    // Use correct ID "posts-feed"
    const postsContainer = document.getElementById('posts-feed');

    if (!postsContainer) return; // Safety

    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="card" style="text-align: center; padding: 40px;">
                <p class="text-secondary">No posts yet. Be the first to share!</p>
            </div>
        `;
        return;
    }

    // Render posts
    const postsHTML = await Promise.all(posts.map(post => renderPost(post, userId)));
    postsContainer.innerHTML = postsHTML.join('');
}

async function renderPost(post, currentUserId) {
    // Get user profile
    if (!userCache[post.userId]) {
        userCache[post.userId] = await getUserProfile(post.userId);
    }
    const user = userCache[post.userId];

    const isLiked = post.likes?.includes(currentUserId);
    const isOwner = post.userId === currentUserId;

    return `
        <div class="post-card">
            <div class="post-header">
                <div class="avatar" style="background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; overflow: hidden;">
                    ${user?.profilePicture
            ? `<img src="${user.profilePicture}" style="width: 100%; height: 100%; object-fit: cover;">`
            : (user?.username?.[0]?.toUpperCase() || '?')}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; display: flex; align-items: center; gap: 4px;">
                        ${user?.displayName || user?.username || 'Unknown User'}
                        ${user?.isAdmin ? `<ion-icon name="shield-checkmark" style="color: #FFD700; font-size: 14px;" title="Admin"></ion-icon>` : ''}
                    </div>
                    <div class="text-secondary text-tiny">${formatDate(post.timestamp)}</div>
                </div>
                ${isOwner ? `<button class="btn-icon" onclick="handleDeletePost('${post.id}')">🗑️</button>` : ''}
            </div>
            
            <div class="post-content">${post.content}</div>
            
            ${post.image ? `<img src="${post.image}" class="post-image" alt="Post image">` : ''}
            
            <div class="post-actions">
                <button class="action-btn ${isLiked ? 'active' : ''}" onclick="handleLikePost('${post.id}', ${isLiked})">
                    <ion-icon name="${isLiked ? 'heart' : 'heart-outline'}"></ion-icon>
                    <span>${post.likes?.length || 0}</span>
                </button>
                <button class="action-btn">
                    <ion-icon name="chatbubble-outline"></ion-icon>
                    <span>${post.comments?.length || 0}</span>
                </button>
            </div>
        </div>
    `;
}

// Global functions for onclick handlers
window.handleLikePost = async function (postId, isCurrentlyLiked) {
    const userId = storage.getItem('kobi_atlas_uid');
    try {
        if (isCurrentlyLiked) {
            await unlikePost(postId, userId);
        } else {
            await likePost(postId, userId);
        }
        // Refresh posts
        await initCommunityScreen();
    } catch (error) {
        console.error('Like error:', error);
    }
};

window.handleDeletePost = async function (postId) {
    if (confirm('Delete this post?')) {
        try {
            await deletePost(postId);
            await initCommunityScreen();
        } catch (error) {
            console.error('Delete error:', error);
        }
    }
};
