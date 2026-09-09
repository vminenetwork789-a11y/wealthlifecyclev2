'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/wallet-context';
import { matrixContract } from '../lib/mock-contract';
import { CONTRACT_ADDRESS, CONTRACT_OWNER, USDT_ADDRESS, BSC_CONFIG } from '../lib/contracts-config';
import { fetchContractUsdtBalance } from '../lib/web3-service';
import { RankLevel } from '../lib/types';
import { 
  ShieldAlert, 
  Ghost, 
  Zap, 
  RotateCcw, 
  CheckCircle2, 
  Bot, 
  Radio, 
  Coins, 
  Database,
  Loader2,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Lock,
  Unlock,
  UploadCloud,
  DollarSign,
  RefreshCw,
  ArrowDownToLine,
  Download,
  Server,
  Copy,
  CheckCheck,
  Wrench,
  Power,
  Globe,
  Activity,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';
import { MaintenanceModal } from './MaintenanceModal';
import { 
  downloadMysqlDumpFile, 
  generateMysqlDumpSql, 
  MYSQL_SCHEMA_DDL 
} from '../lib/mysql-export';

export const AdminPanel: React.FC = () => {
  const { 
    lang, 
    t, 
    contractState, 
    isBotActive, 
    isLiveWeb3,
    txPending,
    toggleBotTraffic, 
    runSimulationOnce,
    showToast,
    activeAccount,
    currentUser,
    walletIds,
    onChainContractData,
    processRebornOnChain,
    spawnGhostPushesOnChain,
    setPauseOnChain,
    lockMigrationOnChain,
    emergencyWithdrawOnChain,
    batchMigrateUsersOnChain,
    batchMigrateGlobalQueuesOnChain,
    adminSetQueueHeadOnChain,
    renewIdOnChain,
    resetEntireSystem,
    setActiveTab,
    systemStatus,
    setSystemStatus
  } = useWallet();

  const [batchSize, setBatchSize] = useState<number>(2);
  const [spawnRank, setSpawnRank] = useState<RankLevel>(2);
  const [ghostCount, setGhostCount] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpawning, setIsSpawning] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isLockingMigration, setIsLockingMigration] = useState(false);
  
  // Admin Set Queue Head state
  const [queueHeadRank, setQueueHeadRank] = useState<2 | 3>(2);
  const [newQueueHeadIndex, setNewQueueHeadIndex] = useState<string>('0');
  const [isSettingQueueHead, setIsSettingQueueHead] = useState<boolean>(false);

  // Admin Manual ID Renewal state
  const [adminRenewUserId, setAdminRenewUserId] = useState<string>('');
  const [isRenewingId, setIsRenewingId] = useState<boolean>(false);

  // Admin Batch Migrate Global Queues state
  const [queueMigrationJson, setQueueMigrationJson] = useState<string>('');
  const [isMigratingQueues, setIsMigratingQueues] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [withdrawToken, setWithdrawToken] = useState<string>(USDT_ADDRESS);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [selectedTokenType, setSelectedTokenType] = useState<'usdt' | 'custom'>('usdt');
  const [contractUsdtBalance, setContractUsdtBalance] = useState<number>(0);
  const [isLoadingContractBalance, setIsLoadingContractBalance] = useState<boolean>(false);
  const [showMaintenancePreview, setShowMaintenancePreview] = useState<boolean>(false);
  const [migrationJson, setMigrationJson] = useState<string>('');

  // MySQL Sync and Export States in Admin Panel
  const [isSyncingMysql, setIsSyncingMysql] = useState(false);
  const [copiedMysqlSql, setCopiedMysqlSql] = useState(false);
  const [mysqlResultMsg, setMysqlResultMsg] = useState<string | null>(null);

  const handleAdminExportMysql = () => {
    try {
      const events = matrixContract.getContractEvents();
      downloadMysqlDumpFile(events, `wealthlifecycle_admin_events_${Date.now()}.sql`);
      showToast(
        lang === 'th' ? 'ดาวน์โหลด SQL สำเร็จ' : 'MySQL SQL Exported',
        lang === 'th' ? `สร้างไฟล์ Dump จำนวน ${events.length} Events เรียบร้อย` : `Exported ${events.length} events to .sql file`,
        'success'
      );
    } catch {
      showToast('Export Error', 'Failed to generate MySQL dump', 'info');
    }
  };

  const handleAdminCopyMysql = () => {
    try {
      const events = matrixContract.getContractEvents();
      const sql = generateMysqlDumpSql(events);
      navigator.clipboard.writeText(sql);
      setCopiedMysqlSql(true);
      setTimeout(() => setCopiedMysqlSql(false), 2000);
      showToast(
        lang === 'th' ? 'คัดลอก SQL แล้ว' : 'SQL Copied',
        lang === 'th' ? 'พร้อมวางใน phpMyAdmin หรือ MySQL CLI' : 'Ready to paste into MySQL',
        'success'
      );
    } catch {
      showToast('Copy Error', 'Failed to copy SQL script', 'info');
    }
  };

  const handleAdminSyncMysql = async () => {
    setIsSyncingMysql(true);
    setMysqlResultMsg(null);
    try {
      const events = matrixContract.getContractEvents();
      const res = await fetch('/api/events/mysql-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
      const data = await res.json();
      if (data.success) {
        setMysqlResultMsg(data.message);
        showToast(
          lang === 'th' ? 'ซิงค์ MySQL สำเร็จ' : 'MySQL Sync Completed',
          data.message,
          'success'
        );
      } else {
        showToast('Sync Error', data.error || 'Failed to sync with MySQL', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      showToast('MySQL Error', msg, 'info');
    } finally {
      setIsSyncingMysql(false);
    }
  };

  const loadContractUsdtBalance = async () => {
    setIsLoadingContractBalance(true);
    try {
      if (isLiveWeb3) {
        const bal = await fetchContractUsdtBalance();
        setContractUsdtBalance(bal);
      } else {
        const poolBal = contractState.stats.rebornPoolUSDT || 0;
        setContractUsdtBalance(poolBal);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingContractBalance(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchBalance = async () => {
      try {
        if (isLiveWeb3) {
          const bal = await fetchContractUsdtBalance();
          if (isMounted) setContractUsdtBalance(bal);
        } else {
          const poolBal = contractState.stats.rebornPoolUSDT || 0;
          if (isMounted) setContractUsdtBalance(poolBal);
        }
      } catch {
        // Fallback
      }
    };
    void fetchBalance();
    return () => {
      isMounted = false;
    };
  }, [isLiveWeb3, contractState.stats.rebornPoolUSDT]);

  const isOwner = Boolean(
    activeAccount?.id === 1 ||
    currentUser?.id === 1 ||
    activeAccount?.isOwner === true ||
    (activeAccount?.address && activeAccount.address.toLowerCase() === CONTRACT_OWNER.toLowerCase()) ||
    (onChainContractData?.owner && activeAccount?.address && activeAccount.address.toLowerCase() === onChainContractData.owner.toLowerCase()) ||
    (walletIds && walletIds.includes(1))
  );

  const handleProcessReborn = async () => {
    setIsProcessing(true);
    if (isLiveWeb3) {
      await processRebornOnChain(batchSize);
    } else {
      await new Promise(r => setTimeout(r, 800));
      const result = matrixContract.processReborn(batchSize);
      if (result.success) {
        showToast(
          lang === 'th' ? '⚡ ประมวลผล Reborn สำเร็จ!' : '⚡ Reborn Queue Processed!',
          lang === 'th' ? `สร้างรหัสผี ${result.ghostsCreated} รหัส ดันคิวผู้เล่นขึ้นสำเร็จ` : `Spawned ${result.ghostsCreated} Ghost accounts from Reborn Reserve`,
          'ghost'
        );
      }
    }
    setIsProcessing(false);
  };

  const handleSpawnGhosts = async () => {
    setIsSpawning(true);
    if (isLiveWeb3) {
      await spawnGhostPushesOnChain(spawnRank, ghostCount);
    } else {
      await new Promise(r => setTimeout(r, 800));
      const result = matrixContract.spawnGhosts(spawnRank, ghostCount, 'Admin Manual Injection');
      if (result.success) {
        showToast(
          lang === 'th' ? '👻 เสกผีเข้าสู่ระบบสำเร็จ!' : '👻 Ghosts Injected!',
          lang === 'th' ? `ฉีด ${result.spawnedCount} รหัสผีเข้าสู่ Rank ${spawnRank} เรียบร้อยแล้ว` : `Injected ${result.spawnedCount} Ghost accounts into Rank ${spawnRank}`,
          'ghost'
        );
      }
    }
    setIsSpawning(false);
  };

  const handleTogglePause = async (newPauseState: boolean) => {
    setIsPausing(true);
    if (isLiveWeb3) {
      await setPauseOnChain(newPauseState);
    } else {
      await new Promise(r => setTimeout(r, 500));
      showToast(
        lang === 'th' ? 'สถานะสัญญาถูกเปลี่ยน' : 'Contract Pause Updated',
        newPauseState ? 'Contract Paused' : 'Contract Resumed',
        'info'
      );
    }
    setIsPausing(false);
  };

  const handleSetSystemStatus = async (newStatus: 'online' | 'maintenance') => {
    setIsUpdatingStatus(true);
    setSystemStatus(newStatus);
    
    // Automatically manage contract pause when switching system status in Live Web3 (optional sync)
    if (newStatus === 'online') {
      showToast(
        lang === 'th' ? '🟢 ได้เปิดระบบให้ทุกท่านใช้งานแล้ว!' : '🟢 System Is Now Live For Everyone!',
        lang === 'th' 
          ? 'เปิดใช้งานระบบตามปกติ สมาชิกทุกท่านสามารถเข้าใช้งาน สมัคร และทำรายการได้ 100%' 
          : 'System is open and fully operational for all members.',
        'reward'
      );
    } else {
      showToast(
        lang === 'th' ? '🛠️ ปิดปรับปรุงระบบเรียบร้อย!' : '🛠️ Maintenance Mode Enabled!',
        lang === 'th' 
          ? 'ระบบเข้าสู่โหมดปรับปรุง สมาชิกจะเห็นหน้าแจ้งเตือนการบำรุงรักษา' 
          : 'Maintenance mode is active. Members will see the maintenance notification.',
        'info'
      );
    }
    setIsUpdatingStatus(false);
  };

  const handleLockMigration = async () => {
    if (!window.confirm(lang === 'th' ? 'คุณแน่ใจหรือไม่ที่จะล็อค Migration ถาวร? การกระทำนี้ไม่สามารถย้อนกลับได้' : 'Are you sure you want to permanently lock migration? This cannot be undone.')) {
      return;
    }
    setIsLockingMigration(true);
    await lockMigrationOnChain();
    setIsLockingMigration(false);
  };

  const handleEmergencyWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawToken || !withdrawAmount) {
      showToast('Error', 'Please fill token address and amount', 'info');
      return;
    }
    setIsWithdrawing(true);
    await emergencyWithdrawOnChain(withdrawToken, withdrawAmount);
    setIsWithdrawing(false);
  };

  const handleBatchMigrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(migrationJson);
      if (!Array.isArray(data) || data.length === 0) {
        showToast('Error', 'Invalid JSON array of users', 'info');
        return;
      }
      setIsMigrating(true);
      const params = {
        ids: data.map((u: { id: number }) => Number(u.id)),
        wallets: data.map((u: { wallet?: string; address?: string }) => String(u.wallet || u.address)),
        sponsorIds: data.map((u: { sponsorId: number }) => Number(u.sponsorId || 1)),
        placementIds: data.map((u: { placementId: number }) => Number(u.placementId || 0)),
        isGhosts: data.map((u: { isGhost: boolean }) => Boolean(u.isGhost)),
        isAutoReborns: data.map((u: { isAutoReborn?: boolean }) => Boolean(u.isAutoReborn ?? true)),
        totalEarneds: data.map((u: { totalEarned?: number | string }) => String(u.totalEarned || 0)),
        expiresAts: data.map((u: { expiresAt?: number | string }) => Number(u.expiresAt || 0)),
      };
      await batchMigrateUsersOnChain(params);
      setIsMigrating(false);
    } catch {
      showToast('JSON Error', 'Invalid JSON format for migration', 'info');
      setIsMigrating(false);
    }
  };

  const handleSetQueueHeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headIdx = parseInt(newQueueHeadIndex, 10);
    if (isNaN(headIdx) || headIdx < 0) {
      showToast('Validation Error', 'Head index must be a non-negative integer', 'info');
      return;
    }
    setIsSettingQueueHead(true);
    await adminSetQueueHeadOnChain(queueHeadRank, headIdx);
    setIsSettingQueueHead(false);
  };

  const handleAdminRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = parseInt(adminRenewUserId, 10);
    if (!uid || uid <= 0) {
      showToast('Validation Error', 'Please enter a valid User ID', 'info');
      return;
    }
    setIsRenewingId(true);
    await renewIdOnChain(uid);
    setIsRenewingId(false);
  };

  const handleBatchMigrateQueuesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueMigrationJson.trim()) return;
    try {
      const data = JSON.parse(queueMigrationJson);
      if (!Array.isArray(data)) {
        showToast('Error', 'Invalid JSON array of queue entries', 'info');
        return;
      }
      setIsMigratingQueues(true);
      const formatted = data.map((item: {
        rank: number;
        userId: number;
        isAutoReborn?: boolean;
        isGhost?: boolean;
        slotsFilled?: number;
        downlineUserIds?: number[];
      }) => ({
        rank: Number(item.rank || 2),
        userId: Number(item.userId),
        isAutoReborn: Boolean(item.isAutoReborn ?? true),
        isGhost: Boolean(item.isGhost ?? false),
        slotsFilled: Number(item.slotsFilled || 0),
        downlineUserIds: Array.isArray(item.downlineUserIds) ? item.downlineUserIds.map(Number) : []
      }));
      await batchMigrateGlobalQueuesOnChain(formatted);
      setIsMigratingQueues(false);
    } catch {
      showToast('JSON Error', 'Invalid JSON format for queue migration', 'info');
      setIsMigratingQueues(false);
    }
  };

  const handleResetContract = () => {
    resetEntireSystem();
  };

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl glass border border-rose-500/40 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            {lang === 'th' ? 'สงวนสิทธิ์เฉพาะกระเป๋าที่ 1 (Owner)' : 'Restricted to Wallet #1 (Owner)'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {lang === 'th'
              ? 'ระบบแอดมินสำหรับผู้ดูแล Smart Contract และกระเป๋าแม่ข่ายลำดับที่ 1 เท่านั้น'
              : 'Admin panel and smart contract management is reserved exclusively for Contract Owner / Wallet #1.'}
          </p>
        </div>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition"
        >
          {lang === 'th' ? 'กลับไปยังแดชบอร์ด' : 'Back to Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-amber-950/20 border border-amber-500/40 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {t.adminTitle}
                </h1>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  {isLiveWeb3 ? 'BSC ON-CHAIN OWNER' : 'SANDBOX SIMULATOR'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                {t.adminSub}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">Contract Owner</span>
            <a
              href={`${BSC_CONFIG.blockExplorerUrls[0]}/address/${CONTRACT_OWNER}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono font-bold text-amber-400 hover:underline flex items-center justify-end gap-1"
            >
              {CONTRACT_OWNER.slice(0, 6)}...{CONTRACT_OWNER.slice(-4)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Admin Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tool 1: Process Reborn (รันคิวเกิดใหม่) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-purple-500/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t.processRebornTitle}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300">
                ${contractState.stats.rebornPoolUSDT.toFixed(1)} USDT Pool
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {t.processRebornDesc}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span>{t.batchSize}</span>
                  <span className="font-bold text-purple-400 font-mono">{batchSize} Ghosts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{lang === 'th' ? 'ค่าใช้จ่ายประมวลผล (2 USDT/Ghost)' : 'Liquidity Cost (2 USDT/Ghost)'}</span>
                <span className="font-mono font-bold text-white">${(batchSize * 2).toFixed(1)} USDT</span>
              </div>
            </div>
          </div>

          <button
            id="btn_admin_run_reborn"
            onClick={handleProcessReborn}
            disabled={isProcessing || txPending}
            className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20 active:scale-95 disabled:opacity-50"
          >
            {isProcessing || txPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isLiveWeb3 ? 'Executing processRebornQueue on BSC...' : 'Processing Reborn Queue...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>{t.btnRunReborn} ({batchSize} Ghosts)</span>
              </>
            )}
          </button>
        </div>

        {/* Tool 2: Spawn Ghosts (แอดมินเสกผีดันคิว) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-sky-500/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                  <Ghost className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {t.spawnGhostTitle}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-sky-300">
                {isLiveWeb3 ? 'adminSpawnGhostPushes' : 'Direct Simulation'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {t.spawnGhostDesc}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-slate-300 block mb-2 font-bold flex items-center justify-between">
                  <span>{t.selectRank}</span>
                  <span className="text-[10px] text-sky-400 font-mono">
                    {spawnRank === 1 
                      ? (lang === 'th' ? 'ต้นไม้เมทริกซ์ (Reborn 2 USDT)' : 'Matrix Tree / Reborn (2 USDT)')
                      : spawnRank === 2
                      ? (lang === 'th' ? 'คิวสากล Rank 2 (Silver Queue 4 USDT)' : 'Global FIFO Silver Queue (4 USDT)')
                      : (lang === 'th' ? 'กระดานทอง Rank 3 (Gold Board 8 USDT)' : 'Global FIFO Gold Board (8 USDT)')}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { rank: 1, label: 'Rank 1', descTh: '2 USDT Tree', descEn: '2 USDT Tree' },
                    { rank: 2, label: 'Rank 2', descTh: 'Silver 4 USDT', descEn: 'Silver 4 USDT' },
                    { rank: 3, label: 'Rank 3', descTh: 'Gold 8 USDT', descEn: 'Gold 8 USDT' }
                  ].map((item) => (
                    <button
                      key={item.rank}
                      type="button"
                      onClick={() => setSpawnRank(item.rank as RankLevel)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center ${
                        spawnRank === item.rank 
                          ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-900/30' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-black">{item.label}</span>
                      <span className={`text-[9px] font-mono mt-0.5 ${spawnRank === item.rank ? 'text-slate-900 font-semibold' : 'text-slate-300'}`}>
                        {lang === 'th' ? item.descTh : item.descEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                  <span>{t.ghostCount}</span>
                  <span className="font-bold text-sky-400 font-mono">{ghostCount} Ghosts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={ghostCount}
                  onChange={(e) => setGhostCount(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex justify-between text-[10px] text-slate-300 font-mono mt-1">
                  <span>1 Ghost</span>
                  <span>4 Ghosts</span>
                  <span>8 Ghosts</span>
                  <span>12 Ghosts</span>
                </div>
              </div>
            </div>
          </div>

          <button
            id="btn_admin_spawn_ghosts"
            onClick={handleSpawnGhosts}
            disabled={isSpawning || txPending}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition disabled:opacity-50"
          >
            {isSpawning || txPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isLiveWeb3 ? 'Broadcasting to BSC...' : 'Spawning Ghosts...'}</span>
              </>
            ) : (
              <>
                <Ghost className="w-4 h-4" />
                <span>{t.btnSpawnGhosts} ({ghostCount} Ghosts)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Contract Emergency Pause & Bot Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contract Pause Toggle (On-Chain) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">
                {lang === 'th' ? 'ควบคุมสถานะ Smart Contract (setPause)' : 'Smart Contract Circuit Breaker'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              {lang === 'th' 
                ? 'หยุดพักหรือเปิดใช้งานการลงทะเบียนและฟังก์ชันทั้งหมดของ Smart Contract ในกรณีฉุกเฉิน' 
                : 'Pause or resume contract registration and transactions in emergency scenarios.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleTogglePause(false)}
              disabled={isPausing || txPending}
              className="py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Unlock className="w-4 h-4" />
              <span>Resume (Active)</span>
            </button>
            <button
              onClick={() => handleTogglePause(true)}
              disabled={isPausing || txPending}
              className="py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Pause (Lock)</span>
            </button>
          </div>
        </div>

        {/* Bot Simulation Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">
                {lang === 'th' ? 'ระบบจำลองการทำงาน (Simulation Execution)' : t.botSimulationTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              {lang === 'th' 
                ? 'เลือกให้ระบบประมวลผลจำลองทีละ 1 ครั้งตามคำสั่ง (Single Run) หรือเปิดรันต่อเนื่องอัตโนมัติ' 
                : t.botSimulationDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              id="btn_admin_sim_once"
              onClick={runSimulationOnce}
              className="w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 active:scale-95 shadow-sm"
            >
              <Zap className="w-4 h-4 text-sky-400" />
              <span>{lang === 'th' ? '⚡ ทำงาน 1 ครั้ง (Run 1 Step)' : '⚡ Run Single Step'}</span>
            </button>

            <button
              id="btn_admin_bot_toggle"
              onClick={toggleBotTraffic}
              className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                isBotActive
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <Radio className={`w-4 h-4 ${isBotActive ? 'animate-ping text-rose-400' : 'text-emerald-400'}`} />
              <span>{isBotActive ? t.btnStopBot : t.btnStartBot}</span>
            </button>
          </div>
        </div>

      </div>

      {/* System Status & Maintenance Control Card */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col justify-between transition-all ${
        systemStatus === 'online'
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border-amber-500/40 shadow-amber-950/20'
      }`}>
        <div>
          {/* Header & Status Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-md transition-colors ${
                systemStatus === 'online'
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-emerald-500/20'
                  : 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-amber-500/20'
              }`}>
                {systemStatus === 'online' ? <Globe className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <span>{lang === 'th' ? 'ระบบควบคุมสถานะเว็บไซต์ (System Status)' : 'System Status Control'}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {lang === 'th' ? 'สลับโหมดเปิดระบบปกติ หรือเข้าสู่โหมดปิดปรับปรุง' : 'Switch between Live Online and Maintenance Mode'}
                </p>
              </div>
            </div>

            {/* Current Status Badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${
                systemStatus === 'online'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-400/30'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-400/30'
              }`}>
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    systemStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    systemStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </span>
                <span>
                  {systemStatus === 'online'
                    ? (lang === 'th' ? '🟢 สถานะ: ได้เปิดระบบให้ทุกท่านใช้งานแล้ว (ONLINE)' : '🟢 Status: LIVE FOR EVERYONE')
                    : (lang === 'th' ? '🛠️ สถานะ: ปิดปรับปรุง (MAINTENANCE)' : '🛠️ Status: MAINTENANCE')}
                </span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-5">
            {systemStatus === 'online'
              ? (lang === 'th'
                  ? 'ขณะนี้ได้เปิดระบบให้ทุกท่านใช้งานแล้ว สมาชิกทุกคนสามารถสมัครสมาชิก ผูกสายงาน ดูผัง และทำธุรกรรมบน Smart Contract ได้ 100% โดยไม่มีป๊อปอัปแจ้งปรับปรุงรบกวน'
                  : 'The system is LIVE for everyone. All registration, matrix viewing, and smart contract transactions are running smoothly.')
              : (lang === 'th'
                  ? 'ขณะนี้ระบบอยู่ในโหมดปิดปรับปรุง สมาชิกที่เข้าสู่เว็บไซต์จะเห็นป๊อปอัปแจ้งเตือนการบำรุงรักษา พร้อมปุ่มตรวจสอบสัญญาบน BscScan'
                  : 'The system is currently in MAINTENANCE mode. Visitors will see the maintenance notice overlay with BscScan contract verification.')}
          </p>

          {/* Primary Action Buttons: Open System & Set Maintenance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
            {/* Button 1: Open System (เปิดระบบ) */}
            <button
              id="btn_admin_open_system"
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleSetSystemStatus('online')}
              className={`p-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                systemStatus === 'online'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/60 shadow-emerald-600/30 ring-2 ring-emerald-500/50'
                  : 'bg-slate-800/90 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300'
              }`}
            >
              <Power className={`w-4 h-4 ${systemStatus === 'online' ? 'text-white' : 'text-emerald-400'}`} />
              <div className="text-left">
                <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                  <span>{lang === 'th' ? '🟢 ได้เปิดระบบให้ทุกท่านใช้งานแล้ว' : '🟢 Open System (Live)'}</span>
                  {systemStatus === 'online' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white font-mono">ACTIVE</span>
                  )}
                </div>
                <div className="text-[10px] opacity-80 font-normal">
                  {lang === 'th' ? 'เปิดให้สมาชิกทุกท่านใช้งานได้ตามปกติ 100%' : 'Enable full public access'}
                </div>
              </div>
            </button>

            {/* Button 2: Maintenance Mode (ปิดปรับปรุง) */}
            <button
              id="btn_admin_close_maintenance"
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleSetSystemStatus('maintenance')}
              className={`p-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-95 ${
                systemStatus === 'maintenance'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border border-amber-400/60 shadow-amber-600/30 ring-2 ring-amber-500/50'
                  : 'bg-slate-800/90 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300'
              }`}
            >
              <Wrench className={`w-4 h-4 ${systemStatus === 'maintenance' ? 'text-white' : 'text-amber-400'}`} />
              <div className="text-left">
                <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                  <span>{lang === 'th' ? '🛠️ ปิดปรับปรุง (Maintenance)' : '🛠️ Close for Maintenance'}</span>
                  {systemStatus === 'maintenance' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white font-mono">ACTIVE</span>
                  )}
                </div>
                <div className="text-[10px] opacity-80 font-normal">
                  {lang === 'th' ? 'แจ้งเตือนปรับปรุงระบบแก่สมาชิก' : 'Display maintenance notice'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Secondary Tool Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMaintenancePreview(true)}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'th' ? 'ทดสอบดูป๊อปอัปแจ้งปรับปรุง' : 'Preview Maintenance Modal'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem('wealthlifecycle_maintenance_dismissed');
                  localStorage.removeItem('wealthlifecycle_maintenance_dismissed_until');
                  showToast(
                    lang === 'th' ? 'รีเซ็ตแคชการแจ้งเตือนแล้ว' : 'Dismiss Cache Reset',
                    lang === 'th' ? 'ป๊อปอัปแจ้งเตือนจะแสดงผลใหม่อีกครั้ง' : 'Maintenance popup will trigger again',
                    'info'
                  );
                } catch {
                  // Ignore
                }
              }}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'th' ? 'รีเซ็ตการจำ (แสดงใหม่)' : 'Reset Dismiss Cache'}</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            {lang === 'th' ? 'การตั้งค่ามีผลทันทีทั้งระบบ' : 'Applied instantly in real-time'}
          </span>
        </div>
      </div>

      {/* Migration & Emergency Recovery Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Migration Manager */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'th' ? 'ย้ายข้อมูลผู้ใช้ (batchMigrateUsers)' : 'User Data Migration'}
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                onChainContractData?.isMigrationLocked 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {onChainContractData?.isMigrationLocked ? 'Migration Locked' : 'Migration Open'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {lang === 'th'
                ? 'นำเข้าชุดข้อมูลโครงข่ายผู้ใช้งานจากระบบเดิมเข้าสู่ Smart Contract ใหม่แบบ Batch'
                : 'Batch migrate existing matrix users and tree data into the new Smart Contract on BSC.'}
            </p>

            <form onSubmit={handleBatchMigrationSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-mono">
                  JSON Data Array: [{`{"id": 1, "wallet": "0x...", "sponsorId": 0, "placementId": 0, "isGhost": false, "isAutoReborn": true, "totalEarned": "0"}`}]
                </label>
                <textarea
                  rows={4}
                  value={migrationJson}
                  onChange={(e) => setMigrationJson(e.target.value)}
                  placeholder='[{"id": 2, "wallet": "0x...", "sponsorId": 1, "placementId": 1, "isGhost": false, "isAutoReborn": true, "totalEarned": "0"}]'
                  disabled={Boolean(onChainContractData?.isMigrationLocked) || isMigrating || txPending}
                  className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={Boolean(onChainContractData?.isMigrationLocked) || isMigrating || txPending || !migrationJson.trim()}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  <span>{lang === 'th' ? 'ส่งคำสั่งย้ายข้อมูล' : 'Execute Batch Migration'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLockMigration}
                  disabled={Boolean(onChainContractData?.isMigrationLocked) || isLockingMigration || txPending}
                  className="py-3 px-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {isLockingMigration ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>{lang === 'th' ? 'ล็อคถาวร' : 'Lock Permanently'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Emergency Token Withdrawal */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-rose-500/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'th' ? 'ถอนเหรียญฉุกเฉิน (emergencyWithdraw)' : 'Emergency Token Withdrawal'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">
                Owner Only
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {lang === 'th'
                ? 'ถอนเหรียญ USDT (BEP-20) หรือโทเค็น BEP-20 อื่นๆ ออกจาก Smart Contract เข้าสู่กระเป๋า Owner โดยตรง'
                : 'Emergency withdrawal of USDT (BEP-20) or any BEP-20 tokens directly from the Smart Contract to the Owner wallet.'}
            </p>

            {/* Contract USDT Holdings Badge */}
            <div className="p-3 mb-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {lang === 'th' ? 'ยอด USDT คงเหลือใน Smart Contract' : 'Contract USDT Balance'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {contractUsdtBalance.toFixed(2)} USDT
                  </span>
                  {contractUsdtBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(contractUsdtBalance.toString())}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold transition"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={loadContractUsdtBalance}
                disabled={isLoadingContractBalance}
                title="Refresh Contract USDT Balance"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingContractBalance ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* Token Type Selector */}
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedTokenType('usdt');
                  setWithdrawToken(USDT_ADDRESS);
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedTokenType === 'usdt'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="w-3 h-3 text-emerald-400" />
                <span>USDT (BEP-20)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTokenType('custom');
                  if (withdrawToken === USDT_ADDRESS) setWithdrawToken('');
                }}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectedTokenType === 'custom'
                    ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                    : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-3 h-3 text-rose-400" />
                <span>{lang === 'th' ? 'เหรียญอื่น (Custom)' : 'Other Token'}</span>
              </button>
            </div>

            <form onSubmit={handleEmergencyWithdraw} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1">
                  {lang === 'th' ? 'แอดเดรสเหรียญ Token Contract' : 'Token Contract Address'}
                </label>
                <input
                  type="text"
                  value={withdrawToken}
                  onChange={(e) => {
                    setWithdrawToken(e.target.value);
                    if (e.target.value.toLowerCase() === USDT_ADDRESS.toLowerCase()) {
                      setSelectedTokenType('usdt');
                    } else {
                      setSelectedTokenType('custom');
                    }
                  }}
                  placeholder={USDT_ADDRESS}
                  className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-300 block">
                    {lang === 'th' ? 'จำนวนเงินที่ต้องการถอน (USDT / Token Amount)' : 'Amount to Withdraw'}
                  </label>
                  {contractUsdtBalance > 0 && selectedTokenType === 'usdt' && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(contractUsdtBalance.toString())}
                      className="text-[10px] text-emerald-400 hover:underline font-mono font-bold"
                    >
                      {lang === 'th' ? 'ใช้ยอดทั้งหมด' : 'Use Max'} ({contractUsdtBalance.toFixed(2)})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 10.0"
                    className="w-full p-2.5 pr-16 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                    {selectedTokenType === 'usdt' ? 'USDT' : 'TOKEN'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isWithdrawing || txPending || !withdrawToken || !withdrawAmount || Number(withdrawAmount) <= 0}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-rose-950/30"
              >
                {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                <span>{lang === 'th' ? 'ยืนยันถอนเงินฉุกเฉินเข้ากระเป๋า Owner' : 'Emergency Withdraw to Owner Wallet'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Global Queue Head & ID Renewal Management (New Smart Contract Functions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Set Queue Head (adminSetQueueHead) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-sky-500/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {lang === 'th' ? 'ตั้งค่าหัวคิว (adminSetQueueHead)' : 'Set Queue Head Pointer'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400">
                Owner Only
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {lang === 'th'
                ? 'ปรับเปลี่ยนตำแหน่งหัวคิว (Head Pointer) ของ Rank 2 Silver หรือ Rank 3 Gold เพื่อการจัดคิวหรือการทดสอบระบบ'
                : 'Directly adjust the queue head index pointer for Rank 2 or Rank 3 queues on BSC smart contract.'}
            </p>

            <form onSubmit={handleSetQueueHeadSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                    {lang === 'th' ? 'เลือกลำดับ Rank' : 'Select Rank'}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setQueueHeadRank(2)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        queueHeadRank === 2
                          ? 'bg-sky-500 text-slate-950 border-sky-400 font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Rank 2 Silver
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueHeadRank(3)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                        queueHeadRank === 3
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Rank 3 Gold
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                    {lang === 'th' ? 'ดัชนีหัวคิวใหม่ (Head Index)' : 'New Head Index'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newQueueHeadIndex}
                    onChange={(e) => setNewQueueHeadIndex(e.target.value)}
                    placeholder="0"
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSettingQueueHead || txPending}
                className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-sky-950/40"
              >
                {isSettingQueueHead ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>{lang === 'th' ? `บันทึกหัวคิว Rank ${queueHeadRank} -> ดัชนี ${newQueueHeadIndex}` : `Set Rank ${queueHeadRank} Head Index`}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Manual ID Renewal (renewId) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {lang === 'th' ? 'ต่ออายุสมาชิก (renewId)' : 'Manual ID Renewal'}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                On-Chain Service
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {lang === 'th'
                ? 'ต่ออายุสถานะของรหัสสมาชิก เพิ่มเวลาการใช้งาน 7 วัน (RANK1_DURATION) บน Smart Contract'
                : 'Manually trigger renewId(userId) to extend active lifespan for +7 days on smart contract.'}
            </p>

            <form onSubmit={handleAdminRenewSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-bold">
                  {lang === 'th' ? 'ระบุรหัสสมาชิกที่ต้องการต่ออายุ (User ID)' : 'Target User ID to Renew'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={adminRenewUserId}
                    onChange={(e) => setAdminRenewUserId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  {walletIds && walletIds.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                      <span className="text-[10px] text-slate-400">My IDs:</span>
                      {walletIds.slice(0, 5).map(wid => (
                        <button
                          key={wid}
                          type="button"
                          onClick={() => setAdminRenewUserId(String(wid))}
                          className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                        >
                          #{wid}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isRenewingId || txPending || !adminRenewUserId}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-emerald-950/40"
              >
                {isRenewingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                <span>{lang === 'th' ? `ต่ออายุรหัส #${adminRenewUserId || '?'} (+7 วัน)` : `Renew ID #${adminRenewUserId || '?'} (+7 Days)`}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* MySQL Events Database Sync & Backup Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/40 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {lang === 'th' ? 'นำข้อมูล Events ไปยังฐานข้อมูล MySQL' : 'MySQL Contract Events Database Sync'}
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  wealthlifecycle_db
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'th'
                  ? 'ส่งออกและสำรองข้อมูลเหตุการณ์ Smart Contract ทั้งหมด (Registration, Payouts, Reborn, Upgrades) ลงในฐานข้อมูล MySQL'
                  : 'Export and sync all smart contract event logs directly into MySQL relational database.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              {lang === 'th' ? 'พร้อมส่งออก:' : 'Events Count:'}{' '}
              <strong className="text-emerald-400">{matrixContract.getContractEvents().length}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleAdminExportMysql}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition shadow-lg shadow-emerald-950/40"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'th' ? 'ดาวน์โหลดไฟล์ .SQL (MySQL Dump)' : 'Export MySQL .SQL File'}</span>
          </button>

          <button
            onClick={handleAdminCopyMysql}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs font-mono transition"
          >
            {copiedMysqlSql ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">{lang === 'th' ? 'คัดลอก SQL แล้ว!' : 'Copied SQL!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-sky-400" />
                <span>{lang === 'th' ? 'คัดลอกคำสั่ง INSERT (SQL)' : 'Copy SQL Queries'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleAdminSyncMysql}
            disabled={isSyncingMysql}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono transition shadow-lg shadow-sky-950/40 disabled:opacity-50"
          >
            <Server className={`w-4 h-4 ${isSyncingMysql ? 'animate-spin' : ''}`} />
            <span>{isSyncingMysql ? 'Syncing...' : (lang === 'th' ? 'ซิงค์เข้า MySQL (API)' : 'Sync to MySQL API')}</span>
          </button>
        </div>

        {mysqlResultMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{mysqlResultMsg}</span>
          </div>
        )}
      </div>

      {/* Maintenance Modal Preview for Admin */}
      <MaintenanceModal
        isOpen={showMaintenancePreview}
        onClose={() => setShowMaintenancePreview(false)}
      />

    </div>
  );
};

