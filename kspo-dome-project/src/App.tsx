import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DungGeunMo&display=swap');

  :root {
    --win-bg: #c0c0c0;
    --win-text: #000000;
    --win-border-light: #dfdfdf;
    --win-border-white: #ffffff;
    --win-border-dark: #808080;
    --win-border-black: #000000;
    --win-title-bg: #000080;
    --win-title-text: #ffffff;
  }

  body {
    background-color: #008080; 
    color: var(--win-text);
    overflow: hidden;
    font-family: 'DungGeunMo', 'MS Sans Serif', Tahoma, sans-serif;
    -webkit-font-smoothing: none; 
  }

  .win95-window {
    background: var(--win-bg);
    border-top: 2px solid var(--win-border-white);
    border-left: 2px solid var(--win-border-white);
    border-right: 2px solid var(--win-border-black);
    border-bottom: 2px solid var(--win-border-black);
    box-shadow: inset -1px -1px var(--win-border-dark), inset 1px 1px var(--win-border-light);
    padding: 2px;
  }

  .win95-titlebar {
    background: var(--win-title-bg);
    color: var(--win-title-text);
    padding: 2px 4px 2px 6px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    letter-spacing: 1px;
  }

  .win95-title-btn {
    background: var(--win-bg);
    border-top: 1px solid var(--win-border-white);
    border-left: 1px solid var(--win-border-white);
    border-right: 1px solid var(--win-border-black);
    border-bottom: 1px solid var(--win-border-black);
    box-shadow: inset -1px -1px var(--win-border-dark);
    color: black;
    font-weight: bold;
    font-size: 12px;
    width: 16px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    line-height: 1;
  }
  .win95-title-btn:active {
    border-top: 1px solid var(--win-border-black);
    border-left: 1px solid var(--win-border-black);
    border-right: 1px solid var(--win-border-white);
    border-bottom: 1px solid var(--win-border-white);
    box-shadow: inset 1px 1px var(--win-border-dark);
    padding: 1px 0 0 1px;
  }

  .win95-button {
    background: var(--win-bg);
    border-top: 2px solid var(--win-border-white);
    border-left: 2px solid var(--win-border-white);
    border-right: 2px solid var(--win-border-black);
    border-bottom: 2px solid var(--win-border-black);
    box-shadow: inset -1px -1px var(--win-border-dark), inset 1px 1px var(--win-border-light);
    padding: 4px 12px;
    font-family: inherit;
    color: var(--win-text);
    cursor: pointer;
    font-size: 14px;
    text-align: center;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .win95-button:active {
    border-top: 2px solid var(--win-border-black);
    border-left: 2px solid var(--win-border-black);
    border-right: 2px solid var(--win-border-white);
    border-bottom: 2px solid var(--win-border-white);
    box-shadow: inset 1px 1px var(--win-border-dark);
    padding: 6px 10px 2px 14px;
  }
  .win95-button:disabled {
    color: var(--win-border-dark);
    text-shadow: 1px 1px var(--win-border-white);
    cursor: not-allowed;
  }

  .win95-input {
    background: var(--win-border-white);
    border-top: 2px solid var(--win-border-dark);
    border-left: 2px solid var(--win-border-dark);
    border-right: 2px solid var(--win-border-white);
    border-bottom: 2px solid var(--win-border-white);
    border-radius: 0;
    padding: 4px;
    font-family: inherit;
    outline: none;
    color: black;
  }

  .win95-panel {
    background: var(--win-bg);
    border-top: 2px solid var(--win-border-dark);
    border-left: 2px solid var(--win-border-dark);
    border-right: 2px solid var(--win-border-white);
    border-bottom: 2px solid var(--win-border-white);
  }

  .win95-tooltip {
    background-color: #ffffe1;
    border: 1px solid black;
    color: black;
    padding: 6px;
    font-size: 12px;
    box-shadow: 2px 2px 0px rgba(0,0,0,0.5);
    white-space: nowrap;
    z-index: 100;
  }

  .bg-grid {
    background-image: 
      linear-gradient(#d3d3d3 1px, transparent 1px),
      linear-gradient(90deg, #d3d3d3 1px, transparent 1px);
    background-size: 50px 50px;
    background-color: #ffffff;
  }

  @keyframes fluidJump {
    0%   { transform: translateY(0) scale(1, 1); animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1); }
    10%  { transform: translateY(2px) scale(1.05, 0.95); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
    40%  { transform: translateY(-40px) scale(0.92, 1.08); animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1); }
    50%  { transform: translateY(-45px) scale(1, 1); animation-timing-function: cubic-bezier(0.4, 0, 1, 1); }
    90%  { transform: translateY(0) scale(1.02, 0.98); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
    100% { transform: translateY(0) scale(1, 1); }
  }

  @keyframes doubleBounce {
    0%   { transform: translateY(0) scale(1, 1); }
    20%  { transform: translateY(-30px) scale(0.95, 1.05); }
    35%  { transform: translateY(0) scale(1.05, 0.95); }
    55%  { transform: translateY(-80px) scale(0.85, 1.15); } 
    75%  { transform: translateY(0) scale(1.02, 0.98); }
    100% { transform: translateY(0) scale(1, 1); }
  }

  .jump-motion-0 { animation: fluidJump var(--duration, 1.2s) infinite var(--delay, 0s); transform-origin: bottom center; will-change: transform; }
  .jump-motion-1 { animation: doubleBounce var(--duration, 1.0s) infinite var(--delay, 0s); transform-origin: bottom center; will-change: transform; }

  .jump-once-0 { animation: fluidJump 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; transform-origin: bottom center; }
  .jump-once-1 { animation: doubleBounce 1.0s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; transform-origin: bottom center; }

  .fever-glow { filter: drop-shadow(0 0 10px #ff0000) drop-shadow(0 0 20px #ff0000); }
  .fever-text { color: #ff0000; font-weight: bold; text-shadow: 1px 1px 0px #fff, -1px -1px 0px #fff, 1px -1px 0px #fff, -1px 1px 0px #fff; animation: feverPulse 0.5s infinite alternate; }
  @keyframes feverPulse { from { transform: scale(1); } to { transform: scale(1.1); } }
`;

const MAX_CAPACITY = 15000;
const INITIAL_FILL = 10240;

const DEFAULT_STAGE_IMG = encodeURI("image_057089.jpg");
const DEFAULT_FAN_IMG = encodeURI("image_05708b.png");

// Firebase Console > 프로젝트 설정 > 내 앱 > SDK 설정 및 구성 값을 .env에 넣어 사용합니다.
// 이 값들은 Firebase 웹 앱 식별값이며 관리자 비밀번호가 아닙니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const IS_ADMIN_PAGE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1';

const sliceEmojiString = (str, limit) => {
  const chars = [...new Intl.Segmenter().segment(str)].map(x => x.segment);
  return chars.slice(0, limit).join('');
};

const getBadgeName = (jumps) => {
  if (jumps >= 50000) return "☁️ 공중부양자";
  if (jumps >= 10000) return "🤸에바뛰고수";
  if (jumps >= 5000) return "🏃‍➡️에바뛰중수 ";
  if (jumps >= 1000) return "🚶에바뛰초보";
  return "🌱 비기너";
};

const generatePresets = (count) => {
  const names = ['치이카와', '짱구', '에바뛰', '월요일', '개발자_01', '락덕', '씨엔블루', '디자이너', '안녕하세요', '체조'];
  const emojis = ['🐹', '👦', '🖤', '👿', '💻', '🎸', '🥁', '🎨', '🔥', '👻', '😎', '😜', '😍', '🎉', '🌟'];
  
  return Array.from({ length: count }).map((_, i) => ({
    id: 'preset-' + i,
    name: names[Math.floor(Math.random() * names.length)] + '_' + i.toString().padStart(3, '0'),
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    imageUrl: null,
    hasItem: Math.random() > 0.5,
    x: Math.random() * 2800 + 100,
    y: Math.random() * 2800 + 100,
    delay: Math.random() * -2, 
    duration: 1.0 + Math.random() * 0.4,
    motionType: Math.floor(Math.random() * 2),
    jumpsCount: Math.floor(Math.random() * 95000) + 1200,
    isUser: false,
    runBest: Math.floor(Math.random() * 80),
    roofBest: Math.floor(Math.random() * 400)
  }));
};

function RetroModal({ isOpen, title, message, onConfirm, onCancel, showCancel = true }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="win95-window w-80 shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
        <div className="win95-titlebar bg-[#000080]">
          <span>{title}</span>
          <button className="win95-title-btn" onClick={onCancel || onConfirm}>X</button>
        </div>
        <div className="p-4 bg-[#c0c0c0] flex flex-col gap-4 text-black text-center pt-6">
          <div className="text-sm font-bold">{message}</div>
          <div className="flex justify-center gap-4 mt-4">
            <button className="win95-button min-w-[80px]" onClick={onConfirm}>확인(O)</button>
            {showCancel && <button className="win95-button min-w-[80px]" onClick={onCancel}>취소(C)</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

const overlap = (a1, a2, b1, b2) => a1 < b2 && a2 > b1;

function MiniGameRun({ isOpen, onClose, myCharacter, onAddJumps, onUpdateBestScore }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('READY'); // READY, PLAYING, SUCCESS, GAMEOVER
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [reward, setReward] = useState(0);

  const frameRef = useRef(0);
  const stateRef = useRef('READY');
  const playerImgRef = useRef(null);
  
  // 외부 렌더링에 의한 게임 끊김(Stuttering)을 방지하기 위해 최신 props를 ref에 저장
  const propsRef = useRef({ myCharacter, onAddJumps, onUpdateBestScore });
  useEffect(() => { propsRef.current = { myCharacter, onAddJumps, onUpdateBestScore }; }, [myCharacter, onAddJumps, onUpdateBestScore]);

  const RUN_GOAL = 250;
  const REWARD_PER_OBSTACLE = 5;
  const GAME_WIDTH = 700;
  const GAME_HEIGHT = 340;
  const GROUND_Y = 280;
  const PLAYER_SIZE = 48;

  useEffect(() => {
    if (myCharacter?.imageUrl) {
      const img = new Image();
      img.src = myCharacter.imageUrl;
      img.onload = () => { playerImgRef.current = img; };
    } else {
      playerImgRef.current = null;
    }
  }, [myCharacter?.imageUrl]);

  const start = useCallback(() => {
    stateRef.current = 'PLAYING';
    setScore(0);
    setFinalScore(0);
    setReward(0);
    setGameState('PLAYING');
  }, []);

  useEffect(() => {
    const startKey = (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && stateRef.current !== 'PLAYING') { 
        e.preventDefault(); 
        start(); 
      }
    };
    window.addEventListener('keydown', startKey);
    return () => window.removeEventListener('keydown', startKey);
  }, [start]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const player = { y: GROUND_Y - PLAYER_SIZE, vy: 0, jumps: 0, shield: 0, invincible: 0 };
    const obstacles = [];
    const items = [];
    let frame = 0, clearedObstacles = 0, speed = 7, lastSpawn = 0, done = false;

    const jump = () => {
      if (player.jumps < 2) { player.vy = player.jumps === 0 ? -15.5 : -13; player.jumps += 1; }
    };
    
    const playKey = (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', playKey);

    const finish = (cleared) => {
      if (done) return;
      done = true;
      stateRef.current = cleared ? 'SUCCESS' : 'GAMEOVER';
      setGameState(stateRef.current);
      const earned = clearedObstacles * REWARD_PER_OBSTACLE;
      setFinalScore(clearedObstacles);
      setReward(earned);
      
      const { myCharacter: char, onAddJumps: add, onUpdateBestScore: updateBest } = propsRef.current;
      if (earned > 0 && char) add(char.id, earned);
      if (char) updateBest(char.id, 'run', clearedObstacles);
    };

    const drawAvatar = (ctx, x, y, size) => {
      if (playerImgRef.current) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(playerImgRef.current, x, y, size, size);
      } else {
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(propsRef.current.myCharacter?.emoji || '😎', x + size / 2, y + size / 2);
      }
    };

    const loop = () => {
      frame += 1;
      speed = 7 + Math.min(6, clearedObstacles * 0.025);
      player.vy += 0.78;
      player.y += player.vy;
      if (player.y >= GROUND_Y - PLAYER_SIZE) { player.y = GROUND_Y - PLAYER_SIZE; player.vy = 0; player.jumps = 0; }
      player.shield = Math.max(0, player.shield - 1);
      player.invincible = Math.max(0, player.invincible - 1);

      if (frame - lastSpawn > Math.max(46, 90 - clearedObstacles * 0.18)) {
        lastSpawn = frame;
        const roll = Math.random();
        const type = roll < .18 ? "laser" : roll < .42 ? "drone" : roll < .75 ? "barrier" : "sign";
        const dimensions = {
          laser: { w: 58, h: 20 },
          drone: { w: 34, h: 76 },
          barrier: { w: 42, h: 38 },
          sign: { w: 27, h: 62 }
        }[type];
        obstacles.push({ x: GAME_WIDTH + 20, ...dimensions, type });
        if (Math.random() < .58) items.push({ x: GAME_WIDTH + 65, y: 150 + Math.random() * 75, shield: Math.random() < .17 });
      }

      for (let i = obstacles.length - 1; i >= 0; i -= 1) {
        const o = obstacles[i];
        o.x -= speed;
        const y = o.type === "laser" ? 185 : o.type === "drone" ? 165 + Math.sin((frame + o.x) / 13) * 14 : GROUND_Y - o.h;
        if (o.x + o.w < 0) { obstacles.splice(i, 1); clearedObstacles += 1; setScore(clearedObstacles); continue; }
        const collision = overlap(67, 97, o.x + 4, o.x + o.w - 4) && overlap(player.y + 7, player.y + PLAYER_SIZE - 5, y + 4, y + o.h - 2);
        if (collision && player.invincible === 0) {
          if (player.shield > 0) { player.shield = 0; player.invincible = 45; obstacles.splice(i, 1); }
          else { finish(false); return; }
        }
      }

      for (let i = items.length - 1; i >= 0; i -= 1) {
        const item = items[i]; item.x -= speed;
        if (item.x < 0) { items.splice(i, 1); continue; }
        if (overlap(58, 106, item.x - 12, item.x + 12) && overlap(player.y, player.y + PLAYER_SIZE, item.y - 12, item.y + 12)) {
          if (item.shield) player.shield = 520;
          else { player.invincible = Math.max(player.invincible, 30); }
          items.splice(i, 1);
        }
      }
      if (clearedObstacles >= RUN_GOAL) { clearedObstacles = RUN_GOAL; setScore(clearedObstacles); finish(true); return; }

      const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT); 
      sky.addColorStop(0, "#090f2e"); sky.addColorStop(1, "#31174b");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      for (let i = 0; i < 18; i += 1) { 
        ctx.globalAlpha = .28; ctx.fillStyle = i % 3 ? "#5de4ff" : "#ff62c0"; 
        ctx.fillRect((i * 89 - frame * speed * .18) % (GAME_WIDTH + 80), 65 + (i % 5) * 27, 2, 2); 
      }
      ctx.globalAlpha = 1; ctx.fillStyle = "#1d1742"; ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
      ctx.strokeStyle = "#5de4ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(GAME_WIDTH, GROUND_Y); ctx.stroke();
      
      items.forEach((item) => { 
        ctx.font = "26px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(item.shield ? "🛡️" : "✦", item.x, item.y); 
      });
      
      obstacles.forEach((o) => {
        const y = o.type === "laser" ? 185 : o.type === "drone" ? 165 + Math.sin((frame + o.x) / 13) * 14 : GROUND_Y - o.h;
        if (o.type === "barrier") { ctx.fillStyle = "#ff5a61"; ctx.fillRect(o.x, y, o.w, o.h); ctx.fillStyle = "#ffd45f"; ctx.fillRect(o.x + 5, y + 12, o.w - 10, 8); }
        if (o.type === "sign") { ctx.fillStyle = "#55e2ff"; ctx.fillRect(o.x + 10, y, 7, o.h); ctx.fillStyle = "#fff"; ctx.fillRect(o.x, y, o.w, 23); }
        if (o.type === "drone") { ctx.fillStyle = "#ff62c0"; ctx.fillRect(o.x, y + 11, o.w, 17); ctx.fillStyle = "#b6f6ff"; ctx.fillRect(o.x + 8, y + 15, o.w - 16, 5); }
        if (o.type === "laser") {
          ctx.fillStyle = "#3b174e"; ctx.fillRect(o.x, y, 8, o.h); ctx.fillRect(o.x + o.w - 8, y, 8, o.h);
          ctx.shadowColor = "#ff2f8b"; ctx.shadowBlur = 10;
          ctx.fillStyle = "#ff2f8b"; ctx.fillRect(o.x + 8, y + 8, o.w - 16, 4);
          ctx.shadowBlur = 0;
        }
      });
      
      if (player.shield) { ctx.strokeStyle = "#9bfbff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(82, player.y + 24, 34, 0, Math.PI * 2); ctx.stroke(); }
      drawAvatar(ctx, 58, player.y, PLAYER_SIZE);
      
      ctx.fillStyle = "#0c0c23"; ctx.fillRect(18, 15, 220, 44); ctx.strokeStyle = "#5de4ff"; ctx.strokeRect(18, 15, 220, 44);
      ctx.fillStyle = "#fff"; ctx.font = "bold 18px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(`RUN  ${String(clearedObstacles).padStart(3, "0")} / ${RUN_GOAL}`, 30, 43);
      
      frameRef.current = requestAnimationFrame(loop);
    };
    
    frameRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('keydown', playKey); };
  }, [gameState]); // 변경점: 끊김 유발 의존성 제거

  useEffect(() => {
     if (gameState === 'READY' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#090f2e'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "#1d1742"; ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
        ctx.strokeStyle = "#5de4ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(GAME_WIDTH, GROUND_Y); ctx.stroke();
        
        if (playerImgRef.current) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(playerImgRef.current, 58, GROUND_Y - PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
        } else {
          ctx.font = `${PLAYER_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(propsRef.current.myCharacter?.emoji || '😎', 58 + PLAYER_SIZE/2, GROUND_Y - PLAYER_SIZE + PLAYER_SIZE/2);
        }
     }
  }, [gameState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex flex-col items-center justify-center p-4">
      <div className="win95-window w-full max-w-[720px] shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
        <div className="win95-titlebar">
          <div className="flex items-center gap-1.5"><span>🕹️ 에바뛰_RUN.exe</span></div>
          <button className="win95-title-btn" onClick={onClose}>X</button>
        </div>
        <div className="bg-[#c0c0c0] p-2 flex flex-col items-center">
          <div className="win95-input p-0 bg-[#090f2e] relative w-full overflow-hidden border-2 border-[#7474a4]">
            <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="w-full h-auto cursor-pointer block" style={{ imageRendering: 'pixelated', touchAction: 'none' }}
              onPointerDown={() => {
                if (gameState === 'PLAYING') window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
                else start();
              }}
            />
            
            {gameState === 'READY' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white pointer-events-none">
                <h2 className="text-3xl font-bold mb-1 text-[#ff62c0]" style={{ textShadow: "0 0 14px #ff62c0" }}>READY?</h2>
                <p className="font-bold text-white mt-2">목표: 장애물 {RUN_GOAL}개 통과</p>
                <p className="text-sm text-[#5de4ff] mt-1">장애물 1개당 {REWARD_PER_OBSTACLE} JUMP 획득</p>
                <p className="text-xs text-[#ffd45f] mt-1">공중 레이저 주의! 때로는 뛰지 않아야 안전해요.</p>
                <p className="text-sm mt-4 animate-pulse bg-[#e9ecff] text-[#09091b] font-bold px-4 py-2 border-2 border-white shadow-[3px_3px_#454363]">화면 탭 / 스페이스바로 시작</p>
              </div>
            )}
            {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white">
                <h2 className="text-3xl font-bold mb-2 text-[#ff5a61]" style={{ textShadow: "0 0 14px #ff5a61" }}>GAME OVER</h2>
                <div className="mb-4 text-sm flex flex-col items-center gap-1 font-bold">
                   <p className="text-white text-lg">+{reward.toLocaleString()} JUMP 획득</p>
                   <p className="text-[#ff62c0]">통과한 장애물: {finalScore}개</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={start} className="win95-button !bg-[#e9ecff] !border-white !text-[#09091b] !shadow-[3px_3px_#454363] py-2 px-4 font-bold">TRY AGAIN</button>
                   <button onClick={onClose} className="win95-button py-2 px-4">종료</button>
                </div>
              </div>
            )}
            {gameState === 'SUCCESS' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white z-10">
                <h2 className="text-3xl font-bold mb-1 text-[#ff62c0]" style={{ textShadow: "0 0 14px #ff62c0" }}>MISSION COMPLETE!</h2>
                <p className="text-lg font-bold text-white">장애물 {finalScore}개 통과!</p>
                <p className="text-xl mb-3 font-bold text-[#5de4ff]">+{reward.toLocaleString()} JUMP 획득</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={onClose} className="win95-button py-2 px-4">확인</button>
                  <button onClick={(e) => {
                      e.stopPropagation();
                      const text = `내 ${myCharacter.name}이(가) 에바뛰 RUN에서 장애물 ${finalScore}개를 통과하고 +${reward.toLocaleString()} JUMP 획득! 🏃‍♂️💨`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="win95-button py-2 px-4 font-bold !bg-[#e9ecff] !text-[#09091b] !border-white !shadow-[3px_3px_#454363]"
                  >𝕏 자랑하기</button>
                </div>
              </div>
            )}
          </div>
          <div className="w-full text-left text-[10px] text-gray-700 mt-2 flex justify-between font-bold">
            <span>스페이스 · ↑ · W · 화면 탭 | 공중에서 한 번 더 점프</span>
            <span className="text-[#ff62c0]">최고 기록: {myCharacter?.runBest || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniGameRoofBreaker({ isOpen, onClose, myCharacter, onAddJumps, onUpdateBestScore }) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('READY'); 
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [reward, setReward] = useState(0);

  const frameRef = useRef(0);
  const stateRef = useRef('READY');
  const playerImgRef = useRef(null);
  
  // 외부 렌더링에 의한 뚝뚝 끊김 방지용 Ref
  const propsRef = useRef({ myCharacter, onAddJumps, onUpdateBestScore });
  useEffect(() => { propsRef.current = { myCharacter, onAddJumps, onUpdateBestScore }; }, [myCharacter, onAddJumps, onUpdateBestScore]);

  // 창이 열릴 때마다 상태를 강제 초기화하여 백화현상 방지
  useEffect(() => {
    if (isOpen) {
      setGameState('READY');
      stateRef.current = 'READY';
      setScore(0);
      setFinalScore(0);
      setReward(0);
    }
  }, [isOpen]);

  const ROOF_GOAL = 1000;
  const GAME_WIDTH = 420;
  const GAME_HEIGHT = 610;
  const PLAYER_SIZE = 42;
  const PIXELS_PER_METER = 7.5;

  useEffect(() => {
    if (myCharacter?.imageUrl) {
      const img = new Image();
      img.src = myCharacter.imageUrl;
      img.onload = () => { playerImgRef.current = img; };
    } else {
      playerImgRef.current = null;
    }
  }, [myCharacter?.imageUrl]);

  const start = useCallback(() => {
    stateRef.current = 'PLAYING';
    setScore(0);
    setFinalScore(0);
    setReward(0);
    setGameState('PLAYING');
  }, []);

  useEffect(() => {
    const key = (e) => { 
      if (['Space', 'Enter'].includes(e.code) && stateRef.current !== 'PLAYING') { 
        e.preventDefault(); 
        start(); 
      } 
    };
    window.addEventListener('keydown', key); 
    return () => window.removeEventListener('keydown', key);
  }, [start]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const keys = { left: false, right: false };
    const player = { x: 189, y: GAME_HEIGHT - 125, vx: 0, vy: -14 };

    // 모든 고도에서 같은 공식으로 계산해 초반/중반 발판 크기가 역전되지 않게 한다.
    const getPlatformWidth = (altitude) => {
      const difficulty = Math.min(1, Math.max(0, altitude) / ROOF_GOAL);
      return 145 - (145 - 45) * Math.pow(difficulty, 1.05);
    };
    
    // 발판 초기 세팅 (시작할 땐 무조건 넓고 촘촘하게!)
    const platforms = [{ x: GAME_WIDTH / 2 - 72.5, y: GAME_HEIGHT - 20, w: 145, type: "normal", dir: 1, used: false }];
    let lastY = GAME_HEIGHT - 20;
    let lastX = GAME_WIDTH / 2 - 72.5;
    
    // 초반 12개 안전 발판 세팅
    for (let i = 1; i < 12; i++) {
      const diff = i / 12;
      const g = 58 + diff * 12;
      lastY -= g;
      const altitude = Math.max(0, ((GAME_HEIGHT - 20) - lastY) / PIXELS_PER_METER);
      const w = getPlatformWidth(altitude);
      platforms.push({ x: Math.random() * (GAME_WIDTH - w), y: lastY, w: w, type: "normal", dir: Math.random() > 0.5 ? 1 : -1, used: false });
    }

    let camera = 0, best = 0, reported = 0, frame = 0, done = false;

    // 동적 발판 생성 로직 (위로 갈수록 좁아짐)
    const addPlatform = () => {
      // 배열이 비어있는 경우를 대비한 안전장치
      if (platforms.length === 0) return;
      
      const highestY = platforms[platforms.length - 1].y;
      const heightFromStart = Math.max(0, (GAME_HEIGHT - 20) - highestY);
      const estimatedAltitude = Math.min(ROOF_GOAL, heightFromStart / PIXELS_PER_METER);
      const difficulty = Math.min(1, estimatedAltitude / ROOF_GOAL);
      
      // 발판 간격
      const minGap = 52 + difficulty * 20;
      const randomGap = Math.random() * (8 + difficulty * 15);
      const gap = minGap + randomGap;

      lastY = highestY - gap;
      const nextAltitude = Math.min(ROOF_GOAL, Math.max(0, ((GAME_HEIGHT - 20) - lastY) / PIXELS_PER_METER));
      const width = getPlatformWidth(nextAltitude);
      lastX = Math.max(8, Math.min(GAME_WIDTH - width - 8, Math.random() * (GAME_WIDTH - width)));

      // 난이도별 기믹 확률
      let movingChance = 0;
      if (estimatedAltitude >= 800) movingChance = 0.5;
      else if (estimatedAltitude >= 400) movingChance = 0.38;
      else if (estimatedAltitude >= 300) movingChance = 0.25;
      else if (estimatedAltitude >= 200) movingChance = 0.14;
      else if (estimatedAltitude >= 120) movingChance = 0.05;

      let type = Math.random() < movingChance ? "moving" : "normal";
      if (estimatedAltitude > 500 && Math.random() < 0.2) type = "fragile";
      if (Math.random() > 0.92) type = "boost";

      platforms.push({ x: lastX, y: lastY, w: width, type, dir: Math.random() > 0.5 ? 1 : -1, used: false });
    };

    const keyDown = (e) => { 
      if (['ArrowLeft', 'KeyA'].includes(e.code)) { keys.left = true; e.preventDefault(); } 
      if (['ArrowRight', 'KeyD'].includes(e.code)) { keys.right = true; e.preventDefault(); } 
    };
    const keyUp = (e) => { 
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.left = false; 
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.right = false; 
    };
    
    window.addEventListener('keydown', keyDown); 
    window.addEventListener('keyup', keyUp);
    
    const finish = (cleared) => { 
      if (done) return; 
      done = true; 
      stateRef.current = cleared ? 'SUCCESS' : 'GAMEOVER'; 
      setGameState(stateRef.current); 
      const earned = cleared ? 2000 : Math.max(10, Math.floor(best / 2));
      setFinalScore(best);
      setReward(earned);
      
      const { myCharacter: char, onAddJumps: add, onUpdateBestScore: updateBest } = propsRef.current;
      if (earned > 0 && char) add(char.id, earned);
      if (char) updateBest(char.id, 'roof', best);
    };

    const drawAvatar = (ctx, x, y, size) => {
      if (playerImgRef.current) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(playerImgRef.current, x, y, size, size);
      } else {
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(propsRef.current.myCharacter?.emoji || '😎', x + size / 2, y + size / 2);
      }
    };

    const drawBackground = (ctx, alt) => {
        let bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        if (alt < 200) { bg.addColorStop(0, "#2a1e12"); bg.addColorStop(1, "#110b05"); } // 지하
        else if (alt < 500) { bg.addColorStop(0, "#4facfe"); bg.addColorStop(1, "#00f2fe"); } // 하늘
        else if (alt < 800) { bg.addColorStop(0, "#1a2a6c"); bg.addColorStop(1, "#112b3c"); } // 성층권
        else { bg.addColorStop(0, "#0f0c29"); bg.addColorStop(1, "#302b63"); } // 우주
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        let stageText = "지하 그라운드 (GROUND)";
        if (alt >= 800) stageText = "우주 (SPACE)";
        else if (alt >= 500) stageText = "성층권 (STRATOSPHERE)";
        else if (alt >= 200) stageText = "하늘 (SKY)";

        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(stageText, GAME_WIDTH / 2, GAME_HEIGHT / 2);
    };

    const loop = () => {
      frame += 1;
      player.vx += keys.left ? -.72 : keys.right ? .72 : -player.vx * .16;
      player.vx = Math.max(-6.4, Math.min(6.4, player.vx)); player.x += player.vx;
      if (player.x < -PLAYER_SIZE) player.x = GAME_WIDTH; if (player.x > GAME_WIDTH) player.x = -PLAYER_SIZE;
      
      player.vy += .62; const oldBottom = player.y + PLAYER_SIZE; player.y += player.vy;
      
      platforms.forEach((p) => { 
        if (p.type === "moving") { 
          const moveSpeed = 1.1 + Math.min(1, Math.max(0, (GAME_HEIGHT - p.y) / PIXELS_PER_METER) / ROOF_GOAL) * 1.5;
          p.x += p.dir * moveSpeed; 
          if (p.x < 0 || p.x + p.w > GAME_WIDTH) p.dir *= -1; 
        } 
      });
      
      if (player.vy > 0) {
        for (const p of platforms) {
          const landing = !p.used && oldBottom <= p.y + 12 && player.y + PLAYER_SIZE >= p.y && player.x + PLAYER_SIZE - 8 > p.x && player.x + 8 < p.x + p.w;
          if (landing) { player.vy = p.type === "boost" ? -18.2 : -14.1; if (p.type === "fragile") p.used = true; break; }
        }
      }
      
      if (player.y < camera + 265) camera = player.y - 265;
      
      // 발판 배열 안전장치
      if (platforms.length > 0) {
        while (platforms.length > 0 && platforms[platforms.length - 1].y > camera - 260) addPlatform();
        while (platforms.length > 0 && platforms[0].y > camera + GAME_HEIGHT + 80) platforms.shift();
      }

      best = Math.max(best, Math.floor(Math.max(0, -camera / PIXELS_PER_METER)));
      if (best !== reported) { reported = best; setScore(best); }
      if (best >= ROOF_GOAL) { finish(true); return; }
      if (player.y > camera + GAME_HEIGHT + 60) { finish(false); return; }

      drawBackground(ctx, best);
      
      platforms.forEach((p) => {
        const y = p.y - camera; if (y < -20 || y > GAME_HEIGHT + 20 || p.used) return;
        const color = p.type === "moving" ? "#ff62c0" : p.type === "boost" ? "#ffd45f" : p.type === "fragile" ? "#a982f2" : "#5de4ff";
        ctx.fillStyle = color; ctx.fillRect(p.x, y, p.w, 11); ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.fillRect(p.x + 3, y + 2, p.w - 6, 2);
      });
      
      drawAvatar(ctx, player.x, player.y - camera, PLAYER_SIZE);
      
      ctx.fillStyle = "rgba(6,8,28,.85)"; ctx.fillRect(12, 14, 215, 44); ctx.strokeStyle = "#5de4ff"; ctx.strokeRect(12, 14, 215, 44);
      ctx.fillStyle = "#fff"; ctx.font = "bold 18px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(`ALT ${String(best).padStart(4, "0")}M / 1000M`, 24, 43);
      
      frameRef.current = requestAnimationFrame(loop);
    };
    
    frameRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); };
  }, [gameState]);

  useEffect(() => {
     if (gameState === 'READY' && isOpen && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT); 
        bg.addColorStop(0, "#2a1e12"); bg.addColorStop(1, "#110b05"); 
        ctx.fillStyle = bg; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = "#5de4ff"; ctx.fillRect(145, GAME_HEIGHT - 45, 130, 11); 
        ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.fillRect(145 + 3, GAME_HEIGHT - 45 + 2, 130 - 6, 2);

        if (playerImgRef.current) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(playerImgRef.current, GAME_WIDTH/2 - PLAYER_SIZE/2, GAME_HEIGHT - 125, PLAYER_SIZE, PLAYER_SIZE);
        } else {
          ctx.font = `${PLAYER_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(propsRef.current.myCharacter?.emoji || '😎', GAME_WIDTH/2, GAME_HEIGHT - 125 + PLAYER_SIZE/2);
        }
     }
  }, [gameState, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex flex-col items-center justify-center p-4">
      <div className="win95-window w-full max-w-[420px] shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
        <div className="win95-titlebar">
          <div className="flex items-center gap-1.5"><span>🚀 KSPO_ROOF_BREAKER.exe</span></div>
          <button className="win95-title-btn" onClick={onClose}>X</button>
        </div>
        <div className="bg-[#c0c0c0] p-2 flex flex-col items-center">
          <div className="win95-input p-0 bg-[#211535] relative w-full overflow-hidden border-2 border-[#7474a4]">
            <canvas 
              ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} 
              className="w-full h-auto cursor-crosshair block" 
              style={{ imageRendering: 'pixelated', touchAction: 'none' }}
              onPointerDown={(e) => {
                if (gameState !== 'PLAYING') { start(); return; }
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeft = e.clientX - rect.left < rect.width / 2;
                window.dispatchEvent(new KeyboardEvent("keydown", { code: isLeft ? "ArrowLeft" : "ArrowRight" }));
              }}
              onPointerUp={() => {
                window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft" }));
                window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));
              }}
              onPointerLeave={() => {
                window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft" }));
                window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight" }));
              }}
            />
            
            {gameState === 'READY' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white pointer-events-none">
                <h2 className="text-3xl font-bold mb-1 text-[#5de4ff]" style={{ textShadow: "0 0 14px #5de4ff" }}>READY?</h2>
                <p className="font-bold text-white mt-2">목표: 1000m 우주 돌파</p>
                <p className="text-sm mt-4 animate-pulse bg-[#e9ecff] text-[#09091b] font-bold px-4 py-2 border-2 border-white shadow-[3px_3px_#454363]">화면 좌/우 터치로 이동</p>
              </div>
            )}
            {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white">
                <h2 className="text-3xl font-bold mb-2 text-[#ff5a61]" style={{ textShadow: "0 0 14px #ff5a61" }}>GAME OVER</h2>
                <div className="mb-4 text-sm flex flex-col items-center gap-1 font-bold">
                   <p className="text-white text-lg">+{reward} JUMP 획득</p>
                   <p className="text-[#5de4ff]">최종 기록: {finalScore}M</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={start} className="win95-button !bg-[#e9ecff] !border-white !text-[#09091b] !shadow-[3px_3px_#454363] py-2 px-4 font-bold">TRY AGAIN</button>
                   <button onClick={onClose} className="win95-button py-2 px-4">종료</button>
                </div>
              </div>
            )}
            {gameState === 'SUCCESS' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white z-10">
                <h2 className="text-3xl font-bold mb-1 text-[#5de4ff]" style={{ textShadow: "0 0 14px #5de4ff" }}>MISSION COMPLETE!</h2>
                <p className="text-xl mb-3 font-bold text-white">+{reward} JUMP 대량 획득!</p>
                <div className="flex gap-2 mt-2 w-3/4 flex-col">
                  <button onClick={(e) => {
                      e.stopPropagation();
                      const text = `내 ${myCharacter.name}이(가) KSPO 지붕 뚫고 우주 돌파! 🚀 +${reward}점 획득!`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="win95-button py-2 px-4 font-bold !bg-[#e9ecff] !text-[#09091b] !border-white !shadow-[3px_3px_#454363] w-full"
                  >𝕏 자랑하기</button>
                  <button onClick={onClose} className="win95-button py-2 px-4 w-full">닫기</button>
                </div>
              </div>
            )}
          </div>
          <div className="w-full text-left text-[10px] text-gray-700 mt-2 flex justify-between font-bold">
            <span>← → · A D · 화면 좌/우 길게 눌러 이동</span>
            <span className="text-[#5de4ff]">최고 기록: {myCharacter?.roofBest || 0}M</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [characterName, setCharacterName] = useState('');
  const [characterImage, setCharacterImage] = useState(null);
  const [characterEmoji, setCharacterEmoji] = useState('😎');
  const [motionType, setMotionType] = useState(0);
  const [hasItem, setHasItem] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  
  const [worldCharacters, setWorldCharacters] = useState([]);
  const [myCharacterId, setMyCharacterId] = useState(null);
  const [currentCapacity, setCurrentCapacity] = useState(INITIAL_FILL);
  const [isFull, setIsFull] = useState(false);

  const [sysStageImg, setSysStageImg] = useState(DEFAULT_STAGE_IMG);
  const [sysFanImg, setSysFanImg] = useState(DEFAULT_FAN_IMG);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, showCancel: false });

  const showModal = useCallback((title, message, onConfirm, showCancel = true) => {
    setModalConfig({ isOpen: true, title, message, onConfirm: () => { onConfirm?.(); setModalConfig(prev => ({...prev, isOpen: false})); }, showCancel, onCancel: () => setModalConfig(prev => ({...prev, isOpen: false})) });
  }, []);

  // Firebase 로그인 상태와 서버에서 발급된 admin Custom Claim을 확인합니다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult();
        setIsAdmin(IS_ADMIN_PAGE && tokenResult.claims.admin === true);
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthReady(true);
      }
    });

    return unsubscribe;
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      setAdminLoginError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setAdminLoginLoading(true);
    setAdminLoginError('');

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, adminEmail.trim(), adminPassword);
      const tokenResult = await credential.user.getIdTokenResult(true);

      if (tokenResult.claims.admin !== true) {
        await signOut(firebaseAuth);
        setAdminLoginError('관리자 권한이 없는 계정입니다.');
        return;
      }

      setIsAdmin(true);
      setAdminPassword('');
    } catch {
      setAdminLoginError('로그인 정보를 확인해 주세요.');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await signOut(firebaseAuth);
    setIsAdmin(false);
    setAdminPassword('');
  };

  useEffect(() => {
    setWorldCharacters(generatePresets(150));
  }, []);

  // 1초마다 +1 패시브 점프
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setWorldCharacters(prev => prev.map(c => {
        if (c.restUntil && now < c.restUntil) return c;

        const nextJumps = (c.jumpsCount || 0) + 1;
        return {
          ...c,
          jumpsCount: nextJumps,
          restUntil: nextJumps % 50 === 0 ? now + 10000 : null
        };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (currentCapacity >= MAX_CAPACITY) setIsFull(true);
  }, [currentCapacity]);

  const handleRegister = (newChar) => {
    if (currentCapacity >= MAX_CAPACITY) {
        showModal('접속 불가', '광장 수용 인원이 가득 찼습니다.', null, false);
        return; 
    }
    const charWithCoords = {
      ...newChar,
      x: 1500 + (Math.random() * 120 - 60),
      y: 1500 + (Math.random() * 120 - 60)
    };
    setWorldCharacters(prev => [charWithCoords, ...prev]);
    setMyCharacterId(newChar.id);
    setCurrentCapacity(prev => prev + 1);
    setStep(2);
  };

  const handleUpdateCharacterPosition = useCallback((id, newX, newY) => {
    setWorldCharacters(prev => prev.map(c => c.id === id ? { ...c, x: newX, y: newY } : c));
  }, []);

  const handleDeleteCharacter = useCallback((id) => {
    if (!isAdmin && id !== myCharacterId) return;
    setWorldCharacters(prev => prev.filter(c => c.id !== id));
    setCurrentCapacity(prev => Math.max(0, prev - 1));
    if (id === myCharacterId) {
      setMyCharacterId(null);
      showModal('알림', '자신의 캐릭터를 삭제하여 구경 모드로 전환됩니다.', null, false);
    }
  }, [isAdmin, myCharacterId, showModal]);

  const handleAddJumps = useCallback((id, amount, stopAtRestBoundary = false) => {
    const now = Date.now();
    setWorldCharacters(prev => prev.map(c => {
      if (c.id !== id || (c.restUntil && now < c.restUntil)) return c;

      const currentJumps = c.jumpsCount || 0;
      const requestedJumps = currentJumps + amount;

      // 광장 점프는 50의 배수를 건너뛰지 않고 정확히 그 숫자에서 휴식한다.
      if (stopAtRestBoundary) {
        const nextRestBoundary = (Math.floor(currentJumps / 50) + 1) * 50;
        if (requestedJumps >= nextRestBoundary) {
          return { ...c, jumpsCount: nextRestBoundary, restUntil: now + 10000 };
        }
      }

      return { ...c, jumpsCount: requestedJumps };
    }));
  }, []);

  const handleUpdateBestScore = useCallback((id, gameType, score) => {
    setWorldCharacters(prev => prev.map(c => {
      if (c.id === id) {
        const currentBest = c[`${gameType}Best`] || 0;
        if (score > currentBest) {
          return { ...c, [`${gameType}Best`]: score };
        }
      }
      return c;
    }));
  }, []);

  const handleResetWorld = useCallback(() => {
    if (!isAdmin) return;
    setWorldCharacters([]);
    setCurrentCapacity(0);
    setMyCharacterId(null);
    setIsFull(false);
    showModal('초기화 완료', '월드가 완전히 초기화되었습니다.', null, false);
  }, [isAdmin, showModal]);

  const fillPercentage = ((currentCapacity / MAX_CAPACITY) * 100).toFixed(1);

  return (
    <div className="w-full h-screen flex flex-col font-sans overflow-hidden bg-[#808080] text-black">
      <style>{globalStyles}</style>

      {/* 레트로 윈도우 95 스타일 헤더 */}
      <header className="win95-panel m-0 p-2 flex flex-col md:flex-row justify-between items-center gap-4 z-40">
        <div className="flex items-center gap-2 px-2 w-full md:w-auto justify-start">
          <div className="flex items-center gap-2">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWpz2kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA6SURBVChTY/z//z8DtQATAxWASTT//9sV9A8nQ9Vwg0BcEKYIboBIAwB2F1FkA7oBsAC6AcQGIMv/GQC0oSEW4K7rKAAAAABJRU5ErkJggg==" alt="icon" className="w-4 h-4 rendering-pixelated" />
            <h1 className="text-sm font-bold">에바뛰_네트워크_모니터.exe {isAdmin && <span className="text-red-600">[ADMIN]</span>}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto px-2 justify-end">
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs font-bold tracking-wide">
              KSPO DOME 실시간 인원 <span className="text-[#000080] text-sm">{currentCapacity.toLocaleString()}</span> / {MAX_CAPACITY.toLocaleString()}명
            </div>
            {/* 윈도우 95 스타일 프로그레스 바 */}
            <div className="win95-input p-[1px] w-full sm:w-64 h-[16px] flex bg-[#c0c0c0]">
              <div className={`h-full ${isFull ? 'bg-red-600' : 'bg-[#000080]'}`} style={{ width: `${fillPercentage}%` }}></div>
            </div>
          </div>
          
          {step === 1 && (
            <button onClick={() => setStep(2)} className="win95-button font-bold py-1 px-4 text-sm ml-4 h-[30px] whitespace-nowrap">
              KSPO DOME으로 가기 🚀
            </button>
          )}
          {isFull && <span className="text-xs text-red-600 font-bold blink-text">[SOLD OUT]</span>}
          {isAdmin && <button onClick={handleAdminLogout} className="win95-button text-xs text-red-700 font-bold">관리자 로그아웃</button>}
        </div>
      </header>

      <main className="flex-1 relative w-full h-full p-2 flex items-center justify-center">
        {step === 1 ? (
          <Step1Create 
            characterName={characterName} setCharacterName={setCharacterName}
            characterImage={characterImage} setCharacterImage={setCharacterImage}
            characterEmoji={characterEmoji} setCharacterEmoji={setCharacterEmoji}
            motionType={motionType} setMotionType={setMotionType}
            hasItem={hasItem} setHasItem={setHasItem}
            onRegister={handleRegister} isFull={isFull}
            setSysStageImg={setSysStageImg} setSysFanImg={setSysFanImg}
          />
        ) : (
          <Step2GlobalSquare 
            characters={worldCharacters} myCharacterId={myCharacterId} isAdmin={isAdmin}
            onGoHome={() => setStep(1)} onUpdatePosition={handleUpdateCharacterPosition}
            onDeleteCharacter={handleDeleteCharacter} sysStageImg={sysStageImg} sysFanImg={sysFanImg}
            onAddJumps={handleAddJumps} onResetWorld={handleResetWorld} onShowConfirm={showModal}
            onUpdateBestScore={handleUpdateBestScore}
          />
        )}
      </main>
      <RetroModal {...modalConfig} />

      {IS_ADMIN_PAGE && authReady && !isAdmin && (
        <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-4">
          <form onSubmit={handleAdminLogin} className="win95-window w-full max-w-sm shadow-[4px_4px_0_rgba(0,0,0,0.7)]">
            <div className="win95-titlebar">
              <span>Firebase_Admin_Login.exe</span>
            </div>
            <div className="bg-[#c0c0c0] p-4 text-black flex flex-col gap-3">
              <div className="text-sm font-bold">Firebase 관리자 계정으로 로그인</div>
              <label className="text-xs font-bold" htmlFor="admin-email">이메일</label>
              <input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="win95-input w-full p-2" autoComplete="username" autoFocus />
              <label className="text-xs font-bold" htmlFor="admin-password">비밀번호</label>
              <input id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="win95-input w-full p-2" autoComplete="current-password" />
              <div className="min-h-[20px] text-xs font-bold text-red-700">{adminLoginError}</div>
              <div className="flex justify-end gap-2">
                <button type="submit" disabled={adminLoginLoading} className="win95-button px-4 py-1 font-bold disabled:opacity-50">{adminLoginLoading ? '확인 중...' : '로그인'}</button>
                <button type="button" onClick={() => { window.location.href = window.location.pathname; }} className="win95-button px-4 py-1">일반 화면</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Step1Create({ 
  characterName, setCharacterName, characterImage, setCharacterImage, characterEmoji, setCharacterEmoji, 
  motionType, setMotionType, hasItem, setHasItem, onRegister, isFull,
  setSysStageImg, setSysFanImg
}) {
  const [isTestJumping, setIsTestJumping] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setCharacterImage(URL.createObjectURL(file));
  };

  const handleEmojiChange = (e) => setCharacterEmoji(sliceEmojiString(e.target.value, 2));

  const handleTestJump = () => {
    setIsTestJumping(true);
    setTimeout(() => setIsTestJumping(false), 1200);
  };

  const handleSubmit = () => {
    if (!characterName.trim() || isFull) return;
    onRegister({
      id: 'user-' + Date.now(), name: characterName, imageUrl: characterImage, emoji: characterImage ? null : (characterEmoji || '😎'),
      hasItem: hasItem, delay: 0, duration: motionType === 1 ? 1.0 : 1.2, motionType: motionType, jumpsCount: 1, isUser: true,
      runBest: 0, roofBest: 0
    });
  };

  return (
    <div className="win95-window w-full max-w-xl mx-auto flex flex-col shadow-[4px_4px_0_rgba(0,0,0,0.5)] z-10 max-h-[90vh] overflow-y-auto">
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5"><span>캐릭터_생성.exe</span></div>
        <button className="win95-title-btn">X</button>
      </div>

      <div className="p-4 flex flex-col md:flex-row gap-4 bg-[#c0c0c0] text-black">
        <div className="flex flex-col gap-2 md:w-1/2">
          <label className="text-sm font-bold">미리보기 (Preview)</label>
          <div className="win95-panel w-full aspect-square bg-white flex items-end justify-center pb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
            <div className={`flex items-center justify-center w-24 h-24 z-10 ${isTestJumping ? 'jump-once-' + motionType : ''}`}>
              <div className="relative inline-flex items-center justify-center pointer-events-none">
                {characterImage ? (
                  <img src={characterImage} alt="preview" className="max-w-[96px] max-h-[96px] object-contain pixelated" />
                ) : (
                  <span className="text-6xl" style={{ textShadow: '2px 2px 0 #fff' }}>{characterEmoji}</span>
                )}
                {hasItem && (
                  <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
                     <div className="relative w-full h-full">
                        <img src={DEFAULT_FAN_IMG} alt="fan" className="absolute -top-[15%] -right-[35%] w-[60%] h-[60%] object-contain rotate-12 origin-bottom-left" />
                     </div>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-6 w-12 h-1 bg-gray-400 rounded-[100%] scale-x-150 z-0"></div>
          </div>
          <button onClick={handleTestJump} className="win95-button w-full">모션 테스트 (T)</button>

          <div className="mt-2 p-2 border-2 border-red-800 bg-red-100 flex flex-col gap-1 text-[10px]">
            <div className="font-bold text-red-800 flex items-center gap-1"><span className="text-sm">🚨</span> 시스템 에셋 수동 업로드 (선택)</div>
            <div className="flex gap-1 items-center"><span className="w-16 font-bold">1. 무대:</span><input type="file" accept="image/*" onChange={(e) => { if(e.target.files[0]) setSysStageImg(URL.createObjectURL(e.target.files[0])); }} className="w-full" /></div>
            <div className="flex gap-1 items-center mt-1"><span className="w-16 font-bold">2. 부채:</span><input type="file" accept="image/*" onChange={(e) => { if(e.target.files[0]) setSysFanImg(URL.createObjectURL(e.target.files[0])); }} className="w-full" /></div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:w-1/2 justify-between">
          <div className="space-y-4">
            <div className="flex flex-col gap-1 border border-[var(--win-border-dark)] p-3 relative pt-4">
              <span className="absolute -top-3 left-2 bg-[#c0c0c0] px-1 text-sm font-bold">닉네임 입력:</span>
              <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="이름을 입력하세요" className="win95-input w-full" maxLength={12} />
            </div>

            <div className="flex flex-col gap-1 border border-[var(--win-border-dark)] p-3 relative pt-4 mt-2">
              <span className="absolute -top-3 left-2 bg-[#c0c0c0] px-1 text-sm font-bold">캐릭터 외형</span>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm w-20 font-bold">이모지 입력:</label>
                <input type="text" value={characterEmoji} onChange={handleEmojiChange} className="win95-input w-16 text-center text-xl bg-white" placeholder="😎" />
                <span className="text-xs text-gray-600">(최대 2개)</span>
              </div>
              <hr className="border-t border-[var(--win-border-dark)] my-2" />
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">또는 내 이미지 업로드:</label>
                <div className="flex gap-1">
                  <label className="win95-button flex-1 cursor-pointer flex justify-center py-1">
                    <span>파일 찾기...</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {characterImage && <button onClick={() => setCharacterImage(null)} className="win95-button text-red-600 px-2 font-bold py-1">X 제거</button>}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 border border-[var(--win-border-dark)] p-3 relative pt-4 mt-2">
              <span className="absolute -top-3 left-2 bg-[#c0c0c0] px-1 text-sm font-bold">점프 스타일</span>
              <div className="flex flex-col gap-2 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" checked={motionType === 0} onChange={() => setMotionType(0)} className="accent-[#000080]" />1. 기본 점프</label>
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" checked={motionType === 1} onChange={() => setMotionType(1)} className="accent-[#000080]" />2. 2단 콩콩 (뽀잉뽀잉)</label>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold mt-2 text-[#000080]">
              <input type="checkbox" checked={hasItem} onChange={(e) => setHasItem(e.target.checked)} className="accent-[#000080]" />
              [아이템] 에바뛰 부채 장착하기
            </label>
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--win-border-white)]">
            <button onClick={handleSubmit} disabled={!characterName.trim() || isFull} className="win95-button font-bold py-2 w-full text-base">
              {isFull ? '접속 불가 (마감)' : '입장하기 (Enter)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2GlobalSquare({ characters, myCharacterId, isAdmin, onGoHome, onUpdatePosition, onDeleteCharacter, sysStageImg, sysFanImg, onAddJumps, onResetWorld, onShowConfirm, onUpdateBestScore }) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const dragDistanceRef = useRef(0);
  
  const [transform, setTransform] = useState({ x: -600, y: -600, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredChar, setHoveredChar] = useState(null);
  const [draggingCharId, setDraggingCharId] = useState(null);

  const [clickCounts, setClickCounts] = useState({});
  const [feverStates, setFeverStates] = useState({});
  const [isRunGameOpen, setIsRunGameOpen] = useState(false);
  const [isRoofGameOpen, setIsRoofGameOpen] = useState(false);

  const filteredChars = useMemo(() => {
    if (!searchTerm) return characters;
    return characters.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [characters, searchTerm]);

  const WORLD_SIZE = 3000;

  const handleMouseDown = (e) => {
    if (draggingCharId) return;
    setIsDragging(true); dragDistanceRef.current = 0;
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (draggingCharId) {
      dragDistanceRef.current += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const blueprintEl = containerRef.current?.querySelector('.bg-grid');
        if (!blueprintEl) return;
        const rect = blueprintEl.getBoundingClientRect();
        const worldX = (e.clientX - rect.left) / transform.scale;
        const worldY = (e.clientY - rect.top) / transform.scale;
        onUpdatePosition(draggingCharId, Math.max(50, Math.min(WORLD_SIZE - 50, worldX)), Math.max(50, Math.min(WORLD_SIZE - 50, worldY)));
      });
      return;
    }
    if (!isDragging) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTransform(prev => ({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
    });
  };

  const handleMouseUp = () => { setIsDragging(false); setDraggingCharId(null); };

  const handleWheel = (e) => {
    e.preventDefault();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const delta = -e.deltaY * 0.002;
      setTransform(prev => ({ ...prev, scale: Math.min(Math.max(0.3, prev.scale + delta), 3) }));
    });
  };

  const findMyCharacter = () => {
    if (!myCharacterId) return;
    const myChar = characters.find(c => c.id === myCharacterId);
    if (myChar) setTransform({ scale: 1.5, x: (window.innerWidth / 2) - (myChar.x * 1.5), y: (window.innerHeight / 2) - (myChar.y * 1.5) });
  };

  return (
    <div className="win95-window w-full h-full flex flex-col shadow-[4px_4px_0_rgba(0,0,0,0.5)] bg-[#c0c0c0] text-black relative">
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5"><span>KSPO_DOME_VIEWER.exe</span></div>
        <div className="flex gap-0.5"><button className="win95-title-btn">_</button><button className="win95-title-btn">□</button><button className="win95-title-btn" onClick={onGoHome}>X</button></div>
      </div>

      <div className="bg-[#c0c0c0] p-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--win-border-dark)] z-50">
        <div className="flex items-center gap-1">
          <button onClick={onGoHome} className="win95-button">◀ 뒤로</button>
          <div className="flex items-center gap-1 ml-2"><span className="text-xs">찾기:</span><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="win95-input w-24 sm:w-32" /></div>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && <button onClick={() => onShowConfirm("초기화", "모든 캐릭터를 삭제하시겠습니까?", onResetWorld)} className="win95-button text-red-600 font-bold border border-red-800">월드 초기화</button>}
          {myCharacterId && <button onClick={findMyCharacter} className="win95-button font-bold text-[#000080]">내 캐릭터 찾기</button>}
          {myCharacterId && <button onClick={() => setIsRunGameOpen(true)} className="win95-button font-bold text-red-600 ml-1">🏃 RUN</button>}
          {myCharacterId && <button onClick={() => setIsRoofGameOpen(true)} className="win95-button font-bold text-blue-600">🚀 ROOF</button>}
          <div className="flex gap-1 ml-2 border-l border-[var(--win-border-dark)] pl-2">
            <button onClick={() => setTransform(p => ({...p, scale: Math.min(p.scale + 0.2, 3)}))} className="win95-button">+</button>
            <button onClick={() => setTransform(p => ({...p, scale: Math.max(p.scale - 0.2, 0.3)}))} className="win95-button">-</button>
          </div>
        </div>
      </div>

      <div className="win95-panel flex-1 relative overflow-hidden bg-[#e0e0e0] cursor-crosshair active:cursor-move" ref={containerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
        <div className="relative bg-grid origin-top-left" style={{ width: `${WORLD_SIZE}px`, height: `${WORLD_SIZE}px`, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, willChange: 'transform' }}>
          
          <div className="absolute top-[1500px] left-[1500px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
             <img src={sysStageImg} alt="stage" className="w-[800px] h-[800px] object-contain opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>

          {filteredChars.map((char) => {
            const isMine = char.id === myCharacterId;
            const canEdit = isMine || isAdmin;
            const isFever = feverStates[char.id] && Date.now() < feverStates[char.id];
            const isResting = char.restUntil && Date.now() < char.restUntil;
            
            return (
              <div 
                key={char.id} className={`absolute flex flex-col items-center group ${char.isUser ? 'z-40' : 'z-10'} ${canEdit ? 'cursor-move' : 'cursor-pointer'}`}
                style={{ left: char.x, top: char.y, transform: 'translate(-50%, -100%)' }}
                onMouseEnter={() => { if (!isDragging && !draggingCharId) setHoveredChar(char.id); }}
                onMouseLeave={() => { if (!isDragging) setHoveredChar(null); }}
                onMouseDown={(e) => { if (canEdit) { e.stopPropagation(); setDraggingCharId(char.id); dragDistanceRef.current = 0; } }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEdit && dragDistanceRef.current > 5) return; 
                  if (!isMine) return; // 내 캐릭터만 상호작용 가능
                  if (isResting) return; // 휴식 중이면 클릭 무시

                  const jumpAmount = isFever ? 5 : 1;

                  onAddJumps(char.id, jumpAmount, true);

                  if (!isFever) {
                    setClickCounts(prev => {
                      const now = Date.now();
                      const history = (prev[char.id] || []).filter(t => now - t < 2000);
                      history.push(now);
                      if (history.length >= 5) {
                        setFeverStates(fs => ({ ...fs, [char.id]: now + 5000 }));
                        setTimeout(() => { setFeverStates(fs => { const n = {...fs}; if(n[char.id]<=Date.now()) delete n[char.id]; return n; }); }, 5000);
                        return { ...prev, [char.id]: [] };
                      }
                      return { ...prev, [char.id]: history };
                    });
                  }
                }}
              >
                <div className="relative" id={`char-wrapper-${char.id}`}>
                  <div className={`${isResting ? '' : `jump-motion-${char.motionType || 0}`} flex items-end justify-center relative ${isFever && !isResting ? 'fever-glow' : ''}`} style={{ '--duration': `${isFever ? char.duration * 0.5 : char.duration}s`, '--delay': `${char.delay}s`, width: isMine ? '60px' : '40px', height: isMine ? '60px' : '40px', filter: isResting ? 'grayscale(100%) opacity(50%)' : 'none', transform: isResting ? 'translateY(0)' : undefined } as React.CSSProperties}>
                    <div className="relative inline-flex items-center justify-center pointer-events-none">
                      {char.imageUrl ? (
                        <img src={char.imageUrl} alt={char.name} style={{ maxHeight: isMine ? '60px' : '40px', maxWidth: isMine ? '60px' : '40px', imageRendering: 'pixelated' }} className="object-contain" />
                      ) : (
                        <span className={`${isMine ? 'text-4xl' : 'text-3xl'}`} style={{ textShadow: '1px 1px 0 #fff' }}>{char.emoji}</span>
                      )}
                      {char.hasItem && (
                        <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
                           <div className="relative w-full h-full">
                              <img src={sysFanImg} alt="fan" className="absolute -top-[15%] -right-[35%] w-[60%] h-[60%] object-contain rotate-12 origin-bottom-left" />
                           </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-2 bg-gray-400 rounded-[100%] mt-1 opacity-50 z-[-1] absolute left-1/2 -translate-x-1/2 bottom-[-10px]"></div>
                </div>

                <div className={`absolute top-full mt-3 win95-tooltip transition-opacity duration-100 ${hoveredChar === char.id || isMine ? 'opacity-100' : 'opacity-0 pointer-events-none'} z-50 flex flex-col items-start gap-1 text-left`}>
                  <div className="border-b border-gray-400 w-full pb-1 font-bold">
                    {char.name} {isMine && <span className="text-[#000080]">[나]</span>} {isAdmin && !isMine && <span className="text-red-600">[관리]</span>}
                  </div>
                  <div className={`text-[10px] font-bold ${isFever ? 'fever-text' : 'text-[#000080]'}`}>
                    {isResting ? '💤 숨고르기 중...' : isFever ? '🔥 FEVER TIME! (+5)' : getBadgeName(char.jumpsCount)}
                  </div>
                  <div className="text-[11px]">에바뛰 : {char.jumpsCount.toLocaleString()}회</div>
                  
                  {(char.runBest > 0 || char.roofBest > 0) && (
                    <div className="text-[9px] mt-1 text-gray-700 border-t border-gray-400 pt-1 w-full flex flex-col gap-0.5">
                      {char.runBest > 0 && <div className="flex justify-between"><span>RUN 최고:</span> <b>{char.runBest}개</b></div>}
                      {char.roofBest > 0 && <div className="flex justify-between"><span>ROOF 최고:</span> <b>{char.roofBest}M</b></div>}
                    </div>
                  )}

                  {isMine && (
                    <div className="flex gap-1 mt-1 w-full justify-start">
                      <button 
                        onClick={(e) => { e.stopPropagation(); document.getElementById(`char-wrapper-${char.id}`)?.click(); }} 
                        disabled={isResting}
                        className={`win95-button text-[10px] py-0 px-2 ${isResting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isResting ? '휴식중..' : isFever ? '+5 👆' : '+1 👆'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); const url = window.location.href; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`내 ${char.name}이(가) KSPO DOME 에바뛰 광장에서 ${char.jumpsCount.toLocaleString()}회째 뛰는 중! 🏃‍♂️💨 같이 뛰어주세요! ${url} #에바뛰 #EVERYBODY_JUMP`)}`, '_blank'); }} className="win95-button text-[10px] py-0 px-2 bg-black text-white">𝕏 Share</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-[#c0c0c0] px-2 py-0.5 border-t border-[var(--win-border-white)] flex justify-between text-[11px] text-gray-700">
        <span>현재 좌표: X={Math.round(-transform.x)}, Y={Math.round(-transform.y)}</span>
        <span>배율: {Math.round(transform.scale * 100)}%</span>
      </div>

      {myCharacterId && <MiniGameRun isOpen={isRunGameOpen} onClose={() => setIsRunGameOpen(false)} myCharacter={characters.find(c => c.id === myCharacterId)} onAddJumps={onAddJumps} onUpdateBestScore={onUpdateBestScore} />}
      {myCharacterId && <MiniGameRoofBreaker isOpen={isRoofGameOpen} onClose={() => setIsRoofGameOpen(false)} myCharacter={characters.find(c => c.id === myCharacterId)} onAddJumps={onAddJumps} onUpdateBestScore={onUpdateBestScore} />}
    </div>
  );
}
