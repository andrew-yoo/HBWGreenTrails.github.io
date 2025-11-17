import '../styles/style.css';
import React from 'react';

type Props = {
  message: string;
  shadow?: boolean;
};

const Top: React.FC<Props> = ({ message, shadow }) => {
  return (
    <header className="App-header">
      <h1 id="GreenTrails" style={{ textShadow: shadow ? '2px 2px black' : 'none' , color:"rgb(255, 255, 255, 1)"}}>{message}</h1>
    </header>
  );
};

export default Top;
