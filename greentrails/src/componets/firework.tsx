import React from "react";

const fireworkSVG = encodeURIComponent(`
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 800 800" enable-background="new 0 0 800 800" xml:space="preserve">
<!-- New Year's Firework/Party Popper Design -->
<!-- Gold star/firework burst -->
<g id="firework-burst">
  <!-- Center circle -->
  <circle cx="400" cy="400" r="80" fill="#FFD700" opacity="0.9"/>
  <circle cx="400" cy="400" r="60" fill="#FFA500" opacity="0.8"/>
  <circle cx="400" cy="400" r="40" fill="#FFFF00" opacity="0.9"/>
  
  <!-- Radiating sparkles/bursts -->
  <!-- Top -->
  <path d="M 400 320 L 420 280 L 400 240 L 380 280 Z" fill="#FFD700" opacity="0.9"/>
  <path d="M 400 240 L 410 220 L 400 200 L 390 220 Z" fill="#FFA500" opacity="0.8"/>
  
  <!-- Top Right -->
  <path d="M 456 344 L 496 304 L 536 264 L 496 304 Z" fill="#FFD700" opacity="0.9"/>
  <path d="M 536 264 L 556 244 L 576 224 L 556 244 Z" fill="#87CEEB" opacity="0.8"/>
  
  <!-- Right -->
  <path d="M 480 400 L 520 420 L 560 400 L 520 380 Z" fill="#FFA500" opacity="0.9"/>
  <path d="M 560 400 L 580 410 L 600 400 L 580 390 Z" fill="#FFD700" opacity="0.8"/>
  
  <!-- Bottom Right -->
  <path d="M 456 456 L 496 496 L 536 536 L 496 496 Z" fill="#87CEEB" opacity="0.9"/>
  <path d="M 536 536 L 556 556 L 576 576 L 556 556 Z" fill="#FFD700" opacity="0.8"/>
  
  <!-- Bottom -->
  <path d="M 400 480 L 420 520 L 400 560 L 380 520 Z" fill="#FFA500" opacity="0.9"/>
  <path d="M 400 560 L 410 580 L 400 600 L 390 580 Z" fill="#87CEEB" opacity="0.8"/>
  
  <!-- Bottom Left -->
  <path d="M 344 456 L 304 496 L 264 536 L 304 496 Z" fill="#FFD700" opacity="0.9"/>
  <path d="M 264 536 L 244 556 L 224 576 L 244 556 Z" fill="#FFA500" opacity="0.8"/>
  
  <!-- Left -->
  <path d="M 320 400 L 280 420 L 240 400 L 280 380 Z" fill="#87CEEB" opacity="0.9"/>
  <path d="M 240 400 L 220 410 L 200 400 L 220 390 Z" fill="#FFD700" opacity="0.8"/>
  
  <!-- Top Left -->
  <path d="M 344 344 L 304 304 L 264 264 L 304 304 Z" fill="#FFA500" opacity="0.9"/>
  <path d="M 264 264 L 244 244 L 224 224 L 244 244 Z" fill="#87CEEB" opacity="0.8"/>
  
  <!-- Small sparkles -->
  <circle cx="300" cy="300" r="15" fill="#FFFF00" opacity="0.9"/>
  <circle cx="500" cy="300" r="15" fill="#87CEEB" opacity="0.9"/>
  <circle cx="500" cy="500" r="15" fill="#FFD700" opacity="0.9"/>
  <circle cx="300" cy="500" r="15" fill="#FFA500" opacity="0.9"/>
  
  <!-- Tiny accent stars -->
  <polygon points="350,350 355,360 365,360 357,367 360,377 350,370 340,377 343,367 335,360 345,360" fill="#FFFFFF" opacity="0.9"/>
  <polygon points="450,350 455,360 465,360 457,367 460,377 450,370 440,377 443,367 435,360 445,360" fill="#FFFFFF" opacity="0.9"/>
  <polygon points="450,450 455,460 465,460 457,467 460,477 450,470 440,477 443,467 435,460 445,460" fill="#FFFFFF" opacity="0.9"/>
  <polygon points="350,450 355,460 365,460 357,467 360,477 350,470 340,477 343,467 335,460 345,460" fill="#FFFFFF" opacity="0.9"/>
</g>

<!-- Outer glow effect -->
<circle cx="400" cy="400" r="120" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.4"/>
<circle cx="400" cy="400" r="100" fill="none" stroke="#FFA500" stroke-width="2" opacity="0.5"/>
</svg>
`);

export default fireworkSVG;
