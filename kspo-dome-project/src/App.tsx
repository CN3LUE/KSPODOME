import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, onAuthStateChanged, setPersistence, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, getFirestore, limit, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';

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
    background-color: #808080;
    color: var(--win-text);
    overflow: hidden;
    font-family: 'DungGeunMo', 'MS Sans Serif', Tahoma, sans-serif;
    -webkit-font-smoothing: none; 
  }

  /* 메뉴 접기 버튼은 터치형 모바일 기기에서만 사용한다. */
  @media (hover: hover) and (pointer: fine) {
    .mobile-map-menu-toggle {
      display: none !important;
    }
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
const MAX_SHARED_CHARACTERS = 500;

const DEFAULT_STAGE_IMG = encodeURI("image_057089.jpg");
const DEFAULT_FAN_IMG = encodeURI("image_05708b.png");
// 바나나 이미지를 코드에 직접 포함해 별도 public 파일이나 배포 경로에 의존하지 않습니다.
const BANANA_PEEL_IMG = "data:image/webp;base64,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";

// public/audio 폴더에 같은 파일명으로 음악을 넣어 주세요.
// 모든 사용자는 아래 공통 기준 시각으로 재생 위치를 계산해 같은 곡의 같은 부분을 듣습니다.
const BGM_TRACKS = [
  { title: 'TRACK 01', src: `${import.meta.env.BASE_URL}audio/track-01.mp3` },
  { title: 'TRACK 02', src: `${import.meta.env.BASE_URL}audio/track-02.mp3` },
  { title: 'TRACK 03', src: `${import.meta.env.BASE_URL}audio/track-03.mp3` }
];
const BGM_SYNC_EPOCH_MS = Date.UTC(2026, 8, 18, 0, 0, 0);

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

const firebaseApp = getApps().find(app => app.name === '[DEFAULT]') || initializeApp(firebaseConfig);
const firebaseAdminApp = getApps().find(app => app.name === 'kspo-admin-session') || initializeApp(firebaseConfig, 'kspo-admin-session');
const firebaseAuth = getAuth(firebaseApp);
const firebaseDb = getFirestore(firebaseApp);
const firebaseAdminAuth = getAuth(firebaseAdminApp);
const firebaseAdminDb = getFirestore(firebaseAdminApp);
const IS_ADMIN_PAGE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1';

const hasAdminAccess = async (user, db = firebaseAdminDb) => {
  if (!user || !IS_ADMIN_PAGE) return false;
  const adminSnapshot = await getDoc(doc(db, 'admins', user.uid));
  return adminSnapshot.exists() && adminSnapshot.data()?.active === true;
};

const sliceEmojiString = (str, limit) => {
  const chars = [...new Intl.Segmenter().segment(str)].map(x => x.segment);
  return chars.slice(0, limit).join('');
};

const canvasToBlob = (canvas, type, quality): Promise<Blob> => new Promise((resolve, reject) => {
  canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('이미지 변환 실패')), type, quality);
});

const blobToDataUrl = (blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('이미지 변환 실패'));
  reader.readAsDataURL(blob);
});

const MAP_CELL_SIZE = 600;
const MAP_CELL_COUNT = 5;
const getCellId = (x, y) => `${Math.max(0, Math.min(MAP_CELL_COUNT - 1, Math.floor(x / MAP_CELL_SIZE)))}_${Math.max(0, Math.min(MAP_CELL_COUNT - 1, Math.floor(y / MAP_CELL_SIZE)))}`;

// 사용자가 고른 원본을 128px 이하 WebP로 바꾸고 50KB 안쪽으로 자동 압축합니다.
const compressCharacterImage = async (file) => {
  if (!file?.type?.startsWith('image/')) throw new Error('이미지 파일만 선택할 수 있습니다.');

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('사진을 불러오지 못했습니다.'));
      img.src = sourceUrl;
    });

    const targetBytes = 50 * 1024;
    const sizes = [128, 112, 96, 80, 64];
    const qualities = [0.92, 0.84, 0.76, 0.68, 0.60, 0.52, 0.44, 0.36];
    let smallestBlob: Blob | null = null;

    for (const maxSize of sizes) {
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('이미지 압축을 지원하지 않는 브라우저입니다.');
      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, 'image/webp', quality);
        if (!smallestBlob || blob.size < smallestBlob.size) smallestBlob = blob;
        if (blob.size <= targetBytes) return blob;
      }
    }

    if (smallestBlob?.size <= targetBytes) return smallestBlob;
    throw new Error('사진을 50KB 이하로 줄이지 못했습니다. 다른 사진을 선택해 주세요.');
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

const getBadgeName = (jumps) => {
  if (jumps >= 50000) return "☁️ 공중부양자";
  if (jumps >= 10000) return "🤸에바뛰고수";
  if (jumps >= 5000) return "🏃‍➡️에바뛰중수 ";
  if (jumps >= 1000) return "🚶에바뛰초보";
  return "🌱 비기너";
};

const generatePresets = (count) => {
  const names = ['에바뛰', '월요일', '직장인', '락덕', '씨엔블루', '학생', '안녕하세요', '러너'];
  const emojis = ['🐹', '👦', '🖤', '👿', '💻', '🎸', '🥁', '🎨', '🔥', '👻', '😎', '😜', '😍', '🎉', '🌟'];

  // 같은 순번으로 X/Y를 계산하면 대각선 띠가 생기므로, 월드를 작은 구역으로
  // 나눈 뒤 각 구역 안에서 서로 다른 고정 난수로 위치를 흩뿌립니다.
  const columns = 15;
  const rows = Math.ceil(count / columns);
  const seededUnit = (seed) => {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
  
  return Array.from({ length: count }).map((_, i) => {
    const scatteredIndex = (i * 73) % count;
    const column = scatteredIndex % columns;
    const row = Math.floor(scatteredIndex / columns);
    const cellWidth = 2860 / columns;
    const cellHeight = 2860 / rows;
    const tierSlot = i % 10;
    const jumpSeed = seededUnit(i * 109 + 67);
    const presetJumps = tierSlot < 3
      ? 30 + Math.floor(jumpSeed * 970)          // 30%: 비기너 (30~999회)
      : tierSlot < 6
        ? 1000 + Math.floor(jumpSeed * 4000)     // 30%: 초보 (1,000~4,999회)
        : tierSlot < 9
          ? 5000 + Math.floor(jumpSeed * 5000)   // 30%: 중수 (5,000~9,999회)
          : 10000 + Math.floor(jumpSeed * 30000); // 10%: 고수 (10,000~39,999회)

    return {
      id: 'preset-' + i,
      name: names[Math.floor(seededUnit(i * 83 + 19) * names.length)] + '_' + i.toString().padStart(3, '0'),
      emoji: emojis[Math.floor(seededUnit(i * 97 + 43) * emojis.length)],
      imageUrl: null,
      hasItem: i % 2 === 0,
      x: 70 + (column + 0.15 + seededUnit(i * 2 + 1) * 0.7) * cellWidth,
      y: 70 + (row + 0.15 + seededUnit(i * 2 + 2) * 0.7) * cellHeight,
      delay: -((i % 20) / 10),
      duration: 1.0 + ((i % 5) / 10),
      motionType: i % 2,
      jumpsCount: presetJumps,
      isUser: false,
      runBest: (i * 17) % 80,
      roofBest: (i * 29) % 400
    };
  });
};

const PRESET_CHARACTERS = generatePresets(150);

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
  const [gameState, setGameState] = useState('READY'); // READY, PLAYING, GAMEOVER
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [reward, setReward] = useState(0);

  const frameRef = useRef(0);
  const stateRef = useRef('READY');
  const playerImgRef = useRef(null);
  const bananaImgRef = useRef(null);
  
  // 외부 렌더링에 의한 게임 끊김(Stuttering)을 방지하기 위해 최신 props를 ref에 저장
  const propsRef = useRef({ myCharacter, onAddJumps, onUpdateBestScore });
  useEffect(() => { propsRef.current = { myCharacter, onAddJumps, onUpdateBestScore }; }, [myCharacter, onAddJumps, onUpdateBestScore]);

  const OBSTACLES_PER_REWARD = 10;
  const REWARD_PER_GROUP = 5;
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

  useEffect(() => {
    const img = new Image();
    img.src = BANANA_PEEL_IMG;
    img.onload = () => { bananaImgRef.current = img; };
    img.onerror = () => { bananaImgRef.current = null; };
  }, []);

  const start = useCallback(() => {
    stateRef.current = 'PLAYING';
    setScore(0);
    setFinalScore(0);
    setReward(0);
    setGameState('PLAYING');
  }, []);

  // 창을 다시 열 때 이전 게임 루프나 종료 화면이 남지 않도록 항상 새 게임으로 초기화합니다.
  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    if (isOpen) {
      stateRef.current = 'READY';
      setGameState('READY');
      setScore(0);
      setFinalScore(0);
      setReward(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const startKey = (e) => {
      if (isOpen && ['Space', 'ArrowUp', 'KeyW'].includes(e.code) && stateRef.current !== 'PLAYING') { 
        e.preventDefault(); 
        start(); 
      }
    };
    window.addEventListener('keydown', startKey);
    return () => window.removeEventListener('keydown', startKey);
  }, [start, isOpen]);

  useEffect(() => {
    if (!isOpen || gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const player = { y: GROUND_Y - PLAYER_SIZE, vy: 0, jumps: 0, shield: 0, invincible: 0 };
    const obstacles = [];
    const pits = [];
    const items = [];
    let frame = 0, clearedObstacles = 0, bonusJumps = 0, speed = 7, lastSpawn = 0, fellIntoPit = false;
    let lastItemSpawn = 0, nextItemDelay = 360 + Math.random() * 180, done = false;

    const jump = () => {
      if (fellIntoPit) return;
      if (player.jumps < 2) { player.vy = player.jumps === 0 ? -15.5 : -13; player.jumps += 1; }
    };
    
    const playKey = (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', playKey);

    const finish = () => {
      if (done) return;
      done = true;
      stateRef.current = 'GAMEOVER';
      setGameState(stateRef.current);
      const obstacleReward = Math.floor(clearedObstacles / OBSTACLES_PER_REWARD) * REWARD_PER_GROUP;
      const earned = obstacleReward;
      setFinalScore(clearedObstacles);
      setReward(obstacleReward + bonusJumps);
      
      const { myCharacter: char, onAddJumps: add, onUpdateBestScore: updateBest } = propsRef.current;
      if (earned > 0 && char) add(char.id, earned);
      if (char) updateBest(char.id, 'run', clearedObstacles);
    };

    const drawAvatar = (ctx, x, y, size) => {
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.shadowBlur = 0;
      if (playerImgRef.current) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(playerImgRef.current, x, y, size, size);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(propsRef.current.myCharacter?.emoji || '😎', x + size / 2, y + size / 2);
      }
      ctx.restore();
    };

    const FIXED_FRAME_MS = 1000 / 60;
    let lastFrameTime = performance.now();
    let frameAccumulator = 0;
    const abyssGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    abyssGradient.addColorStop(0, "#050006");
    abyssGradient.addColorStop(1, "#6b0039");
    const stageThemes = [
      { name: 'NIGHT RUNNER', top: '#090f2e', bottom: '#31174b', ground: '#514579', line: '#5de4ff', glow: '#ff62c0' },
      { name: 'SUNSET RUSH', top: '#431642', bottom: '#e05b57', ground: '#493052', line: '#ffd45f', glow: '#ff8b72' },
      { name: 'ICE ROAD', top: '#08233d', bottom: '#287ca0', ground: '#526f93', line: '#d8fbff', glow: '#75e8ff' },
      { name: 'DANGER ZONE', top: '#260617', bottom: '#7b123f', ground: '#41213d', line: '#ff62c0', glow: '#ff334f' }
    ];
    const stageGradients = stageThemes.map(theme => {
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, theme.top); gradient.addColorStop(1, theme.bottom);
      return gradient;
    });

    const loop = (timestamp = performance.now()) => {
      // 느린 모바일에서 밀린 6프레임을 한꺼번에 처리하던 현상을 막아 화면 튐을 줄입니다.
      frameAccumulator += Math.min(50, Math.max(0, timestamp - lastFrameTime)) / FIXED_FRAME_MS;
      lastFrameTime = timestamp;
      let simulationSteps = 0;

      // 모바일 60FPS의 물리 감각을 기준으로 모든 기기에서 같은 속도로 계산합니다.
      while (frameAccumulator >= 1 && simulationSteps < 3) {
      frameAccumulator -= 1;
      simulationSteps += 1;
      frame += 1;
      // 끝이 없는 게임이므로 250개 기준 대신 지수 곡선으로 난도가 계속 상승합니다.
      // 초반에는 부드럽고, 기록이 높아질수록 최고 난도에 점진적으로 가까워집니다.
      const difficulty = 1 - Math.exp(-clearedObstacles / 140);
      // 초반은 익숙한 속도로 시작하고 중후반부터 최대 약 2.35배까지 확실히 빨라집니다.
      speed = 7 + 11 * Math.pow(difficulty, 0.72);
      for (let i = pits.length - 1; i >= 0; i -= 1) {
        const pit = pits[i];
        pit.x -= speed;
        if (pit.x + pit.w < 0) {
          pits.splice(i, 1);
          clearedObstacles += 1;
          setScore(clearedObstacles);
        }
      }
      player.vy += 0.78;
      player.y += player.vy;
      const overPit = pits.some(pit => overlap(66, 98, pit.x + 3, pit.x + pit.w - 3));
      if (!fellIntoPit && overPit && player.vy >= 0 && player.y + PLAYER_SIZE >= GROUND_Y - 2) fellIntoPit = true;
      if (player.y >= GROUND_Y - PLAYER_SIZE && !overPit && !fellIntoPit) { player.y = GROUND_Y - PLAYER_SIZE; player.vy = 0; player.jumps = 0; }
      if (player.y > GAME_HEIGHT + 30) { finish(); return; }
      player.shield = Math.max(0, player.shield - 1);
      player.invincible = Math.max(0, player.invincible - 1);

      const itemNearSpawnLane = items.some(item => item.x > GAME_WIDTH - 210);
      // 기록이 늘수록 간격을 더 크게 줄여 화면에 동시에 보이는 장애물 수도 증가합니다.
      const spawnInterval = Math.max(30, 92 - difficulty * 62);
      if (!itemNearSpawnLane && frame - lastSpawn > spawnInterval) {
        lastSpawn = frame;
        const spawnPit = clearedObstacles >= 4 && Math.random() < (.13 + difficulty * .11);
        if (spawnPit) {
          const pitWidth = 92 + Math.random() * 48;
          pits.push({ x: GAME_WIDTH + 30, w: pitWidth });
        } else {
          const availableTypes = ["barrier", "sign", "banana", "bomb"];
          if (difficulty > .10) availableTypes.push("drone");
          if (difficulty > .22) availableTypes.push("laser");
          if (difficulty > .36) availableTypes.push("waterBalloon");
          if (difficulty > .58) availableTypes.push("laser", "bomb", "waterBalloon");
          const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          const dimensions = {
            laser: { w: 58, h: 20 }, drone: { w: 34, h: 76 }, barrier: { w: 42, h: 38 }, sign: { w: 27, h: 62 },
            banana: { w: 34, h: 21 }, bomb: { w: 38, h: 38 }, waterBalloon: { w: 34, h: 42 }
          }[type];
          // 광선은 생성될 때마다 높이가 달라집니다.
          // 낮음/중간 광선은 점프로 피하고, 높은 광선은 가만히 아래로 통과할 수 있습니다.
          const laserY = type === "laser"
            ? [GROUND_Y - 26, GROUND_Y - 58, GROUND_Y - 95][Math.floor(Math.random() * 3)]
            : null;
          obstacles.push({ x: GAME_WIDTH + 20, ...dimensions, type, y: laserY });
        }
      }

      const hazardNearItemLane = obstacles.some(o => o.x + o.w > GAME_WIDTH - 210)
        || pits.some(pit => pit.x + pit.w > GAME_WIDTH - 210);
      if (frame - lastItemSpawn >= nextItemDelay && !hazardNearItemLane) {
        lastItemSpawn = frame;
        nextItemDelay = 360 + Math.random() * 180;
        items.push({
          x: GAME_WIDTH + 35,
          y: GROUND_Y - (72 + Math.random() * 55),
          kind: Math.random() < .22 ? "shield" : "star"
        });
      }

      for (let i = obstacles.length - 1; i >= 0; i -= 1) {
        const o = obstacles[i];
        o.x -= speed;
        const y = o.type === "laser" ? o.y
          : o.type === "drone" ? 165 + Math.sin((frame + o.x) / 13) * 14
          : o.type === "waterBalloon" ? 196 + Math.sin((frame + o.x) / 16) * 32
          : o.type === "bomb" ? GROUND_Y - o.h + Math.sin(frame / 5) * 2
          : GROUND_Y - o.h;
        if (o.x + o.w < 0) { obstacles.splice(i, 1); clearedObstacles += 1; setScore(clearedObstacles); continue; }
        const collisionTop = o.type === "drone" ? y + 11 : o.type === "banana" ? y + 8 : y + 4;
        const collisionBottom = o.type === "drone" ? y + 28 : o.type === "banana" ? y + o.h : y + o.h - 2;
        const collision = overlap(67, 97, o.x + 4, o.x + o.w - 4)
          && overlap(player.y + 7, player.y + PLAYER_SIZE - 5, collisionTop, collisionBottom);
        if (collision && player.invincible === 0) {
          if (player.shield > 0) { player.shield = 0; player.invincible = 45; obstacles.splice(i, 1); }
          else { finish(); return; }
        }
      }

      for (let i = items.length - 1; i >= 0; i -= 1) {
        const item = items[i]; item.x -= speed;
        if (item.x < 0) { items.splice(i, 1); continue; }
        if (overlap(58, 106, item.x - 12, item.x + 12) && overlap(player.y, player.y + PLAYER_SIZE, item.y - 12, item.y + 12)) {
          if (item.kind === "shield") player.shield = 520;
          else {
            bonusJumps += 1;
            setReward(bonusJumps);
            const { myCharacter: char, onAddJumps: add } = propsRef.current;
            if (char) add(char.id, 1);
          }
          items.splice(i, 1);
        }
      }
      }
      if (simulationSteps >= 3) frameAccumulator = 0;

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.shadowBlur = 0;
      const stageNumber = Math.floor(clearedObstacles / 35);
      const theme = stageThemes[stageNumber % stageThemes.length];
      ctx.fillStyle = stageGradients[stageNumber % stageGradients.length]; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      // 구간마다 다른 색의 도시/산 실루엣이 흘러가 배경 전환이 확실히 느껴집니다.
      ctx.save();
      ctx.globalAlpha = .18;
      ctx.fillStyle = theme.glow;
      for (let i = 0; i < 9; i += 1) {
        const bx = ((i * 104 - frame * speed * .07) % (GAME_WIDTH + 120)) - 40;
        const bh = 28 + ((i * 23 + stageNumber * 17) % 70);
        ctx.fillRect(bx, GROUND_Y - bh, 48 + (i % 3) * 14, bh);
      }
      ctx.restore();
      for (let i = 0; i < 12; i += 1) { 
        ctx.globalAlpha = .28; ctx.fillStyle = i % 3 ? "#5de4ff" : "#ff62c0"; 
        ctx.fillRect((i * 89 - frame * speed * .18) % (GAME_WIDTH + 80), 65 + (i % 5) * 27, 2, 2); 
      }
      ctx.globalAlpha = 1; ctx.fillStyle = theme.ground; ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
      ctx.strokeStyle = theme.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(GAME_WIDTH, GROUND_Y); ctx.stroke();
      pits.forEach((pit) => {
        ctx.save();
        ctx.fillStyle = abyssGradient; ctx.fillRect(pit.x, GROUND_Y - 2, pit.w, GAME_HEIGHT - GROUND_Y + 2);
        ctx.shadowColor = "#ff2f8b"; ctx.shadowBlur = 12;
        ctx.strokeStyle = "#ff77bd"; ctx.lineWidth = 5; ctx.beginPath();
        ctx.moveTo(pit.x, GROUND_Y); ctx.lineTo(pit.x, GAME_HEIGHT);
        ctx.moveTo(pit.x + pit.w, GROUND_Y); ctx.lineTo(pit.x + pit.w, GAME_HEIGHT); ctx.stroke();
        ctx.restore();
      });
      
      items.forEach((item) => { 
        ctx.save();
        ctx.globalAlpha = 1; ctx.filter = "none"; ctx.shadowColor = "rgba(0,0,0,0)"; ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "26px \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(item.kind === "shield" ? "🛡️" : "⭐", item.x, item.y); 
        ctx.restore();
      });
      
      obstacles.forEach((o) => {
        const y = o.type === "laser" ? o.y
          : o.type === "drone" ? 165 + Math.sin((frame + o.x) / 13) * 14
          : o.type === "waterBalloon" ? 196 + Math.sin((frame + o.x) / 16) * 32
          : o.type === "bomb" ? GROUND_Y - o.h + Math.sin(frame / 5) * 2
          : GROUND_Y - o.h;
        if (o.type === "barrier") { ctx.fillStyle = "#ff5a61"; ctx.fillRect(o.x, y, o.w, o.h); ctx.fillStyle = "#ffd45f"; ctx.fillRect(o.x + 5, y + 12, o.w - 10, 8); }
        if (o.type === "sign") { ctx.fillStyle = "#55e2ff"; ctx.fillRect(o.x + 10, y, 7, o.h); ctx.fillStyle = "#fff"; ctx.fillRect(o.x, y, o.w, 23); }
        if (o.type === "drone") { ctx.fillStyle = "#ff62c0"; ctx.fillRect(o.x, y + 11, o.w, 17); ctx.fillStyle = "#b6f6ff"; ctx.fillRect(o.x + 8, y + 15, o.w - 16, 5); }
        if (o.type === "laser") {
          ctx.save();
          ctx.fillStyle = "#3b174e"; ctx.fillRect(o.x, y, 8, o.h); ctx.fillRect(o.x + o.w - 8, y, 8, o.h);
          ctx.shadowColor = "#ff2f8b"; ctx.shadowBlur = 10;
          ctx.fillStyle = "#ff2f8b"; ctx.fillRect(o.x + 8, y + 8, o.w - 16, 4);
          ctx.restore();
        }
        if (o.type === "banana") {
          ctx.save();
          if (bananaImgRef.current) {
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(bananaImgRef.current, o.x - 4, y - 5, o.w + 8, o.h + 7);
          } else {
            ctx.font = "28px \"Apple Color Emoji\", \"Segoe UI Emoji\", sans-serif";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText("🍌", o.x + o.w / 2, y + o.h / 2);
          }
          ctx.restore();
        }
        if (o.type === "bomb") {
          ctx.save(); ctx.translate(o.x + 19, y + 20); ctx.rotate(frame * .08);
          ctx.fillStyle = "#17131e"; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#8d78a8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(9, -13); ctx.quadraticCurveTo(18, -24, 21, -15); ctx.stroke();
          ctx.fillStyle = frame % 12 < 6 ? "#ffd45f" : "#ff5a61"; ctx.fillRect(19, -19, 5, 5); ctx.restore();
        }
        if (o.type === "waterBalloon") {
          ctx.save(); ctx.fillStyle = "#66d9ff"; ctx.strokeStyle = "#d7f8ff"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(o.x + 17, y + 18, 15, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#b9f3ff"; ctx.fillRect(o.x + 10, y + 9, 6, 5);
          ctx.fillStyle = "#2b91c4"; ctx.beginPath(); ctx.moveTo(o.x + 14, y + 36); ctx.lineTo(o.x + 20, y + 36); ctx.lineTo(o.x + 17, y + 42); ctx.fill(); ctx.restore();
        }
      });
      
      if (player.shield) { ctx.strokeStyle = "#9bfbff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(82, player.y + 24, 34, 0, Math.PI * 2); ctx.stroke(); }
      drawAvatar(ctx, 58, player.y, PLAYER_SIZE);
      
      ctx.fillStyle = "#0c0c23"; ctx.fillRect(18, 15, 220, 44); ctx.strokeStyle = "#5de4ff"; ctx.strokeRect(18, 15, 220, 44);
      ctx.fillStyle = "#fff"; ctx.font = "bold 18px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(`RUN  ${String(clearedObstacles).padStart(3, "0")} / ∞`, 30, 43);
      ctx.fillStyle = theme.line; ctx.font = "bold 11px monospace"; ctx.textAlign = "right";
      ctx.fillText(`ZONE ${stageNumber + 1} · ${theme.name}`, GAME_WIDTH - 18, 30);
      if (bonusJumps > 0) { ctx.fillStyle = "#ffd45f"; ctx.font = "bold 13px monospace"; ctx.fillText(`ITEM +${bonusJumps} JUMP`, 30, 57); }
      
      frameRef.current = requestAnimationFrame(loop);
    };
    
    frameRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('keydown', playKey); };
  }, [gameState, isOpen]);

  useEffect(() => {
     if (gameState === 'READY' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#090f2e'; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "#514579"; ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
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
  }, [gameState, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex flex-col items-center justify-center p-4">
      <div className="win95-window w-full max-w-[720px] shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
        <div className="win95-titlebar">
          <div className="flex items-center gap-1.5"><span>🏃 무한_달리기.exe</span></div>
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
                <p className="font-bold text-white mt-2">목표: 부딪힐 때까지 무한 달리기!</p>
                <p className="text-sm text-[#5de4ff] mt-1">장애물 {OBSTACLES_PER_REWARD}개당 {REWARD_PER_GROUP} 에바뛰 획득</p>
                <p className="text-xs text-[#ffd45f] mt-1">⭐ 별 획득 시 즉시 +1 에바뛰</p>
                <p className="text-sm mt-4 animate-pulse bg-[#e9ecff] text-[#09091b] font-bold px-4 py-2 border-2 border-white shadow-[3px_3px_#454363]">화면 탭 / 스페이스바로 시작</p>
              </div>
            )}
            {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white">
                <h2 className="text-3xl font-bold mb-2 text-[#ff5a61]" style={{ textShadow: "0 0 14px #ff5a61" }}>GAME OVER</h2>
                <div className="mb-4 text-sm flex flex-col items-center gap-1 font-bold">
                   <p className="text-white text-lg">+{reward.toLocaleString()} 에바뛰 획득</p>
                   <p className="text-[#ff62c0]">통과한 장애물: {finalScore}개</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={start} className="win95-button !bg-[#e9ecff] !border-white !text-[#09091b] !shadow-[3px_3px_#454363] py-2 px-4 font-bold">TRY AGAIN</button>
                   <button onClick={onClose} className="win95-button py-2 px-4">종료</button>
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

  const DIFFICULTY_ALTITUDE = 1500;
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
    const player = { x: 189, y: GAME_HEIGHT - 125, vx: 0, vy: -13.1 };

    // 모든 고도에서 같은 공식으로 계산해 초반/중반 발판 크기가 역전되지 않게 한다.
    const getPlatformWidth = (altitude) => {
      const difficulty = Math.min(1, Math.max(0, altitude) / DIFFICULTY_ALTITUDE);
      return 145 - (145 - 50) * Math.pow(difficulty, 1.05);
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
      const estimatedAltitude = heightFromStart / PIXELS_PER_METER;
      const difficulty = Math.min(1, estimatedAltitude / DIFFICULTY_ALTITUDE);
      
      // 발판 간격
      const minGap = 52 + difficulty * 20;
      const randomGap = Math.random() * (8 + difficulty * 15);
      const gap = minGap + randomGap;

      lastY = highestY - gap;
      const nextAltitude = Math.max(0, ((GAME_HEIGHT - 20) - lastY) / PIXELS_PER_METER);
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
    
    const finish = () => { 
      if (done) return; 
      done = true; 
      stateRef.current = 'GAMEOVER'; 
      setGameState(stateRef.current); 
      const earned = Math.floor(best / 100);
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

    };

    const FIXED_FRAME_MS = 1000 / 60;
    let lastFrameTime = performance.now();
    let frameAccumulator = 0;

    const loop = (timestamp = performance.now()) => {
      frameAccumulator += Math.min(100, Math.max(0, timestamp - lastFrameTime)) / FIXED_FRAME_MS;
      lastFrameTime = timestamp;
      let simulationSteps = 0;

      // 모바일 60FPS의 물리 감각을 기준으로 모든 기기에서 같은 속도로 계산합니다.
      while (frameAccumulator >= 1 && simulationSteps < 6) {
      frameAccumulator -= 1;
      simulationSteps += 1;
      frame += 1;
      player.vx += keys.left ? -.72 : keys.right ? .72 : -player.vx * .16;
      player.vx = Math.max(-6.4, Math.min(6.4, player.vx)); player.x += player.vx;
      if (player.x < -PLAYER_SIZE) player.x = GAME_WIDTH; if (player.x > GAME_WIDTH) player.x = -PLAYER_SIZE;
      
      player.vy += .60; const oldBottom = player.y + PLAYER_SIZE; player.y += player.vy;
      
      platforms.forEach((p) => { 
        if (p.type === "moving") { 
          const moveSpeed = 1.1 + Math.min(1, Math.max(0, (GAME_HEIGHT - p.y) / PIXELS_PER_METER) / DIFFICULTY_ALTITUDE) * 1.5;
          p.x += p.dir * moveSpeed; 
          if (p.x < 0 || p.x + p.w > GAME_WIDTH) p.dir *= -1; 
        } 
      });
      
      if (player.vy > 0) {
        for (const p of platforms) {
          const landing = !p.used && oldBottom <= p.y + 12 && player.y + PLAYER_SIZE >= p.y && player.x + PLAYER_SIZE - 8 > p.x && player.x + 8 < p.x + p.w;
          if (landing) { player.vy = p.type === "boost" ? -16.5 : -13.2; if (p.type === "fragile") p.used = true; break; }
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
      if (player.y > camera + GAME_HEIGHT + 60) { finish(); return; }
      }
      if (simulationSteps >= 6) frameAccumulator = 0;

      drawBackground(ctx, best);
      
      platforms.forEach((p) => {
        const y = p.y - camera; if (y < -20 || y > GAME_HEIGHT + 20 || p.used) return;
        const color = p.type === "moving" ? "#ff62c0" : p.type === "boost" ? "#ffd45f" : p.type === "fragile" ? "#a982f2" : "#5de4ff";
        ctx.fillStyle = color; ctx.fillRect(p.x, y, p.w, 11); ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.fillRect(p.x + 3, y + 2, p.w - 6, 2);
      });
      
      drawAvatar(ctx, player.x, player.y - camera, PLAYER_SIZE);
      
      ctx.fillStyle = "rgba(6,8,28,.85)"; ctx.fillRect(12, 14, 215, 44); ctx.strokeStyle = "#5de4ff"; ctx.strokeRect(12, 14, 215, 44);
      ctx.fillStyle = "#fff"; ctx.font = "bold 18px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(`ALT ${String(best).padStart(4, "0")}M / ∞`, 24, 43);
      
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
          <div className="flex items-center gap-1.5"><span>☁️ 천국의_계단.exe</span></div>
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
                <p className="font-bold text-white mt-2">목표: 끝없이 올라가는 무한 모드</p>
                <p className="text-xs text-[#5de4ff] mt-1">1000m · 2000m · 3000m 그 이상까지!</p>
                <p className="text-sm text-[#ffd45f] mt-1">100m마다 1 에바뛰 획득</p>
                <p className="text-sm mt-4 animate-pulse bg-[#e9ecff] text-[#09091b] font-bold px-4 py-2 border-2 border-white shadow-[3px_3px_#454363]">화면 좌/우 터치로 이동</p>
              </div>
            )}
            {gameState === 'GAMEOVER' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white">
                <h2 className="text-3xl font-bold mb-2 text-[#ff5a61]" style={{ textShadow: "0 0 14px #ff5a61" }}>GAME OVER</h2>
                <div className="mb-4 text-sm flex flex-col items-center gap-1 font-bold">
                   <p className="text-white text-lg">+{reward} 에바뛰 획득</p>
                   <p className="text-[#5de4ff]">최종 기록: {finalScore}M</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={start} className="win95-button !bg-[#e9ecff] !border-white !text-[#09091b] !shadow-[3px_3px_#454363] py-2 px-4 font-bold">TRY AGAIN</button>
                   <button onClick={onClose} className="win95-button py-2 px-4">종료</button>
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
  const [chatMessages, setChatMessages] = useState({});
  const [myCharacterId, setMyCharacterId] = useState(null);
  const [viewportCell, setViewportCell] = useState({ x: 2, y: 2 });
  const [currentCapacity, setCurrentCapacity] = useState(INITIAL_FILL);
  const [sharedCharacterCount, setSharedCharacterCount] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [isMobileMapMenuOpen, setIsMobileMapMenuOpen] = useState(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.45);
  const [bgmDurations, setBgmDurations] = useState([]);
  const [bgmLoadState, setBgmLoadState] = useState('loading');
  const [bgmTrackTitle, setBgmTrackTitle] = useState('BGM 준비 중');
  const bgmAudioRef = useRef(null);

  const [sysStageImg, setSysStageImg] = useState(DEFAULT_STAGE_IMG);
  const [sysFanImg, setSysFanImg] = useState(DEFAULT_FAN_IMG);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, showCancel: false });
  const positionSaveTimersRef = useRef(new Map());
  const positionOverridesRef = useRef(new Map());
  const presetPositionsRef = useRef({});
  const progressMigrationRef = useRef(new Set());
  const worldCharactersRef = useRef([]);
  const chatOwnerKey = useMemo(() => {
    const ownerUids = worldCharacters
      .filter(character => character.isUser && character.ownerUid)
      .map(character => character.ownerUid);
    const currentUid = firebaseAuth.currentUser?.uid;
    if (myCharacterId && currentUid) ownerUids.push(currentUid);
    return Array.from(new Set(ownerUids)).sort().slice(0, 40).join('|');
  }, [worldCharacters, myCharacterId, authReady]);

  const showModal = useCallback((title, message, onConfirm, showCancel = true) => {
    setModalConfig({ isOpen: true, title, message, onConfirm: () => { onConfirm?.(); setModalConfig(prev => ({...prev, isOpen: false})); }, showCancel, onCancel: () => setModalConfig(prev => ({...prev, isOpen: false})) });
  }, []);

  // 재생목록의 길이를 먼저 읽어 공통 시간대의 곡과 재생 위치를 계산합니다.
  useEffect(() => {
    let cancelled = false;
    const metadataAudios = [];
    Promise.all(BGM_TRACKS.map(track => new Promise((resolve, reject) => {
      const audio = new Audio();
      metadataAudios.push(audio);
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => Number.isFinite(audio.duration) && audio.duration > 0 ? resolve(audio.duration) : reject(new Error('잘못된 음악 길이'));
      audio.onerror = () => reject(new Error(`${track.title} 파일을 불러오지 못했습니다.`));
      audio.src = track.src;
    }))).then((durations: number[]) => {
      if (cancelled) return;
      setBgmDurations(durations);
      setBgmLoadState('ready');
      setBgmTrackTitle('노래 듣기 준비 완료');
    }).catch(error => {
      console.error('BGM metadata load failed:', error);
      if (!cancelled) {
        setBgmLoadState('error');
        setBgmTrackTitle('음악 파일을 확인해 주세요');
      }
    });
    return () => {
      cancelled = true;
      metadataAudios.forEach(audio => { audio.src = ''; });
    };
  }, []);

  const syncBgmPlayback = useCallback((shouldPlay = isBgmPlaying) => {
    const audio = bgmAudioRef.current;
    if (!audio || bgmDurations.length !== BGM_TRACKS.length) return;
    const totalDuration = bgmDurations.reduce((sum, duration) => sum + duration, 0);
    if (!(totalDuration > 0)) return;

    let playlistPosition = ((Date.now() - BGM_SYNC_EPOCH_MS) / 1000) % totalDuration;
    if (playlistPosition < 0) playlistPosition += totalDuration;
    let trackIndex = 0;
    while (trackIndex < bgmDurations.length - 1 && playlistPosition >= bgmDurations[trackIndex]) {
      playlistPosition -= bgmDurations[trackIndex];
      trackIndex += 1;
    }

    const applySyncedPosition = () => {
      const safePosition = Math.min(playlistPosition, Math.max(0, bgmDurations[trackIndex] - 0.1));
      if (Math.abs((audio.currentTime || 0) - safePosition) > 1.5) audio.currentTime = safePosition;
      audio.volume = bgmVolume;
      if (shouldPlay) {
        audio.play().catch(error => {
          console.error('BGM playback failed:', error);
          setIsBgmPlaying(false);
          setBgmTrackTitle('🎧 버튼을 다시 눌러 주세요');
        });
      }
    };

    setBgmTrackTitle(BGM_TRACKS[trackIndex].title);
    if (audio.dataset.trackIndex !== String(trackIndex)) {
      audio.dataset.trackIndex = String(trackIndex);
      audio.src = BGM_TRACKS[trackIndex].src;
      audio.load();
      audio.addEventListener('loadedmetadata', applySyncedPosition, { once: true });
      if (shouldPlay) audio.play().catch(() => {});
    } else {
      applySyncedPosition();
    }
  }, [bgmDurations, bgmVolume, isBgmPlaying]);

  useEffect(() => {
    if (bgmLoadState === 'ready') syncBgmPlayback(false);
  }, [bgmLoadState, syncBgmPlayback]);

  useEffect(() => {
    const audio = bgmAudioRef.current;
    if (audio) audio.volume = bgmVolume;
  }, [bgmVolume]);

  useEffect(() => {
    if (!isBgmPlaying) return;
    const timer = window.setInterval(() => syncBgmPlayback(true), 2000);
    const handleVisibility = () => { if (!document.hidden) syncBgmPlayback(true); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isBgmPlaying, syncBgmPlayback]);

  const handleBgmToggle = () => {
    const audio = bgmAudioRef.current;
    if (!audio || bgmLoadState !== 'ready') return;
    if (isBgmPlaying) {
      audio.pause();
      setIsBgmPlaying(false);
      return;
    }
    setIsBgmPlaying(true);
    syncBgmPlayback(true);
  };

  // 일반 방문자의 익명 세션은 관리자 로그인과 완전히 분리해 계속 유지합니다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(firebaseAuth);
          return;
        } catch (error) {
          console.error('Firebase anonymous sign-in failed:', error);
          showModal(
            '로그인 설정 필요',
            'Firebase Authentication의 로그인 제공업체에서 익명(Anonymous) 로그인을 사용 설정해 주세요.',
            null,
            false
          );
        }
        setAuthReady(true);
        return;
      }
      setAuthReady(true);
    });

    return unsubscribe;
  }, [showModal]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      setAdminLoginError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setAdminLoginLoading(true);
    setAdminLoginError('');

    try {
      await setPersistence(firebaseAdminAuth, inMemoryPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAdminAuth, adminEmail.trim(), adminPassword);
      if (!(await hasAdminAccess(credential.user, firebaseAdminDb))) {
        await signOut(firebaseAdminAuth);
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
    await signOut(firebaseAdminAuth);
    setIsAdmin(false);
    setAdminPassword('');
  };

  // 관리자가 옮긴 기본 예시 캐릭터 배치를 모든 접속자에게 공유합니다.
  useEffect(() => {
    if (!authReady || !firebaseAuth.currentUser) return;
    return onSnapshot(doc(firebaseDb, 'settings', 'worldLayout'), layoutDoc => {
      const positions = layoutDoc.exists() ? (layoutDoc.data().presetPositions || {}) : {};
      Object.entries(positions).forEach(([id, saved]) => {
        const pending = positionOverridesRef.current.get(id);
        if (pending && ((saved as any)?.updatedAtMs || 0) >= pending.updatedAtMs) positionOverridesRef.current.delete(id);
      });
      presetPositionsRef.current = positions;
      setWorldCharacters(previous => previous.map(character => {
        const saved = positions[character.id];
        return saved ? { ...character, x: saved.x, y: saved.y } : character;
      }));
    }, error => console.error('Firestore world layout read failed:', error));
  }, [authReady]);

  // 현재 화면 주변 3x3 구역에서 최대 40명만 실시간으로 불러옵니다.
  useEffect(() => {
    // Firestore 규칙은 로그인 사용자를 기준으로 하므로 인증이 끝난 뒤에만 조회합니다.
    if (!authReady || !firebaseAuth.currentUser) return;

    const savedMyCharacterId = window.localStorage.getItem('kspo-my-character-id');
    if (savedMyCharacterId) setMyCharacterId(savedMyCharacterId);

    const nearbyCellIds = [];
    for (let y = viewportCell.y - 1; y <= viewportCell.y + 1; y += 1) {
      for (let x = viewportCell.x - 1; x <= viewportCell.x + 1; x += 1) {
        if (x >= 0 && x < MAP_CELL_COUNT && y >= 0 && y < MAP_CELL_COUNT) nearbyCellIds.push(`${x}_${y}`);
      }
    }

    const nearbyQuery = query(
      collection(firebaseDb, 'characters'),
      where('cellId', 'in', nearbyCellIds),
      limit(40)
    );

    const unsubscribe = onSnapshot(nearbyQuery, (snapshot) => {
      const sharedCharacters = snapshot.docs.map(characterDoc => {
        const serverCharacter = { ...characterDoc.data(), id: characterDoc.id, isUser: true };
        const localPosition = positionOverridesRef.current.get(characterDoc.id);
        if (!localPosition) return serverCharacter;
        if (((serverCharacter as any).updatedAtMs || 0) >= localPosition.updatedAtMs) {
          positionOverridesRef.current.delete(characterDoc.id);
          return serverCharacter;
        }
        return { ...serverCharacter, x: localPosition.x, y: localPosition.y, cellId: localPosition.cellId };
      });
      setWorldCharacters(previousCharacters => {
        const stableSharedCharacters = sharedCharacters.map(serverCharacter => {
          const localCharacter = previousCharacters.find(character => character.id === serverCharacter.id);
          if (
            serverCharacter.id === myCharacterId
            && localCharacter
            && (localCharacter.updatedAtMs || 0) > ((serverCharacter as any).updatedAtMs || 0)
          ) {
            return {
              ...serverCharacter,
              jumpsCount: localCharacter.jumpsCount,
              restUntil: localCharacter.restUntil,
              lastRestBoundary: localCharacter.lastRestBoundary,
              passiveBaseJumps: localCharacter.passiveBaseJumps,
              passiveStartedAtMs: localCharacter.passiveStartedAtMs,
              animationStartedAtMs: localCharacter.animationStartedAtMs,
              updatedAtMs: localCharacter.updatedAtMs
            };
          }
          return serverCharacter;
        });
        const myPreviousCharacter = previousCharacters.find(character => character.id === myCharacterId);
        const hasMyCharacter = stableSharedCharacters.some(character => character.id === myCharacterId);
        const presetCharacters = PRESET_CHARACTERS.map(character => {
          const saved = presetPositionsRef.current[character.id];
          return saved ? { ...character, x: saved.x, y: saved.y } : character;
        });
        const pendingCharacters = previousCharacters.filter(character =>
          !character.id.startsWith('preset-')
          && positionOverridesRef.current.has(character.id)
          && !stableSharedCharacters.some(shared => shared.id === character.id)
        );
        return [
          ...presetCharacters,
          ...stableSharedCharacters,
          ...(myPreviousCharacter && !hasMyCharacter ? [myPreviousCharacter] : []),
          ...pendingCharacters.filter(character => character.id !== myCharacterId)
        ];
      });
    }, (error) => {
      console.error('Firestore nearby characters read failed:', error);
      showModal('연결 오류', '로그인은 완료됐지만 Firestore 읽기가 거부되었습니다. characters 보안 규칙을 확인해 주세요.', null, false);
    });

    return unsubscribe;
  }, [authReady, showModal, viewportCell.x, viewportCell.y, myCharacterId]);

  useEffect(() => {
    if (!authReady || !firebaseAuth.currentUser) return;
    getCountFromServer(collection(firebaseDb, 'characters'))
      .then(result => {
        setSharedCharacterCount(result.data().count);
        setCurrentCapacity(INITIAL_FILL + result.data().count);
      })
      .catch(() => {});
  }, [authReady]);

  // 현재 화면에 보이는 실제 사용자 캐릭터의 작은 채팅 문서만 구독합니다.
  useEffect(() => {
    if (!authReady || !firebaseAuth.currentUser || !chatOwnerKey) {
      setChatMessages({});
      return;
    }

    const ownerUids = chatOwnerKey.split('|').filter(Boolean);
    setChatMessages(previous => Object.fromEntries(
      Object.entries(previous).filter(([ownerUid]) => ownerUids.includes(ownerUid))
    ));

    const unsubscribes = ownerUids.map(ownerUid => onSnapshot(
      doc(firebaseDb, 'messages', ownerUid),
      messageDoc => {
        setChatMessages(previous => {
          const next = { ...previous };
          if (messageDoc.exists()) next[ownerUid] = messageDoc.data();
          else delete next[ownerUid];
          return next;
        });
      },
      error => console.error('Firestore chat read failed:', error)
    ));

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [authReady, chatOwnerKey]);

  const handleViewportChange = useCallback((x, y) => {
    setViewportCell(previous => previous.x === x && previous.y === y ? previous : { x, y });
  }, []);

  // 누적 에바뛰는 공통 기준 시각에서 1분마다 +1로 계산하고,
  // 실제 표시 횟수가 50의 배수에 도달할 때마다 정확히 10초간 쉽니다.
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setWorldCharacters(prev => prev.map(c => {
        const hasSharedProgressClock = Number.isFinite(c.passiveStartedAtMs) && Number.isFinite(c.passiveBaseJumps);
        const elapsedMinutes = hasSharedProgressClock
          ? Math.max(0, Math.floor((now - c.passiveStartedAtMs) / 60000))
          : 0;
        const displayedJumps = hasSharedProgressClock
          ? c.passiveBaseJumps + elapsedMinutes
          : (c.jumpsCount || 0);

        const activeSavedRestUntil = Number(c.restUntil) > now ? Number(c.restUntil) : 0;
        let scheduledRestUntil = 0;

        if (hasSharedProgressClock && displayedJumps > 0 && displayedJumps % 50 === 0) {
          const boundaryReachedAt = c.passiveStartedAtMs + elapsedMinutes * 60000;
          if (now < boundaryReachedAt + 10000) scheduledRestUntil = boundaryReachedAt + 10000;
        } else if (!hasSharedProgressClock) {
          // 기존 예시 캐릭터도 50번 점프 후 10초 쉬는 동작은 유지합니다.
          const animationStart = c.animationStartedAtMs || c.updatedAtMs || now;
          const animationSecond = Math.floor(Math.max(0, now - animationStart) / 1000) % 60;
          if (animationSecond >= 50) scheduledRestUntil = now + (60 - animationSecond) * 1000;
        }

        return {
          ...c,
          jumpsCount: displayedJumps,
          restUntil: Math.max(activeSavedRestUntil, scheduledRestUntil) || null
        };
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (currentCapacity >= MAX_CAPACITY) setIsFull(true);
  }, [currentCapacity]);

  useEffect(() => {
    worldCharactersRef.current = worldCharacters;
  }, [worldCharacters]);

  // 기존 캐릭터는 최초 접속 시 현재 횟수를 기준으로 새 1분 누적 시계를 한 번만 생성합니다.
  useEffect(() => {
    if (step !== 2 || !myCharacterId || myCharacterId.startsWith('preset-')) return;
    const myCharacter = worldCharacters.find(character => character.id === myCharacterId);
    if (!myCharacter || (Number.isFinite(myCharacter.passiveStartedAtMs) && Number.isFinite(myCharacter.passiveBaseJumps))) return;
    if (progressMigrationRef.current.has(myCharacterId)) return;

    progressMigrationRef.current.add(myCharacterId);
    const now = Date.now();
    const progressFields = {
      jumpsCount: myCharacter.jumpsCount || 0,
      passiveBaseJumps: myCharacter.jumpsCount || 0,
      passiveStartedAtMs: now,
      animationStartedAtMs: now,
      restUntil: null,
      updatedAtMs: now
    };
    setWorldCharacters(previous => previous.map(character =>
      character.id === myCharacterId ? { ...character, ...progressFields } : character
    ));
    updateDoc(doc(firebaseDb, 'characters', myCharacterId), progressFields)
      .catch(() => progressMigrationRef.current.delete(myCharacterId));
  }, [step, myCharacterId, worldCharacters]);

  const handleRegister = async (newChar) => {
    if (currentCapacity >= MAX_CAPACITY || sharedCharacterCount >= MAX_SHARED_CHARACTERS) {
        showModal('접속 불가', '광장 수용 인원이 가득 찼습니다.', null, false);
        return; 
    }
    try {
      const user = firebaseAuth.currentUser || (await signInAnonymously(firebaseAuth)).user;
      const trimmedName = String(newChar.name || '').trim();
      const nameKey = trimmedName.toLocaleLowerCase('ko-KR');
      const presetDuplicate = PRESET_CHARACTERS.some(character => String(character.name || '').trim().toLocaleLowerCase('ko-KR') === nameKey);
      const [sameNameResult, sameNameKeyResult] = await Promise.all([
        getDocs(query(collection(firebaseDb, 'characters'), where('name', '==', trimmedName), limit(1))),
        getDocs(query(collection(firebaseDb, 'characters'), where('nameKey', '==', nameKey), limit(1)))
      ]);
      if (presetDuplicate || !sameNameResult.empty || !sameNameKeyResult.empty) {
        showModal('닉네임 중복', '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.', null, false);
        return;
      }
      let sharedImageUrl = null;

      if (newChar.imageUrl) {
        const imageBlob = await fetch(newChar.imageUrl).then(response => response.blob());
        sharedImageUrl = await blobToDataUrl(imageBlob);
      }

      const startX = 1500 + (Math.random() * 120 - 60);
      const startY = 1500 + (Math.random() * 120 - 60);
      const now = Date.now();
      const charWithCoords = {
        ...newChar,
        name: trimmedName,
        nameKey,
        imageUrl: sharedImageUrl,
        x: startX,
        y: startY,
        cellId: getCellId(startX, startY),
        ownerUid: user.uid,
        passiveBaseJumps: newChar.jumpsCount || 0,
        passiveStartedAtMs: now,
        animationStartedAtMs: now,
        updatedAtMs: now
      };
      delete charWithCoords.isUser;

      await setDoc(doc(firebaseDb, 'characters', newChar.id), charWithCoords);
      setCurrentCapacity(prev => prev + 1);
      setSharedCharacterCount(prev => prev + 1);
      setMyCharacterId(newChar.id);
      window.localStorage.setItem('kspo-my-character-id', newChar.id);
      setStep(2);
    } catch (error) {
      console.error('Firestore character save failed:', error);
      showModal('저장 실패', '캐릭터를 저장하지 못했습니다. 익명 로그인과 Firestore characters 쓰기 규칙을 확인해 주세요.', null, false);
    }
  };

  const handleUpdateCharacterPosition = useCallback((id, newX, newY) => {
    if (!isAdmin && id !== myCharacterId) return;
    setWorldCharacters(prev => prev.map(c => c.id === id ? { ...c, x: newX, y: newY } : c));
    const oldTimer = positionSaveTimersRef.current.get(id);
    if (oldTimer) window.clearTimeout(oldTimer);
    const updatedAtMs = Date.now();
    const cellId = getCellId(newX, newY);
    positionOverridesRef.current.set(id, { x: newX, y: newY, cellId, updatedAtMs });
    const timer = window.setTimeout(() => {
      const writeDb = isAdmin ? firebaseAdminDb : firebaseDb;
      const savePosition = id.startsWith('preset-')
        ? setDoc(doc(writeDb, 'settings', 'worldLayout'), {
            presetPositions: { [id]: { x: newX, y: newY, updatedAtMs } },
            updatedAtMs
          }, { merge: true })
        : updateDoc(doc(writeDb, 'characters', id), { x: newX, y: newY, cellId, updatedAtMs });
      savePosition.catch(() => {
        positionOverridesRef.current.delete(id);
        showModal('위치 저장 실패', 'Firestore에서 관리자 위치 변경 권한을 확인해 주세요.', null, false);
      });
      positionSaveTimersRef.current.delete(id);
    }, 250);
    positionSaveTimersRef.current.set(id, timer);
  }, [isAdmin, myCharacterId, showModal]);

  const handleDeleteCharacter = useCallback(async (id) => {
    if (!isAdmin && id !== myCharacterId) return;
    const targetCharacter = worldCharactersRef.current.find(character => character.id === id);
    const isSharedCharacter = !id.startsWith('preset-');
    if (!id.startsWith('preset-')) {
      try {
        const writeDb = isAdmin ? firebaseAdminDb : firebaseDb;
        await deleteDoc(doc(writeDb, 'characters', id));
        if (targetCharacter?.ownerUid) {
          await deleteDoc(doc(writeDb, 'messages', targetCharacter.ownerUid)).catch(() => {});
        }
      } catch {
        showModal('삭제 실패', 'Firestore 삭제 권한을 확인해 주세요.', null, false);
        return;
      }
    }
    const pendingTimer = positionSaveTimersRef.current.get(id);
    if (pendingTimer) window.clearTimeout(pendingTimer);
    positionSaveTimersRef.current.delete(id);
    positionOverridesRef.current.delete(id);
    setWorldCharacters(prev => prev.filter(c => c.id !== id));
    if (isSharedCharacter) {
      setCurrentCapacity(prev => Math.max(INITIAL_FILL, prev - 1));
      setSharedCharacterCount(prev => Math.max(0, prev - 1));
    }
    if (id === myCharacterId) {
      setMyCharacterId(null);
      window.localStorage.removeItem('kspo-my-character-id');
      showModal('알림', '자신의 캐릭터를 삭제하여 구경 모드로 전환됩니다.', null, false);
    }
  }, [isAdmin, myCharacterId, showModal]);

  const handleClaimCharacter = useCallback(async (id) => {
    if (!isAdmin || id.startsWith('preset-') || !firebaseAuth.currentUser) return;
    const ownerUid = firebaseAuth.currentUser.uid;
    const updatedAtMs = Date.now();
    try {
      await updateDoc(doc(firebaseAdminDb, 'characters', id), { ownerUid, updatedAtMs });
      setWorldCharacters(previous => previous.map(character => character.id === id
        ? { ...character, ownerUid, updatedAtMs }
        : character));
      setMyCharacterId(id);
      window.localStorage.setItem('kspo-my-character-id', id);
      showModal('소유권 복구 완료', '이 캐릭터를 현재 브라우저의 내 캐릭터로 다시 연결했습니다.', null, false);
    } catch {
      showModal('복구 실패', '관리자 권한과 Firestore characters 수정 규칙을 확인해 주세요.', null, false);
    }
  }, [isAdmin, showModal]);

  const handleAddJumps = useCallback((id, amount, _stopAtRestBoundary = false) => {
    const now = Date.now();
    let savedChanges = null;
    setWorldCharacters(prev => prev.map(c => {
      if (c.id !== id) return c;

      const currentJumps = c.jumpsCount || 0;
      const requestedJumps = currentJumps + amount;
      const crossedRestBoundary = Math.floor(requestedJumps / 50) > Math.floor(currentJumps / 50);
      savedChanges = {
        jumpsCount: requestedJumps,
        passiveBaseJumps: requestedJumps,
        passiveStartedAtMs: now,
        restUntil: crossedRestBoundary ? now + 10000 : (Number(c.restUntil) > now ? c.restUntil : null),
        updatedAtMs: now
      };
      return { ...c, ...savedChanges };
    }));
    if (!id.startsWith('preset-')) {
      window.setTimeout(() => {
        if (savedChanges) updateDoc(doc(firebaseDb, 'characters', id), savedChanges).catch(() => {});
      }, 0);
    }
  }, []);

  const handleSendChat = useCallback(async (rawText) => {
    const user = firebaseAuth.currentUser;
    const myCharacter = worldCharactersRef.current.find(character => character.id === myCharacterId);
    const text = sliceEmojiString(String(rawText || '').replace(/\s+/g, ' ').trim(), 30);
    if (!user || !myCharacter || !text) throw new Error('채팅을 보낼 수 없습니다.');

    const now = Date.now();
    const message = {
      ownerUid: user.uid,
      characterId: myCharacter.id,
      cellId: getCellId(myCharacter.x, myCharacter.y),
      text,
      updatedAtMs: now,
      expiresAtMs: now + 5000
    };

    await setDoc(doc(firebaseDb, 'messages', user.uid), message);
    setChatMessages(previous => ({ ...previous, [user.uid]: message }));
  }, [myCharacterId]);

  const handleUpdateBestScore = useCallback((id, gameType, score) => {
    let bestScoreChanged = false;
    setWorldCharacters(prev => prev.map(c => {
      if (c.id === id) {
        const currentBest = c[`${gameType}Best`] || 0;
        if (score > currentBest) {
          bestScoreChanged = true;
          return { ...c, [`${gameType}Best`]: score };
        }
      }
      return c;
    }));
    if (!id.startsWith('preset-')) {
      window.setTimeout(() => {
        if (bestScoreChanged) updateDoc(doc(firebaseDb, 'characters', id), { [`${gameType}Best`]: score, updatedAtMs: Date.now() }).catch(() => {});
      }, 0);
    }
  }, []);

  const handleResetWorld = useCallback(async () => {
    if (!isAdmin) return;
    const snapshot = await getDocs(collection(firebaseAdminDb, 'characters'));
    const batches = [];
    for (let i = 0; i < snapshot.docs.length; i += 450) {
      const batch = writeBatch(firebaseAdminDb);
      snapshot.docs.slice(i, i + 450).forEach(characterDoc => batch.delete(doc(firebaseAdminDb, 'characters', characterDoc.id)));
      batches.push(batch.commit());
    }
    await Promise.all(batches);
    setWorldCharacters(PRESET_CHARACTERS);
    setCurrentCapacity(INITIAL_FILL);
    setSharedCharacterCount(0);
    setMyCharacterId(null);
    window.localStorage.removeItem('kspo-my-character-id');
    setIsFull(false);
    showModal('초기화 완료', '월드가 완전히 초기화되었습니다.', null, false);
  }, [isAdmin, showModal]);

  const fillPercentage = ((currentCapacity / MAX_CAPACITY) * 100).toFixed(1);

  return (
    <div className="fixed top-0 left-0 w-full h-[100lvh] flex flex-col font-sans overflow-hidden bg-[#808080] text-black">
      <style>{globalStyles}</style>
      <audio ref={bgmAudioRef} preload="metadata" onEnded={() => syncBgmPlayback(isBgmPlaying)} />

      {/* 레트로 윈도우 95 스타일 헤더 */}
      <header className="win95-panel m-0 p-1 sm:p-2 flex flex-col md:flex-row justify-between items-center gap-1 sm:gap-4 z-40">
        <div className="flex items-center gap-2 px-2 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWpz2kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA6SURBVChTY/z//z8DtQATAxWASTT//9sV9A8nQ9Vwg0BcEKYIboBIAwB2F1FkA7oBsAC6AcQGIMv/GQC0oSEW4K7rKAAAAABJRU5ErkJggg==" alt="icon" className="w-4 h-4 rendering-pixelated" />
            <div className="flex flex-col leading-tight">
              <h1 className="text-sm font-bold">에바뛰_네트워크_모니터.exe {isAdmin && <span className="text-red-600">[ADMIN]</span>}</h1>
              <a
                href="https://x.com/the_JYH"
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-[8px] sm:text-[9px] text-gray-600 hover:text-[#000080] hover:underline no-underline"
                aria-label="제작자 the_JYH의 X 계정 열기"
              >
                Created by @the_JYH
              </a>
            </div>
          </div>
          {step === 2 && (
            <button
              type="button"
              onClick={() => setIsMobileMapMenuOpen(previous => !previous)}
              className="mobile-map-menu-toggle win95-button sm:hidden px-2 py-0.5 text-xs font-bold whitespace-nowrap"
              aria-expanded={isMobileMapMenuOpen}
            >
              {isMobileMapMenuOpen ? '▲ 메뉴 접기' : '▼ 메뉴 열기'}
            </button>
          )}
        </div>

        <div className={`${step === 2 && !isMobileMapMenuOpen ? 'hidden sm:flex' : 'flex'} items-center gap-4 w-full md:w-auto px-2 justify-end`}>
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs font-bold tracking-wide">
              KSPO DOME 실시간 인원 <span className="text-[#000080] text-sm">{currentCapacity.toLocaleString()}</span> / {MAX_CAPACITY.toLocaleString()}명
            </div>
            {/* 윈도우 95 스타일 프로그레스 바 */}
            <div className="win95-input p-[1px] w-full sm:w-64 h-[16px] flex bg-[#c0c0c0]">
              <div className={`h-full ${isFull ? 'bg-red-600' : 'bg-[#000080]'}`} style={{ width: `${fillPercentage}%` }}></div>
            </div>
          </div>

          {step === 2 && (
            <div className="flex items-center gap-1 border-l border-[var(--win-border-dark)] pl-2">
              <button
                type="button"
                onClick={handleBgmToggle}
                disabled={bgmLoadState !== 'ready'}
                className={`win95-button px-2 py-1 text-xs font-bold whitespace-nowrap ${isBgmPlaying ? 'text-green-800' : 'text-[#000080]'} disabled:opacity-60`}
                title={bgmTrackTitle}
              >
                {bgmLoadState === 'error' ? '🎧 파일 확인' : isBgmPlaying ? '⏸ 노래 멈춤' : '🎧 노래 듣기'}
              </button>
              {isBgmPlaying && (
                <div className="flex flex-col gap-0.5 min-w-[90px] max-w-[130px]">
                  <span className="text-[9px] font-bold truncate" title={bgmTrackTitle}>♪ {bgmTrackTitle}</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgmVolume}
                    onChange={event => setBgmVolume(Number(event.target.value))}
                    className="w-full h-3 accent-[#000080]"
                    aria-label="배경음악 볼륨"
                  />
                </div>
              )}
            </div>
          )}
          
          {step === 1 && (
            <button onClick={() => setStep(2)} className="win95-button font-bold py-1 px-4 text-sm ml-4 h-[30px] whitespace-nowrap">
              KSPO DOME으로 가기 🚀
            </button>
          )}
          {isFull && <span className="text-xs text-red-600 font-bold blink-text">[SOLD OUT]</span>}
          {isAdmin && <button onClick={handleAdminLogout} className="win95-button text-xs text-red-700 font-bold">관리자 로그아웃</button>}
        </div>
      </header>

      <main className="flex-1 relative w-full h-full p-1 sm:p-2 flex items-start sm:items-center justify-center min-h-0 overflow-hidden">
        {step === 1 ? (
          <Step1Create 
            characterName={characterName} setCharacterName={setCharacterName}
            characterImage={characterImage} setCharacterImage={setCharacterImage}
            characterEmoji={characterEmoji} setCharacterEmoji={setCharacterEmoji}
            motionType={motionType} setMotionType={setMotionType}
            hasItem={hasItem} setHasItem={setHasItem}
            onRegister={handleRegister} isFull={isFull}
          />
        ) : (
          <Step2GlobalSquare 
            characters={worldCharacters} myCharacterId={myCharacterId} isAdmin={isAdmin}
            onGoHome={() => setStep(1)} onUpdatePosition={handleUpdateCharacterPosition}
            onDeleteCharacter={handleDeleteCharacter} onClaimCharacter={handleClaimCharacter} sysStageImg={sysStageImg} sysFanImg={sysFanImg}
            onAddJumps={handleAddJumps} onResetWorld={handleResetWorld} onShowConfirm={showModal}
            onUpdateBestScore={handleUpdateBestScore}
            onViewportChange={handleViewportChange}
            chatMessages={chatMessages} onSendChat={handleSendChat}
            mobileControlsOpen={isMobileMapMenuOpen}
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
  motionType, setMotionType, hasItem, setHasItem, onRegister, isFull
}) {
  const [isTestJumping, setIsTestJumping] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [imageMessage, setImageMessage] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState('idle');

  useEffect(() => {
    const trimmedName = characterName.trim();
    if (!trimmedName) {
      setNicknameStatus('idle');
      return;
    }

    let cancelled = false;
    setNicknameStatus('checking');
    const timer = window.setTimeout(async () => {
      try {
        const nameKey = trimmedName.toLocaleLowerCase('ko-KR');
        const presetDuplicate = PRESET_CHARACTERS.some(character => String(character.name || '').trim().toLocaleLowerCase('ko-KR') === nameKey);
        const [sameNameResult, sameNameKeyResult] = await Promise.all([
          getDocs(query(collection(firebaseDb, 'characters'), where('name', '==', trimmedName), limit(1))),
          getDocs(query(collection(firebaseDb, 'characters'), where('nameKey', '==', nameKey), limit(1)))
        ]);
        if (!cancelled) setNicknameStatus(presetDuplicate || !sameNameResult.empty || !sameNameKeyResult.empty ? 'duplicate' : 'available');
      } catch (error) {
        console.error('Nickname duplicate check failed:', error);
        if (!cancelled) setNicknameStatus('error');
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [characterName]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImageProcessing(true);
    setImageMessage('사진을 자동으로 최적화하는 중...');
    try {
      const compressedBlob = await compressCharacterImage(file);
      if (characterImage?.startsWith('blob:')) URL.revokeObjectURL(characterImage);
      setCharacterImage(URL.createObjectURL(compressedBlob));
      setImageMessage(`압축 완료 · ${(compressedBlob.size / 1024).toFixed(1)}KB · WebP`);
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : '이미지 압축에 실패했습니다.');
    } finally {
      setIsImageProcessing(false);
      e.target.value = '';
    }
  };

  const handleEmojiChange = (e) => setCharacterEmoji(sliceEmojiString(e.target.value, 2));

  const handleTestJump = () => {
    setIsTestJumping(true);
    setTimeout(() => setIsTestJumping(false), 1200);
  };

  const handleSubmit = () => {
    if (!characterName.trim() || isFull || nicknameStatus === 'duplicate' || nicknameStatus === 'checking') return;
    onRegister({
      id: 'user-' + Date.now(), name: characterName, imageUrl: characterImage, emoji: characterImage ? null : (characterEmoji || '😎'),
      hasItem: hasItem, delay: 0, duration: motionType === 1 ? 1.0 : 1.2, motionType: motionType, jumpsCount: 1, isUser: true,
      runBest: 0, roofBest: 0
    });
  };

  return (
    <div className="win95-window w-full max-w-xl mx-auto flex flex-col shadow-[4px_4px_0_rgba(0,0,0,0.5)] z-10 max-h-[calc(100dvh-92px)] sm:max-h-[90vh] overflow-y-auto">
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5"><span>캐릭터_생성.exe</span></div>
        <button className="win95-title-btn">X</button>
      </div>

      <div className="p-2 sm:p-4 flex flex-col md:flex-row gap-2 sm:gap-4 bg-[#c0c0c0] text-black">
        <div className="flex flex-col gap-1 sm:gap-2 md:w-1/2">
          <label className="text-xs sm:text-sm font-bold">미리보기 (Preview)</label>
          <div className="win95-panel w-full h-28 sm:h-auto sm:aspect-square bg-white flex items-end justify-center pb-4 sm:pb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"></div>
            <div className={`flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 z-10 ${isTestJumping ? 'jump-once-' + motionType : ''}`}>
              <div className="relative inline-flex items-center justify-center pointer-events-none">
                {characterImage ? (
                  <img src={characterImage} alt="preview" className="max-w-[80px] max-h-[80px] sm:max-w-[96px] sm:max-h-[96px] object-contain pixelated" />
                ) : (
                  <span className="text-5xl sm:text-6xl" style={{ textShadow: '2px 2px 0 #fff' }}>{characterEmoji}</span>
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
            <div className="absolute bottom-3 sm:bottom-6 w-12 h-1 bg-gray-400 rounded-[100%] scale-x-150 z-0"></div>
          </div>
          <button onClick={handleTestJump} className="win95-button w-full py-0.5 sm:py-1 text-xs sm:text-sm">모션 테스트 (T)</button>
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-bold text-[#000080] py-1">
            <input type="checkbox" checked={hasItem} onChange={(e) => setHasItem(e.target.checked)} className="accent-[#000080]" />
            [아이템] 에바뛰 부채 장착하기
          </label>
        </div>

        <div className="flex flex-col gap-2 sm:gap-4 md:w-1/2 justify-between">
          <div className="space-y-2 sm:space-y-4">
            <div className="flex flex-col gap-1 border border-[var(--win-border-dark)] p-2 sm:p-3 relative pt-3 sm:pt-4">
              <div className="absolute -top-3 left-2 bg-[#c0c0c0] px-1 flex items-center gap-2 text-sm font-bold">
                <span>닉네임 입력:</span>
                {nicknameStatus === 'duplicate' && <span className="text-red-700 text-[10px] whitespace-nowrap">이미 사용 중인 닉네임입니다.</span>}
                {nicknameStatus === 'checking' && <span className="text-gray-600 text-[10px] whitespace-nowrap">확인 중...</span>}
                {nicknameStatus === 'available' && <span className="text-green-700 text-[10px] whitespace-nowrap">사용 가능</span>}
              </div>
              <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} placeholder="이름을 입력하세요" className={`win95-input w-full ${nicknameStatus === 'duplicate' ? '!border-red-700' : ''}`} maxLength={12} />
            </div>

            <div className="flex flex-col gap-1 border border-[var(--win-border-dark)] p-2 sm:p-3 relative pt-3 sm:pt-4 mt-2">
              <span className="absolute -top-3 left-2 bg-[#c0c0c0] px-1 text-sm font-bold">캐릭터 외형</span>
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <label className="text-sm w-20 font-bold">이모지 입력:</label>
                <input type="text" value={characterEmoji} onChange={handleEmojiChange} className="win95-input w-16 text-center text-xl bg-white" placeholder="😎" />
                <span className="text-xs text-gray-600">(최대 2개)</span>
              </div>
              <hr className="border-t border-[var(--win-border-dark)] my-1 sm:my-2" />
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700">또는 내 이미지 업로드:</label>
                <div className="flex gap-1">
                  <label className={`win95-button flex-1 flex justify-center py-1 ${isImageProcessing ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}>
                    <span>{isImageProcessing ? '압축 중...' : '파일 찾기...'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isImageProcessing} />
                  </label>
                  {characterImage && <button onClick={() => { if (characterImage.startsWith('blob:')) URL.revokeObjectURL(characterImage); setCharacterImage(null); setImageMessage(''); }} className="win95-button text-red-600 px-2 font-bold py-1">X 제거</button>}
                </div>
                {imageMessage && <div className={`text-[10px] mt-1 ${imageMessage.startsWith('압축 완료') ? 'text-green-800' : 'text-red-700'}`}>{imageMessage}</div>}
              </div>
            </div>

            <div className="flex flex-col gap-1 border border-[var(--win-border-dark)] p-2 sm:p-3 relative pt-3 sm:pt-4 mt-2">
              <span className="absolute -top-3 left-2 bg-[#c0c0c0] px-1 text-sm font-bold">점프 스타일</span>
              <div className="flex flex-col gap-1 sm:gap-2 mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" checked={motionType === 0} onChange={() => setMotionType(0)} className="accent-[#000080]" />1. 기본 점프</label>
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" checked={motionType === 1} onChange={() => setMotionType(1)} className="accent-[#000080]" />2. 2단 점프</label>
              </div>
            </div>

          </div>

          <div className="flex flex-col gap-1 mt-1 sm:mt-4 pt-2 sm:pt-4 border-t border-[var(--win-border-white)]">
            <button onClick={handleSubmit} disabled={!characterName.trim() || isFull || nicknameStatus === 'duplicate' || nicknameStatus === 'checking'} className="win95-button font-bold py-1.5 sm:py-2 w-full text-sm sm:text-base disabled:opacity-60">
              {isFull ? '접속 불가 (마감)' : nicknameStatus === 'duplicate' ? '다른 닉네임을 입력해 주세요' : nicknameStatus === 'checking' ? '닉네임 확인 중...' : '입장하기 (Enter)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2GlobalSquare({ characters, myCharacterId, isAdmin, onGoHome, onUpdatePosition, onDeleteCharacter, onClaimCharacter, sysStageImg, sysFanImg, onAddJumps, onResetWorld, onShowConfirm, onUpdateBestScore, onViewportChange, chatMessages, onSendChat, mobileControlsOpen }) {
  const WORLD_SIZE = 3000;
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const dragDistanceRef = useRef(0);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const activePointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  
  const [transform, setTransform] = useState({ x: -600, y: -600, scale: 0.85 });
  const transformRef = useRef(transform);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredChar, setHoveredChar] = useState(null);
  const [draggingCharId, setDraggingCharId] = useState(null);
  const [isPositionEditMode, setIsPositionEditMode] = useState(false);

  const [clickCounts, setClickCounts] = useState({});
  const [feverStates, setFeverStates] = useState({});
  const [isRunGameOpen, setIsRunGameOpen] = useState(false);
  const [isRoofGameOpen, setIsRoofGameOpen] = useState(false);
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatCooldownUntil, setChatCooldownUntil] = useState(0);

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    const safeText = sliceEmojiString(chatDraft.replace(/\s+/g, ' ').trim(), 30);
    if (!safeText || chatSending || Date.now() < chatCooldownUntil) return;

    setChatSending(true);
    try {
      await onSendChat(safeText);
      setChatDraft('');
      const cooldownEnd = Date.now() + 5000;
      setChatCooldownUntil(cooldownEnd);
      window.setTimeout(() => setChatCooldownUntil(0), 5000);
    } catch (error) {
      console.error('Chat send failed:', error);
      onShowConfirm('채팅 전송 실패', 'Firestore messages 권한과 보안 규칙을 확인해 주세요.', null, false);
    } finally {
      setChatSending(false);
    }
  };

  const clampTransform = useCallback((candidate) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return candidate;

    // 그리드가 화면보다 작아지지 않도록 최소 배율을 정하고,
    // 네 방향 모두 그리드 경계 밖의 회색 영역으로 넘어가지 못하게 합니다.
    const minimumScale = Math.max(0.3, rect.width / WORLD_SIZE, rect.height / WORLD_SIZE);
    const scale = Math.min(3, Math.max(minimumScale, candidate.scale));
    const scaledWidth = WORLD_SIZE * scale;
    const scaledHeight = WORLD_SIZE * scale;
    const minX = rect.width - scaledWidth;
    const minY = rect.height - scaledHeight;

    return {
      scale,
      x: scaledWidth <= rect.width ? (rect.width - scaledWidth) / 2 : Math.min(0, Math.max(minX, candidate.x)),
      y: scaledHeight <= rect.height ? (rect.height - scaledHeight) / 2 : Math.min(0, Math.max(minY, candidate.y))
    };
  }, []);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    const keepInsideGrid = () => setTransform(previous => clampTransform(previous));
    keepInsideGrid();
    const observer = new ResizeObserver(keepInsideGrid);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', keepInsideGrid);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', keepInsideGrid);
    };
  }, [clampTransform]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const current = transformRef.current;
      const centerWorldX = Math.max(0, Math.min(2999, ((rect.width / 2) - current.x) / current.scale));
      const centerWorldY = Math.max(0, Math.min(2999, ((rect.height / 2) - current.y) / current.scale));
      onViewportChange(
        Math.floor(centerWorldX / MAP_CELL_SIZE),
        Math.floor(centerWorldY / MAP_CELL_SIZE)
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [transform, onViewportChange]);

  const filteredChars = useMemo(() => {
    if (!searchTerm) return characters;
    return characters.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [characters, searchTerm]);
  const currentUserUid = firebaseAuth.currentUser?.uid;
  const myCharacter = useMemo(
    () => characters.find(character => character.id === myCharacterId && character.isUser && character.ownerUid === currentUserUid),
    [characters, myCharacterId, currentUserUid]
  );
  const hasMyCharacter = Boolean(myCharacter);

  const handlePointerDown = (e) => {
    if (draggingCharId) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointersRef.current.size >= 2) {
      const [first, second] = Array.from(activePointersRef.current.values()).slice(0, 2);
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = ((first.x + second.x) / 2) - rect.left;
      const centerY = ((first.y + second.y) / 2) - rect.top;
      const current = transformRef.current;
      pinchRef.current = {
        distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
        scale: current.scale,
        worldX: (centerX - current.x) / current.scale,
        worldY: (centerY - current.y) / current.scale
      };
      setIsDragging(false);
      return;
    }
    setIsDragging(true);
    dragDistanceRef.current = 0;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setDragStart({ x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y });
  };

  const handlePointerMove = (e) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size >= 2 && pinchRef.current) {
      const [first, second] = Array.from(activePointersRef.current.values()).slice(0, 2);
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = ((first.x + second.x) / 2) - rect.left;
      const centerY = ((first.y + second.y) / 2) - rect.top;
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const nextScale = Math.min(3, Math.max(0.3, pinchRef.current.scale * (distance / pinchRef.current.distance)));
      const next = clampTransform({
        scale: nextScale,
        x: centerX - pinchRef.current.worldX * nextScale,
        y: centerY - pinchRef.current.worldY * nextScale
      });
      transformRef.current = next;
      setTransform(next);
      dragDistanceRef.current += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);
      return;
    }

    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    if (draggingCharId) {
      dragDistanceRef.current += Math.abs(dx) + Math.abs(dy);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const blueprintEl = containerRef.current?.querySelector('.bg-grid');
        if (!blueprintEl) return;
        const rect = blueprintEl.getBoundingClientRect();
        const worldX = (e.clientX - rect.left) / transformRef.current.scale;
        const worldY = (e.clientY - rect.top) / transformRef.current.scale;
        onUpdatePosition(draggingCharId, Math.max(50, Math.min(WORLD_SIZE - 50, worldX)), Math.max(50, Math.min(WORLD_SIZE - 50, worldY)));
      });
      return;
    }
    if (!isDragging) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setTransform(prev => {
        const next = clampTransform({ ...prev, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        transformRef.current = next;
        return next;
      });
    });
  };

  const handlePointerUp = (e) => {
    if (e?.currentTarget?.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    activePointersRef.current.delete(e.pointerId);
    pinchRef.current = null;
    if (activePointersRef.current.size === 1) {
      const remaining = Array.from(activePointersRef.current.values())[0];
      lastPointerRef.current = remaining;
      setDragStart({ x: remaining.x - transformRef.current.x, y: remaining.y - transformRef.current.y });
      setIsDragging(true);
    } else {
      setIsDragging(false);
    }
    setDraggingCharId(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const delta = -e.deltaY * 0.002;
      setTransform(prev => clampTransform({ ...prev, scale: prev.scale + delta }));
    });
  };

  const findMyCharacter = () => {
    if (!myCharacterId) return;
    const myChar = myCharacter;
    if (myChar) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTransform(clampTransform({ scale: 1.5, x: (rect.width / 2) - (myChar.x * 1.5), y: (rect.height / 2) - (myChar.y * 1.5) }));
    }
  };

  return (
    <div className="win95-window w-full h-full flex flex-col shadow-[4px_4px_0_rgba(0,0,0,0.5)] bg-[#c0c0c0] text-black relative">
      <div className="win95-titlebar">
        <div className="flex items-center gap-1.5"><span>KSPO_DOME_VIEWER.exe</span></div>
        <div className="flex gap-0.5"><button className="win95-title-btn">_</button><button className="win95-title-btn">□</button><button className="win95-title-btn" onClick={onGoHome}>X</button></div>
      </div>

      <div className={`bg-[#c0c0c0] p-1 ${mobileControlsOpen ? 'flex' : 'hidden sm:flex'} flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[var(--win-border-dark)] z-50`}>
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={onGoHome} className="win95-button">◀ 뒤로</button>
          <div className="flex items-center gap-1 ml-2"><span className="text-xs">찾기:</span><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="win95-input w-24 sm:w-32" /></div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setIsPositionEditMode(previous => !previous)}
              className={`win95-button font-bold border ${isPositionEditMode ? 'text-white bg-[#000080] border-[#000080]' : 'text-[#000080] border-[#000080]'}`}
              aria-pressed={isPositionEditMode}
            >
              위치 편집 {isPositionEditMode ? 'ON' : 'OFF'}
            </button>
          )}
          {isAdmin && <button onClick={() => onShowConfirm("초기화", "모든 캐릭터를 삭제하시겠습니까?", onResetWorld)} className="win95-button text-red-600 font-bold border border-red-800">월드 초기화</button>}
          {hasMyCharacter && <button onClick={findMyCharacter} className="win95-button font-bold text-[#000080]">내 캐릭터 찾기</button>}
          {hasMyCharacter && <button onClick={() => setIsGameMenuOpen(true)} className="win95-button font-bold text-[#000080] ml-1">🎮 미니게임</button>}
          <div className="flex gap-1 ml-2 border-l border-[var(--win-border-dark)] pl-2">
            <button onClick={() => setTransform(p => clampTransform({...p, scale: p.scale + 0.2}))} className="win95-button">+</button>
            <button onClick={() => setTransform(p => clampTransform({...p, scale: p.scale - 0.2}))} className="win95-button">-</button>
          </div>
        </div>
        {hasMyCharacter && (
          <form onSubmit={handleChatSubmit} className="flex items-center gap-1 w-full sm:w-auto">
            <input
              type="text"
              value={chatDraft}
              onChange={event => setChatDraft(sliceEmojiString(event.target.value, 30))}
              className="win95-input flex-1 sm:w-48 min-w-0"
              placeholder="메시지·이모티콘 (30자)"
              aria-label="캐릭터 채팅 메시지"
            />
            <button type="submit" disabled={!chatDraft.trim() || chatSending || Date.now() < chatCooldownUntil} className="win95-button whitespace-nowrap disabled:opacity-60">
              {chatSending ? '전송 중' : Date.now() < chatCooldownUntil ? '대기' : '말하기'}
            </button>
          </form>
        )}
      </div>

      <div
        className="win95-panel flex-1 relative overflow-hidden bg-[#e0e0e0] cursor-crosshair active:cursor-move min-h-0"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        {isAdmin && isPositionEditMode && (
          <div className="absolute left-2 top-2 z-[100] bg-[#ffffcc] border-2 border-black px-2 py-1 text-xs font-bold shadow-[2px_2px_0_#000] pointer-events-none">
            위치 편집 중 · 캐릭터를 드래그해서 옮겨주세요
          </div>
        )}
        <div className="relative bg-grid origin-top-left" style={{ width: `${WORLD_SIZE}px`, height: `${WORLD_SIZE}px`, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, willChange: 'transform' }}>
          
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
             <img src={sysStageImg} alt="stage" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>

          {filteredChars.map((char) => {
            const isMine = char.id === myCharacterId && Boolean(currentUserUid) && char.ownerUid === currentUserUid;
            const canEdit = isMine || (isAdmin && isPositionEditMode);
            const isFever = feverStates[char.id] && Date.now() < feverStates[char.id];
            const isResting = char.restUntil && Date.now() < char.restUntil;
            const chatMessage = (char.ownerUid ? chatMessages[char.ownerUid] : null)
              || Object.values(chatMessages).find((message: any) => message?.characterId === char.id);
            const showChat = chatMessage?.characterId === char.id && chatMessage.expiresAtMs > Date.now();
            
            return (
              <div 
                key={char.id} className={`absolute flex flex-col items-center group ${char.isUser ? 'z-40' : 'z-10'} ${canEdit ? 'cursor-move' : 'cursor-pointer'}`}
                style={{ left: char.x, top: char.y, transform: 'translate(-50%, -100%)' }}
                onMouseEnter={() => { if (!isDragging && !draggingCharId) setHoveredChar(char.id); }}
                onMouseLeave={() => { if (!isDragging) setHoveredChar(null); }}
                onPointerDown={(e) => {
                  if (canEdit) {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    lastPointerRef.current = { x: e.clientX, y: e.clientY };
                    setDraggingCharId(char.id);
                    dragDistanceRef.current = 0;
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canEdit && dragDistanceRef.current > 5) return; 
                  if (!isMine) return; // 내 캐릭터만 상호작용 가능
                  if (isResting) return; // 휴식 중이면 클릭 무시

                  onAddJumps(char.id, 1, true);

                  if (!isFever) {
                    setClickCounts(prev => {
                      const now = Date.now();
                      const history = (prev[char.id] || []).filter(t => now - t < 2000);
                      history.push(now);
                      if (history.length >= 10) {
                        setFeverStates(fs => ({ ...fs, [char.id]: now + 5000 }));
                        setTimeout(() => { setFeverStates(fs => { const n = {...fs}; if(n[char.id]<=Date.now()) delete n[char.id]; return n; }); }, 5000);
                        return { ...prev, [char.id]: [] };
                      }
                      return { ...prev, [char.id]: history };
                    });
                  }
                }}
              >
                {showChat && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
                    style={{ bottom: `calc(100% + ${8 / transform.scale}px)` }}
                  >
                    <div
                      className="relative w-max max-w-[190px] min-w-[90px] rounded-[5px] border border-[#8d8d8d] bg-[#fffef5] px-3 py-2 text-center text-[13px] leading-[1.35] font-normal text-[#252525] shadow-[1px_2px_0_rgba(0,0,0,0.18)] whitespace-normal break-words"
                      style={{ transform: `scale(${1 / transform.scale})`, transformOrigin: 'bottom center', fontFamily: "'DungGeunMo', monospace" }}
                    >
                      {chatMessage.text}
                      <span className="absolute left-[22px] top-full w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-[#8d8d8d]"></span>
                      <span className="absolute left-[23px] top-full -mt-[1px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-[#fffef5]"></span>
                    </div>
                  </div>
                )}
                <div className="relative" id={`char-wrapper-${char.id}`}>
                  <div className={`${isResting ? '' : `jump-motion-${char.motionType || 0}`} flex items-end justify-center relative ${isFever && !isResting ? 'fever-glow' : ''}`} style={{ '--duration': `${char.duration}s`, '--delay': `${char.delay}s`, width: isMine ? '60px' : '40px', height: isMine ? '60px' : '40px', filter: isResting ? 'grayscale(100%) opacity(50%)' : undefined, transform: isResting ? 'translateY(0)' : undefined } as React.CSSProperties}>
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
                    {isResting ? '💤 숨고르기 중...' : isFever ? '🔥 FEVER TIME!' : getBadgeName(char.jumpsCount)}
                  </div>
                  <div className="text-[11px]">에바뛰 : {char.jumpsCount.toLocaleString()}회</div>
                  
                  {(char.runBest > 0 || char.roofBest > 0) && (
                    <div className="text-[9px] mt-1 text-gray-700 border-t border-gray-400 pt-1 w-full flex flex-col gap-0.5">
                      {char.runBest > 0 && <div className="flex justify-between"><span>달리기 최고:</span> <b>{char.runBest}개</b></div>}
                      {char.roofBest > 0 && <div className="flex justify-between"><span>계단 최고:</span> <b>{char.roofBest}M</b></div>}
                    </div>
                  )}

                  {isMine && (
                    <div className="flex gap-1 mt-1 w-full justify-start">
                      <button 
                        onClick={(e) => { e.stopPropagation(); document.getElementById(`char-wrapper-${char.id}`)?.click(); }} 
                        disabled={isResting}
                        className={`win95-button text-[10px] py-0 px-2 ${isResting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {isResting ? '휴식중..' : '+1 👆'}
                      </button>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`내 ${char.name}이(가) KSPO DOME 에바뛰 광장에서 ${char.jumpsCount.toLocaleString()}회째 뛰는 중! 🏃‍♂️💨 같이 뛰어주세요! ${window.location.href} #에바뛰 #EVERYBODY_JUMP`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="win95-button text-[10px] py-0 px-2 bg-black text-white no-underline"
                      >𝕏 Share</a>
                    </div>
                  )}
                  {isAdmin && char.isUser && (
                    <div className="flex flex-col gap-1 mt-1 w-full">
                      {!isMine && (
                        <button
                          type="button"
                          className="win95-button text-[10px] py-0 px-2 w-full !text-[#000080] font-bold"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            onShowConfirm(
                              '내 캐릭터로 연결',
                              `${char.name} 캐릭터를 현재 브라우저의 내 캐릭터로 다시 연결하시겠습니까?`,
                              () => onClaimCharacter(char.id)
                            );
                          }}
                        >
                          🔑 내 캐릭터로 연결
                        </button>
                      )}
                      <button
                        type="button"
                        className="win95-button text-[10px] py-0 px-2 w-full !text-red-700 font-bold"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          onShowConfirm(
                            '캐릭터 삭제',
                            `${char.name} 캐릭터를 광장에서 완전히 삭제하시겠습니까?`,
                            () => onDeleteCharacter(char.id)
                          );
                        }}
                      >
                        🗑 캐릭터 삭제
                      </button>
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

      {hasMyCharacter && isGameMenuOpen && (
        <div className="fixed inset-0 z-[9000] bg-black/55 flex items-center justify-center p-4" onPointerDown={(event) => event.stopPropagation()}>
          <div className="win95-window w-full max-w-sm shadow-[5px_5px_0_rgba(0,0,0,0.55)]">
            <div className="win95-titlebar">
              <span>🎮 미니게임_선택.exe</span>
              <button className="win95-title-btn" onClick={() => setIsGameMenuOpen(false)}>X</button>
            </div>
            <div className="bg-[#c0c0c0] p-3 flex flex-col gap-3">
              <div className="text-center text-sm font-bold">플레이할 게임을 선택해 주세요!</div>
              <button
                className="win95-button !items-start flex-col gap-1 p-3 text-left"
                onClick={() => { setIsGameMenuOpen(false); setIsRunGameOpen(true); }}
              >
                <span className="font-bold text-red-700 text-base">🏃 무한 달리기</span>
                <span className="text-[11px] text-gray-700">장애물을 피하고 별을 모아요 · 장애물 10개당 5 에바뛰</span>
              </button>
              <button
                className="win95-button !items-start flex-col gap-1 p-3 text-left"
                onClick={() => { setIsGameMenuOpen(false); setIsRoofGameOpen(true); }}
              >
                <span className="font-bold text-blue-700 text-base">☁️ 천국의 계단</span>
                <span className="text-[11px] text-gray-700">발판을 밟고 끝없이 올라가요 · 100m당 1 에바뛰</span>
              </button>
              <button className="win95-button self-center px-6" onClick={() => setIsGameMenuOpen(false)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {hasMyCharacter && <MiniGameRun isOpen={isRunGameOpen} onClose={() => setIsRunGameOpen(false)} myCharacter={myCharacter} onAddJumps={onAddJumps} onUpdateBestScore={onUpdateBestScore} />}
      {hasMyCharacter && <MiniGameRoofBreaker isOpen={isRoofGameOpen} onClose={() => setIsRoofGameOpen(false)} myCharacter={myCharacter} onAddJumps={onAddJumps} onUpdateBestScore={onUpdateBestScore} />}
    </div>
  );
}
