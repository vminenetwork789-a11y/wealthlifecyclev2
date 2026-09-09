'use client';

import { useState, useEffect } from 'react';

/**
 * WealthLifeCycle Registration Launch Timer Configuration
 * 
 * Scheduled Launch Time: 30/08 (August 30, 2026) at 13:09:00 (UTC+7 / Bangkok Time)
 */
export const LAUNCH_DATE_ISO = '2026-08-30T13:09:00+07:00';
export const LAUNCH_TIMESTAMP = new Date(LAUNCH_DATE_ISO).getTime();

export interface LaunchTimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isLaunched: boolean;
  formattedCountdown: string;
}

export function calculateLaunchTimeLeft(targetTime: number = LAUNCH_TIMESTAMP): LaunchTimeLeft {
  const now = Date.now();
  const diff = targetTime - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      isLaunched: true,
      formattedCountdown: '00:00:00',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedCountdown = days > 0 
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    isLaunched: false,
    formattedCountdown,
  };
}

/**
 * Custom React Hook for Realtime Launch Countdown
 */
export function useLaunchCountdown(targetTime: number = LAUNCH_TIMESTAMP) {
  const [timeLeft, setTimeLeft] = useState<LaunchTimeLeft>(() => calculateLaunchTimeLeft(targetTime));

  useEffect(() => {
    // Immediate calculation via tick
    const updateTick = () => {
      setTimeLeft(calculateLaunchTimeLeft(targetTime));
    };

    updateTick();
    const interval = setInterval(updateTick, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return {
    ...timeLeft,
    launchDateFormattedTh: '30 ส.ค. เวลา 13:09 น. (UTC+7)',
    launchDateFormattedEn: 'Aug 30 at 13:09 (UTC+7)',
  };
}
