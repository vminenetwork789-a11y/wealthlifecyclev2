'use client';

import React, { useState } from 'react';
import { useWallet } from '../lib/wallet-context';
import { CONTRACT_ADDRESS, BSC_CONFIG } from '../lib/contracts-config';
import { getSafeOrigin, copyToClipboardSafe } from '../lib/utils';
import { 
  X, 
  Wallet, 
  ExternalLink,
  Loader2,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ isOpen, onClose }) => {
  const { 
    connectInjectedWeb3Wallet, 
    lang, 
    txPending,
    showToast
  } = useWallet();

  const [isConnectingWeb3, setIsConnectingWeb3] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleConnectRealWeb3 = async (walletName: string = 'Injected') => {
    setSelectedWallet(walletName);
    setIsConnectingWeb3(true);
    const success = await connectInjectedWeb3Wallet(walletName);
    setIsConnectingWeb3(false);
    setSelectedWallet(null);
    if (success) {
      onClose();
    }
  };

  const handleOpenTokenPocketMobile = () => {
    try {
      const currentUrl = getSafeOrigin();
      const tpDeepLink = `tpdapp://open?params=${encodeURIComponent(JSON.stringify({ url: currentUrl, chain: 'BSC' }))}`;
      
      // Try opening TokenPocket app deep link
      if (typeof window !== 'undefined') {
        window.location.href = tpDeepLink;
      }
    } catch {
      // Suppress cross-origin frame or deep link error
    }

    showToast(
      lang === 'th' ? '👛 กำลังเปิดแอป TokenPocket...' : '👛 Opening TokenPocket App...',
      lang === 'th' ? 'หากระบบไม่เปิดอัตโนมัติ ให้คัดลอกลิงก์ไปวางในแท็บ DApp / ค้นหา ของแอป TokenPocket' : 'If app does not open automatically, copy the URL and paste in TokenPocket DApp browser.',
      'info'
    );
  };

  const handleCopyCurrentUrl = async () => {
    const safeUrl = getSafeOrigin();
    const ok = await copyToClipboardSafe(safeUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      showToast(
        lang === 'th' ? '📋 คัดลอกลิงก์ DApp แล้ว' : '📋 DApp URL Copied',
        lang === 'th' ? 'นำไปวางในช่องค้นหา / DApp Browser ในแอป TokenPocket ได้เลย' : 'Paste into TokenPocket DApp browser search bar.',
        'success'
      );
    }
  };

  const walletOptions = [
    {
      id: 'tokenpocket',
      name: 'TokenPocket',
      icon: '👛',
      desc: lang === 'th' ? 'รองรับ DApp Browser, BSC และกระเป๋าหลายเชนบนมือถือ & Extension' : 'Popular multi-chain Web3 wallet with DApp browser on iOS, Android & Extension',
      badge: 'POPULAR / TP',
      highlight: true
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      desc: lang === 'th' ? 'กระเป๋า Web3 ยอดนิยมบน Browser & มือถือ' : 'Popular EVM browser extension & mobile app',
      badge: 'POPULAR',
      highlight: false
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      icon: '🛡️',
      desc: lang === 'th' ? 'รองรับ DApp Browser บน iOS & Android' : 'Official Binance mobile & browser wallet',
      badge: 'RECOMMENDED',
      highlight: false
    },
    {
      id: 'binance',
      name: 'Binance Web3 Wallet',
      icon: '🟡',
      desc: lang === 'th' ? 'กระเป๋า Web3 ในแอป Binance โดยตรง' : 'Direct Web3 wallet inside Binance app',
      badge: 'BNB CHAIN',
      highlight: false
    },
    {
      id: 'okx',
      name: 'OKX / Bitget / Other EVM',
      icon: '🌐',
      desc: lang === 'th' ? 'กระเป๋า Web3 ทุกประเภทที่รองรับ EIP-1193' : 'Universal injected Web3 provider',
      badge: 'EVM',
      highlight: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div 
        id="connect_wallet_modal"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-sky-500/10 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          id="btn_close_modal"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {lang === 'th' ? 'เชื่อมต่อกระเป๋า Web3' : 'Connect Web3 Wallet'}
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                BSC MAINNET
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'th' 
                ? 'เลือกกระเป๋าเพื่อเชื่อมต่อกับสัญญาอัจฉริยะ WealthLifeCycle บน BNB Smart Chain (Chain ID: 56)' 
                : 'Connect live EVM wallet to interact with WealthLifeCycle Smart Contract'}
            </p>
          </div>
        </div>

        {/* Main Web3 Connection Cards */}
        <div className="space-y-2.5 mb-5">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              id={`btn_connect_${wallet.id}`}
              onClick={() => handleConnectRealWeb3(wallet.name)}
              disabled={isConnectingWeb3 || txPending}
              className={`w-full p-3.5 rounded-2xl border transition-all duration-200 group active:scale-98 text-left flex items-center justify-between ${
                wallet.highlight 
                  ? 'border-sky-500/40 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/30 hover:border-sky-400 hover:bg-sky-950/60 shadow-lg shadow-sky-950/30' 
                  : 'border-slate-800/90 bg-slate-950/60 hover:bg-slate-850 hover:border-sky-500/50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform ${
                  wallet.highlight 
                    ? 'bg-gradient-to-br from-sky-600/30 to-blue-600/30 border border-sky-400/40 text-sky-300' 
                    : 'bg-slate-800/80 border border-slate-700/60'
                }`}>
                  {wallet.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                      {wallet.name}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      wallet.highlight
                        ? 'bg-sky-500/20 border border-sky-400/30 text-sky-300'
                        : 'bg-slate-800 border border-slate-700 text-slate-300'
                    }`}>
                      {wallet.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wallet.desc}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-1.5 text-slate-400 group-hover:text-sky-400 transition-colors">
                {isConnectingWeb3 && selectedWallet === wallet.name ? (
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Mobile Device / TokenPocket Quick DeepLink Guide Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-900 border border-sky-500/30 mb-5 text-xs text-slate-300 space-y-3">
          <div className="flex items-start gap-2.5">
            <Smartphone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1 flex items-center gap-2">
                <span>{lang === 'th' ? '📱 วิธีใช้งานบนมือถือ (TokenPocket / Trust / MetaMask)' : '📱 Mobile DApp Usage Guide'}</span>
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {lang === 'th'
                  ? 'หากเปิดเว็บนี้ผ่านเบราว์เซอร์ปกติบนมือถือ (Safari/Chrome) ให้เปิดผ่านแอป TokenPocket โดยตรง หรือคัดลอกลิงก์ไปวางในช่องค้นหา / DApp Browser ในแอป'
                  : 'Open this link directly inside TokenPocket, MetaMask, or Trust Wallet integrated DApp browser for 1-click on-chain connection.'}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons for TokenPocket & URL Copy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <button
              id="btn_open_tokenpocket_deeplink"
              onClick={handleOpenTokenPocketMobile}
              className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>👛</span>
              <span>{lang === 'th' ? 'เปิดใน TokenPocket' : 'Open in TokenPocket'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn_copy_dapp_link"
              onClick={handleCopyCurrentUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{lang === 'th' ? 'คัดลอกสำเร็จ!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'th' ? 'คัดลอกลิงก์ DApp' : 'Copy DApp URL'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contract Info Footer */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-2.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-300 font-bold block">Smart Contract:</span>
              <span className="font-mono text-[10px] text-sky-400">
                {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
              </span>
            </div>
          </div>
          <a
            href={BSC_CONFIG.contractExplorerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[10px] shrink-0 mt-1"
          >
            BscScan <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </div>
  );
};

