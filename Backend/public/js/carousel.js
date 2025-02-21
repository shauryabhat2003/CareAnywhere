document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.carousel-container input[type="radio"]');
    let currentIndex = 2; // Start with middle slide

    function smoothTransition(fromIndex, toIndex) {
        // Disable transitions temporarily
        const carousel = document.querySelector('#carousel');

        // Check if we're moving from last to first
        if (fromIndex === inputs.length - 1 && toIndex === 0) {
            // Quick transition to second-to-last
            carousel.style.transition = 'none';
            inputs[inputs.length - 2].checked = true;

            // Force reflow
            void carousel.offsetWidth;

            // Restore transition and move to first
            carousel.style.transition = 'all 0.5s ease';
            setTimeout(() => {
                inputs[0].checked = true;
            }, 50);
        } else {
            inputs[toIndex].checked = true;
        }
    }

    function rotateCarousel() {
        const nextIndex = (currentIndex + 1) % inputs.length;
        smoothTransition(currentIndex, nextIndex);
        currentIndex = nextIndex;
    }

    // Auto rotate every 3 seconds
    const intervalId = setInterval(rotateCarousel, 3000);

    // Handle manual navigation
    inputs.forEach((input, index) => {
        input.addEventListener('change', () => {
            currentIndex = index;
            // Reset the timer
            clearInterval(intervalId);
            setInterval(rotateCarousel, 3000);
        });
    });
});