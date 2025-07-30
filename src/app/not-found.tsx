
'use client';

import Link from 'next/link';
import { Inconsolata } from 'next/font/google';

const inconsolata = Inconsolata({ subsets: ['latin'] });

export default function NotFound() {
  return (
    <div className={`terminal-container ${inconsolata.className}`}>
      <style jsx global>{`
        .terminal-container {
          box-sizing: border-box;
          height: 100vh;
          width: 100vw;
          background-color: #000000;
          background-image: radial-gradient(#11581E, #041607), url("https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif");
          background-repeat: no-repeat;
          background-size: cover;
          font-size: 1.5rem;
          color: rgba(128, 255, 128, 0.8);
          text-shadow:
              0 0 1ex rgba(51, 255, 51, 1),
              0 0 2px rgba(255, 255, 255, 0.8);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .noise {
          pointer-events: none;
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: url("https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif");
          background-repeat: no-repeat;
          background-size: cover;
          z-index: -1;
          opacity: .02;
        }

        .overlay {
          pointer-events: none;
          position: absolute;
          width: 100%;
          height: 100%;
          background:
              repeating-linear-gradient(
              180deg,
              rgba(0, 0, 0, 0) 0,
              rgba(0, 0, 0, 0.3) 50%,
              rgba(0, 0, 0, 0) 100%);
          background-size: auto 4px;
          z-index: 1;
        }

        .overlay::before {
          content: "";
          pointer-events: none;
          position: absolute;
          display: block;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(
              0deg,
              transparent 0%,
              rgba(32, 128, 32, 0.2) 2%,
              rgba(32, 128, 32, 0.8) 3%,
              rgba(32, 128, 32, 0.2) 3%,
              transparent 100%);
          background-repeat: no-repeat;
          animation: scan 7.5s linear 0s infinite;
        }

        @keyframes scan {
          0%        { background-position: 0 -100vh; }
          35%, 100% { background-position: 0 100vh; }
        }

        .terminal {
          box-sizing: inherit;
          padding: 4rem;
          text-transform: uppercase;
        }

        .output {
          color: rgba(128, 255, 128, 0.8);
          text-shadow:
              0 0 1px rgba(51, 255, 51, 0.4),
              0 0 2px rgba(255, 255, 255, 0.8);
        }

        .output::before {
          content: "> ";
        }

        .terminal a {
          color: #fff;
          text-decoration: none;
        }

        .terminal a::before {
          content: "[";
        }

        .terminal a::after {
          content: "]";
        }

        .errorcode {
          color: white;
        }
      `}</style>
      <div className="noise"></div>
      <div className="overlay"></div>
      <div className="terminal">
        <h1>Error <span className="errorcode">404</span></h1>
        <p className="output">The page you are looking for might have been removed, had its name changed or is temporarily unavailable.</p>
        <p className="output">Please try to <Link href="/">go back</Link> or <Link href="/dashboard">return to the homepage</Link>.</p>
      </div>
    </div>
  );
}
