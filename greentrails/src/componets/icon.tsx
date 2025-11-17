import React, { useEffect } from 'react';
import '../styles/style.css'
import iconSrc from '../pictures/lowrezlogo.png';

const Icon: React.FC = () => {
    useEffect(() => {
        let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = iconSrc;
        link.type = 'image/png';
    }, []);

    return null;
}

export default Icon;