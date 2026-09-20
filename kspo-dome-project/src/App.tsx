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

  /* Tailwind 화면 폭 판정과 관계없이 실제 터치 기기에서 이동 패드를 표시합니다. */
  .mobile-character-dpad {
    display: none;
    opacity: 0.68;
    transition: opacity 120ms ease, filter 120ms ease;
  }
  .mobile-character-dpad:active {
    opacity: 0.9;
    filter: brightness(1.06);
  }
  @media (max-width: 767px), (hover: none) and (pointer: coarse) {
    .mobile-character-dpad {
      display: block !important;
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
