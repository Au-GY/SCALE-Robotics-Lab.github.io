(function () {
    'use strict';

    const generatedUrls = [];
    const previewCache = new Map();

    function getPreviewSize(image) {
        if (image.classList.contains('team-photo')) return 800;
        if (image.classList.contains('publication-image')) return 1200;
        return 1400;
    }

    function canConvert(sourceUrl) {
        const url = new URL(sourceUrl, window.location.href);
        const extension = url.pathname.split('.').pop().toLowerCase();
        return url.origin === window.location.origin && !['gif', 'svg'].includes(extension);
    }

    function createPreview(sourceUrl, maxDimension) {
        const cacheKey = sourceUrl + ':' + maxDimension;
        if (previewCache.has(cacheKey)) return previewCache.get(cacheKey);

        const previewPromise = new Promise(function (resolve) {
            const source = new Image();
            source.decoding = 'async';

            source.onload = function () {
                const scale = Math.min(1, maxDimension / Math.max(source.naturalWidth, source.naturalHeight));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));

                const context = canvas.getContext('2d');
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.imageSmoothingEnabled = true;
                context.imageSmoothingQuality = 'high';
                context.drawImage(source, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(function (blob) {
                    if (!blob) {
                        resolve(null);
                        return;
                    }

                    const previewUrl = URL.createObjectURL(blob);
                    generatedUrls.push(previewUrl);
                    resolve(previewUrl);
                }, 'image/jpeg', 0.88);
            };

            source.onerror = function () {
                resolve(null);
            };

            source.src = sourceUrl;
        });

        previewCache.set(cacheKey, previewPromise);
        return previewPromise;
    }

    function convertImage(image) {
        if (image.classList.contains('lab-gallery-lightbox-image')) return;

        const sourceValue = image.dataset.fullSrc || image.currentSrc || image.src;
        if (!sourceValue || !canConvert(sourceValue)) return;

        const sourceUrl = new URL(sourceValue, window.location.href).href;

        createPreview(sourceUrl, getPreviewSize(image)).then(function (previewUrl) {
            if (previewUrl) image.src = previewUrl;
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('img').forEach(convertImage);
    });

    window.addEventListener('unload', function () {
        generatedUrls.forEach(function (url) {
            URL.revokeObjectURL(url);
        });
    });
}());
