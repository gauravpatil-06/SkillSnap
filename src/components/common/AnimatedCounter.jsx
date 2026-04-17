import React from 'react';

const AnimatedCounter = ({ target, duration = 2 }) => {
    const [count, setCount] = React.useState(0);
    
    // Parse target: extracts numbers, handles commas, and keeps suffixes like "+" or "%"
    const numericValue = parseInt(target.replace(/[^0-9]/g, ''), 10);
    const suffix = target.replace(/[0-9,]/g, '');
    const hasComma = target.includes(',');

    React.useEffect(() => {
        let startTime;
        let animationFrame;

        const updateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            
            // "Ease Out" formula to make it start fast and slow down at the end
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);
            const currentCount = Math.floor(easeOutQuad * numericValue);
            
            setCount(currentCount);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(updateCount);
            }
        };

        animationFrame = requestAnimationFrame(updateCount);
        return () => cancelAnimationFrame(animationFrame);
    }, [numericValue, duration]);

    const formatNumber = (num) => {
        if (hasComma) return num.toLocaleString('en-IN') + suffix;
        return num + suffix;
    };

    return <>{formatNumber(count)}</>;
};

export default AnimatedCounter;
