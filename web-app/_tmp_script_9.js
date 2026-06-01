
        // Zoom functionality
        let currentZoom = 1;

        function openLightbox(imageSrc) {
            currentZoom = 1; // Reset zoom when opening
            document.getElementById('lightbox-image').src = imageSrc;
            document.getElementById('image-lightbox').classList.add('show');
            applyZoom();
        }

        function closeLightbox() {
            document.getElementById('image-lightbox').classList.remove('show');
            currentZoom = 1;
        }

        function zoomIn() {
            currentZoom = Math.min(currentZoom + 0.25, 3);
            applyZoom();
        }

        function zoomOut() {
            currentZoom = Math.max(currentZoom - 0.25, 0.5);
            applyZoom();
        }

        function resetZoom() {
            currentZoom = 1;
            applyZoom();
        }

        function applyZoom() {
            const img = document.getElementById('lightbox-image');
            img.style.transform = `scale(${currentZoom})`;
        }

        // Mouse wheel zoom
        document.addEventListener('DOMContentLoaded', function () {
            const lightboxImage = document.getElementById('lightbox-image');
            lightboxImage.addEventListener('wheel', function (e) {
                if (document.getElementById('image-lightbox').classList.contains('show')) {
                    e.preventDefault();
                    if (e.deltaY < 0) {
                        zoomIn();
                    } else {
                        zoomOut();
                    }
                }
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeLightbox();
            }
        });
    