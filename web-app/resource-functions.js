// Resource Management Functions - Insert these before window.uploadResource

let selectedResourceType = 'link';
let resourceImageData = null;
let resourceFileData = null;
let resourceFileName = null;

window.setResourceType = function (type) {
    selectedResourceType = type;

    // Update button styles
    document.getElementById('res-type-link').classList.toggle('btn-primary', type === 'link');
    document.getElementById('res-type-link').classList.toggle('btn-secondary', type !== 'link');
    document.getElementById('res-type-image').classList.toggle('btn-primary', type === 'image');
    document.getElementById('res-type-image').classList.toggle('btn-secondary', type !== 'image');
    document.getElementById('res-type-file').classList.toggle('btn-primary', type === 'file');
    document.getElementById('res-type-file').classList.toggle('btn-secondary', type !== 'file');

    // Show/hide appropriate containers
    document.getElementById('res-link-container').classList.toggle('hidden', type !== 'link');
    document.getElementById('res-image-container').classList.toggle('hidden', type !== 'image');
    document.getElementById('res-file-container').classList.toggle('hidden', type !== 'file');
};

window.handleResourceImageSelect = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showToast('Image size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        resourceImageData = e.target.result;
        document.getElementById('res-image-preview').src = e.target.result;
        document.getElementById('res-image-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
};

window.handleResourceFileSelect = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast('File size must be less than 10MB', 'error');
        event.target.value = '';
        return;
    }

    resourceFileName = file.name;
    const reader = new FileReader();
    reader.onload = function (e) {
        resourceFileData = e.target.result;
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        document.getElementById('res-file-info').textContent = `Selected: ${file.name} (${sizeInMB} MB)`;
    };
    reader.readAsDataURL(file);
};

// Replace the existing window.uploadResource function with this:
window.uploadResource = async function () {
    const courseCode = document.getElementById('res-course-code').value.trim();
    const title = document.getElementById('res-title').value.trim();
    const description = document.getElementById('res-desc').value.trim();

    if (!courseCode || !title) {
        showToast('Please fill course code and title', 'error');
        return;
    }

    // Validate based on type
    if (selectedResourceType === 'link') {
        const link = document.getElementById('res-link').value.trim();
        if (!link) {
            showToast('Please enter a link', 'error');
            return;
        }
    } else if (selectedResourceType === 'image' && !resourceImageData) {
        showToast('Please select an image', 'error');
        return;
    } else if (selectedResourceType === 'file' && !resourceFileData) {
        showToast('Please select a file', 'error');
        return;
    }

    showLoading(true);
    try {
        const uid = localStorage.getItem('kobi_atlas_uid');
        const userDoc = await getDoc(doc(db, 'users', uid));
        const userData = userDoc.data() || {};

        const resourceData = {
            courseCode,
            title,
            description,
            uploadedBy: uid,
            uploadedByName: userData.username || userData.displayName || 'Student',
            uploadedByProfilePicture: userData.profilePicture || null,
            timestamp: Date.now(),
            votes: 0,
            type: selectedResourceType
        };

        if (selectedResourceType === 'link') {
            resourceData.link = document.getElementById('res-link').value.trim();
        } else if (selectedResourceType === 'image') {
            resourceData.imageData = resourceImageData;
        } else if (selectedResourceType === 'file') {
            resourceData.fileData = resourceFileData;
            resourceData.fileName = resourceFileName;
        }

        await addDoc(collection(db, 'resources'), resourceData);

        showToast('Resource uploaded!', 'success');
        closeModal('resource-upload-modal');

        // Reset form
        document.getElementById('res-course-code').value = '';
        document.getElementById('res-title').value = '';
        document.getElementById('res-desc').value = '';
        document.getElementById('res-link').value = '';
        document.getElementById('res-image-file').value = '';
        document.getElementById('res-file-input').value = '';
        document.getElementById('res-image-preview').style.display = 'none';
        document.getElementById('res-file-info').textContent = '';
        resourceImageData = null;
        resourceFileData = null;
        resourceFileName = null;
        setResourceType('link'); // Reset to link

        loadResources();
    } catch (error) {
        console.error('Error uploading resource:', error);
        if (error.message && (error.message.includes('longer than') || error.message.includes('too large'))) {
            showToast('File size is too large. Please use a smaller file.', 'error');
        } else {
            showToast('Failed to upload', 'error');
        }
    } finally {
        showLoading(false);
    }
};

// Add delete resource function
window.deleteResource = async function (resourceId, uploaderId) {
    const uid = localStorage.getItem('kobi_atlas_uid');

    if (uid !== uploaderId) {
        showToast('You can only delete your own resources', 'error');
        return;
    }

    if (!confirm('Delete this resource?')) return;

    showLoading(true);
    try {
        await deleteDoc(doc(db, 'resources', resourceId));
        showToast('Resource deleted', 'success');
        loadResources();
    } catch (error) {
        console.error('Error deleting resource:', error);
        showToast('Failed to delete resource', 'error');
    } finally {
        showLoading(false);
    }
};
