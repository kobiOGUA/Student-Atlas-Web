// Community Feed Screen
import { getPosts, likePost, unlikePost, deletePost } from '../services/social.js';
import { getUserProfile } from '../services/user.js';
import { storage } from '../utils/storage.js';
import { formatDate } from '../utils/helpers.js';

let userCache = {};

export function renderCommunityScreen() {
    return `
        <div class="screen">
            <div style="background: var(--primary); color: white; padding: 20px; margin: -16px -16px 20px -16px; border-radius: 0 0 20px 20px;">
                <h2 style="margin: 0;">Community</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Connect with fellow students</p>
            </div>
            
            <button class="btn-primary mb-2" onclick="alert('Create Post feature coming soon!')">
                + Create Post
            </button>
            
            <div id="posts-container">
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
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
    const postsContainer = document.getElementById('posts-container');

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
                <div class="avatar" style="background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                    ${user?.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${user?.displayName || user?.username || 'Unknown User'}</div>
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
