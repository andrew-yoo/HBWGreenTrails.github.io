import React from "react";

const fireworkSVG = encodeURIComponent(`
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100%" viewBox="0 0 400 400" enable-background="new 0 0 400 400" xml:space="preserve">
<!-- Cute New Year's Firework Star -->
<g id="cute-firework">
  <!-- Main star body with gradient -->
  <defs>
    <radialGradient id="starGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="60%" style="stop-color:#FFA500;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF6B6B;stop-opacity:0.8" />
    </radialGradient>
  </defs>
  
  <!-- Outer glow circles -->
  <circle cx="200" cy="200" r="90" fill="#FFE066" opacity="0.2"/>
  <circle cx="200" cy="200" r="70" fill="#FFD700" opacity="0.3"/>
  
  <!-- Main star shape (5 pointed) -->
  <path d="M 200 100 L 220 170 L 295 170 L 235 215 L 260 285 L 200 240 L 140 285 L 165 215 L 105 170 L 180 170 Z" 
        fill="url(#starGrad)" stroke="#FFD700" stroke-width="3" opacity="0.95"/>
  
  <!-- Inner star detail -->
  <circle cx="200" cy="200" r="35" fill="#FFF9E6" opacity="0.9"/>
  <circle cx="200" cy="200" r="20" fill="#FFD700" opacity="0.95"/>
  
  <!-- Cute sparkle accents -->
  <g opacity="0.9">
    <!-- Top sparkle -->
    <circle cx="200" cy="85" r="8" fill="#87CEEB"/>
    <path d="M 200 75 L 200 95 M 190 85 L 210 85" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
    
    <!-- Right sparkle -->
    <circle cx="310" cy="170" r="6" fill="#FFB6C1"/>
    <path d="M 310 164 L 310 176 M 304 170 L 316 170" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Bottom right sparkle -->
    <circle cx="265" cy="295" r="7" fill="#98D8C8"/>
    <path d="M 265 288 L 265 302 M 258 295 L 272 295" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
    
    <!-- Bottom left sparkle -->
    <circle cx="135" cy="295" r="6" fill="#FFD700"/>
    <path d="M 135 289 L 135 301 M 129 295 L 141 295" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Left sparkle -->
    <circle cx="90" cy="170" r="7" fill="#DDA0DD"/>
    <path d="M 90 163 L 90 177 M 83 170 L 97 170" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  
  <!-- Cute twinkle effect on center -->
  <g opacity="0.8">
    <path d="M 200 185 L 205 200 L 200 215 L 195 200 Z" fill="#FFFFFF"/>
    <path d="M 185 200 L 200 205 L 215 200 L 200 195 Z" fill="#FFFFFF"/>
  </g>
</g>
</svg>
`);

export default fireworkSVG;
