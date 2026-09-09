export type Language = 'th' | 'en';

export const translations = {
  th: {
    // Navigation
    navBrand: 'WEALTHLIFECYCLE',
    navTagline: 'ระบบเมทริกซ์ 3 ลำดับไร้รอยต่อ',
    navLanding: 'หน้าแรก',
    navDashboard: 'แดชบอร์ด',
    navMatrix: 'ผังเมทริกซ์',
    navAdmin: 'ระบบแอดมิน',
    navCalculator: 'คำนวณกำไร',
    navContract: 'สัญญา BSC',
    connectWallet: 'เชื่อมต่อกระเป๋า',
    disconnect: 'ตัดการเชื่อมต่อ',
    connected: 'เชื่อมต่อแล้ว',
    switchAccount: 'สลับบัญชีผู้ใช้',
    copyAddress: 'คัดลอกแอดเดรส',
    copied: 'คัดลอกแล้ว!',
    networkBSC: 'BNB Smart Chain (Mainnet)',
    testnet: 'Testnet Mode',

    // Hero Section
    heroBadge: '🔥 Web3 Decentralized Matrix 3.0',
    heroTitle: 'wealthlifecycle: ระบบ 3 Ranks คิวไม่มีตัน ด้วยพลังแห่ง Ghost Reborn',
    heroSubtitle: 'นวัตกรรมผังเมทริกซ์อัจฉริยะ 100% On-Chain โปร่งใส ยุติธรรม คิวระดับโลกหมุนเวียนต่อเนื่องด้วยระบบกำเนิดรหัสผี (Ghost) ผลักดันผู้เล่นทุกคน',
    btnRegisterNow: 'สมัครสมาชิก (2 USDT)',
    btnEnterDashboard: 'เข้าสู่แผงควบคุม',
    btnViewTree: 'ตรวจสอบผังสด',
    btnSimulate: 'เริ่มจำลองระบบ',

    // Live Stats
    statsTotalUsers: 'จำนวนสมาชิกทั้งหมด',
    statsRealUsers: 'ผู้เล่นจริง (Real)',
    statsGhostUsers: 'รหัสผีเกิดใหม่ (Ghost)',
    statsTotalDistributed: 'จ่ายผลตอบแทนสะสม',
    statsExpiredRecycled: 'ยอดบัญชีหมดอายุที่นำกลับมาหมุนเวียน',
    statsExpiredSub: '7-Day Expiry Recycled Pool',
    statsGlobalPool: 'กองกลางระดับโลก (Global Pool)',
    statsRebornPool: 'กองทุนรหัสผี (Reborn Fund)',
    statsActiveQueue: 'คิวที่กำลังรอหมุนรอบ',
    statsRank2Queue: 'คิวโลก Rank 2 (4 USDT)',
    statsRank3Queue: 'คิวโลก Rank 3 (8 USDT)',
    statsTotalQueues: 'คิวโลกทั้งหมด (Rank 2-3)',

    // How it works
    howItWorksTitle: 'แผนรายได้และอัตราค่าธรรมเนียม 3 ระดับ (Rank Plans)',
    howItWorksSub: 'โครงสร้างผลตอบแทนอัจฉริยะ 3 Ranks ผสานระบบ 7 Days Expiry, Reborn ID คนจริง และเสก Ghost ID ดันคิวโลกอัตโนมัติ',
    rank1Title: 'Rank 1 : ระดับเริ่มต้น (2 USDT)',
    rank1Desc: 'อายุการใช้งาน 7 วัน | Direct Bonus 10% (0.20 USDT) | Matrix Bonus ช่อง 1 & 2 รับ 30% (ช่องละ 0.60 USDT รวม 1.20 USDT) | ช่อง 3 พักกระดาน | ช่อง 4 สะสมทุน 2 USDT อัปเกรดขึ้น Rank 2 อัตโนมัติ',
    rank2Title: 'Rank 2 : คิวโลก (4 USDT)',
    rank2Desc: 'คิวโลกอัตโนมัติ FIFO | ช่อง 1 รับสด 50% (2.00 USDT) | ช่อง 2 รับสด 50% (2.00 USDT) + เสก Ghost ID ดันคิว Rank 2 จำนวน 1 ไอดี | ช่อง 3 & 4 สะสมทุนครบอัปเกรดขึ้น Rank 3 อัตโนมัติ',
    rank3Title: 'Rank 3 : ผู้เสกผี Final (8 USDT)',
    rank3Desc: 'ช่อง 1: เสก Real ID Reborn สู่ Rank 1 (2 USDT) + Ghost 4 ตัวสู่ Rank 1 (8 USDT) | ช่อง 2: รับเงินสด 100% (8.00 USDT) เข้ากระเป๋าทันที | ช่อง 3: เสก Ghost 2 ตัวดัน Rank 2 | ช่อง 4: เสก Ghost 2 ตัวดัน Rank 2 และจบรอบ',
    ghostFeatureTitle: '👻 พลังแห่ง Ghost Reborn Engine & 7 Days Expiry',
    ghostFeatureDesc: 'ระบบความยั่งยืน 100% On-Chain: Rank 3 ปล่อย Ghost รวม 8 ตัว/รอบ (Rank 1 = 4 ตัว, Rank 2 = 4 ตัว) และ Rank 2 ปล่อย 1 ตัว พร้อมระบบ 7 Days Expiry ดึงสภาพคล่องอัดฉีดระบบอย่างต่อเนื่อง',

    // Dashboard
    dashWelcome: 'ยินดีต้อนรับสู่แดชบอร์ดส่วนตัว',
    profileTitle: 'ข้อมูลกระเป๋าและสถานะ',
    userId: 'รหัสสมาชิก (My ID)',
    sponsorId: 'ผู้แนะนำ (Sponsor ID)',
    userStatus: 'สถานะ',
    statusActive: 'เปิดใช้งานแล้ว (Active)',
    statusInactive: 'ยังไม่ลงทะเบียน (Inactive)',
    myAddress: 'แอดเดรสกระเป๋า',
    referralLink: 'ลิงก์แนะนำเพื่อนของคุณ (รับโบนัสตรง 10%)',
    copyLink: 'คัดลอกลิงก์',
    qrCode: 'ดู QR Code',

    // Earnings
    totalEarned: 'รวมรายได้ทั้งหมด',
    directBonus: 'โบนัสแนะนำตรง (10%)',
    rank1Bonus: 'รายได้จาก Rank 1',
    rank2Bonus: 'ปันผลจาก Rank 2 (คิวโลก)',
    rank3Bonus: 'โบนัส Rank 3 (กระดานทอง)',
    pendingReborn: 'เงินสะสมในกองทุน Reborn',
    cyclesCompleted: 'จำนวนรอบที่สำเร็จ (Cycles)',
    btnClaimAll: 'ถอนรายได้ทั้งหมดเข้ากระเป๋า',
    claiming: 'กำลังทำธุรกรรม...',

    // Registration Box
    registerCardTitle: 'สมัครสมาชิก wealthlifecycle',
    registerCardDesc: 'ค่าธรรมเนียมเพียง 2 USDT (บน BNB Smart Chain) ระบบจะกระจายเข้าโครงข่ายทันที',
    inputSponsor: 'ระบุ ID ผู้แนะนำ (ค่าเริ่มต้น 1)',
    btnApproveUSDT: 'อนุมัติ USDT (Approve)',
    btnRegisterSubmit: 'ยืนยันการสมัคร (2 USDT)',
    processingTx: 'กำลังรออนุมัติธุรกรรมบนบล็อกเชน...',

    // Matrix View
    matrixPageTitle: 'ผังเมทริกซ์และกระดานคิวระดับโลก (Live Visualization)',
    matrixPageSub: 'ตรวจสอบโครงสร้างสายงานส่วนตัว Rank 1 และแถวคอยหมุนเวียน Rank 2 & 3',
    tabRank1: '🔵 Rank 1: ผังสายงาน (1 แตก 4)',
    tabRank2: '⚪ Rank 2: คิวระดับโลก (Global Queue)',
    tabRank3: '🟡 Rank 3: กระดานทองคำ (Gold Matrix)',
    legendReal: '👤 รหัสผู้เล่นจริง (Real User)',
    legendGhost: '👻 รหัสผี (Ghost Reborn)',
    legendEmpty: '➕ สล็อตว่าง (Available Slot)',
    nodeDetailsTitle: 'ข้อมูลโหนดเมทริกซ์',
    close: 'ปิด',

    // Rank 1 Specifics
    yourDirectTeam: 'ลูกทีมสายตรง 4 ตำแหน่ง (Level 1)',
    subTeam: 'ลูกทีมชั้นลึก (Level 2)',
    fillSlotHint: 'แนะนำสมาชิกใหม่เพื่อเติมสล็อตนี้ หรือรอ Spillover จากแม่ทีม',

    // Rank 2 Specifics
    queuePosition: 'ตำแหน่งคิวของคุณในโลก',
    slotsFilledStatus: 'จำนวนสล็อตที่เติมแล้วในรอบนี้',
    queueProgress: 'ความคืบหน้าการรอบรรจุ',
    waitingQueueList: 'รายชื่อผู้เล่นที่กำลังอยู่ในคิวโลก (FIFO Queue)',

    // Admin Panel
    adminTitle: '🛡️ แผงควบคุมระบบอัจฉริยะ (Owner / Dev Panel)',
    adminSub: 'เข้าถึงสิทธิ์สัญญาเพื่อประมวลผลคิวเกิดใหม่ (Process Reborn) และเสกผีผลักดันระบบ (Spawn Ghosts)',
    adminWarning: '⚠️ ระบบนี้จำลองการเรียกฟังก์ชัน Smart Contract สิทธิ์ Owner แบบ 100% เรียลไทม์',
    processRebornTitle: 'รันคิวเกิดใหม่ (Process Reborn)',
    processRebornDesc: 'ประมวลผลกองทุนสะสม Reborn Pool เพื่อสร้างรหัสผี (Ghost) อัตโนมัติไปดันก้นคิวให้ผู้เล่นขยับขึ้น',
    batchSize: 'จำนวนรหัสต่อการรัน (Batch Size)',
    btnRunReborn: '⚡ รันคิวเกิดใหม่ทันที (Execute Reborn)',
    spawnGhostTitle: 'แอดมินเสกผีดันคิว (Admin Spawn Ghosts)',
    spawnGhostDesc: 'ฉีดรหัสผีพิเศษเข้าสู่ Rank ที่กำหนด เพื่อเร่งความเร็วการหมุนรอบคิว',
    selectRank: 'เลือก Rank เป้าหมาย',
    ghostCount: 'จำนวนรหัสผีที่ต้องการสร้าง',
    btnSpawnGhosts: '👻 เสกผีเข้าสู่ระบบ (Spawn Now)',
    botSimulationTitle: '🤖 ระบบจำลองการไหลของทราฟฟิกอัตโนมัติ (Live Bot Traffic)',
    botSimulationDesc: 'เปิดโหมดบอทเพื่อให้มีผู้เล่นและรหัสผีเข้ามาสมัครแบบเรียลไทม์ ดูการเติบโตสดๆ',
    btnStartBot: 'เปิดระบบจำลองทราฟฟิก (Auto-Bot ON)',
    btnStopBot: 'ปิดระบบจำลอง (Auto-Bot OFF)',

    // Calculator
    calcTitle: 'เครื่องคำนวณผลตอบแทนและพลังทวีคูณ',
    calcSub: 'คำนวณศักยภาพรายได้จากการแนะนำตรง และการไหลของคิวระดับโลก',
    calcDirectReferrals: 'จำนวนคนที่คุณแนะนำตรง',
    calcCyclesEstimate: 'จำนวนรอบคิวโลกที่คาดว่าจะหมุนผ่าน (Cycles)',
    calcEstimatedIncome: 'รายได้สุทธิที่คาดว่าจะได้รับ (USDT)',

    // Smart Contract Tab
    contractTitle: 'ตรวจสอบโค้ดสมาร์ตคอนแทรกต์ (Verified Contract)',
    contractSub: 'ตรวจสอบโค้ด Solidity 0.8.20 ที่ผ่านการตรวจสอบความปลอดภัย พร้อมฟังก์ชันครบถ้วน',
    contractAddressLabel: 'Contract Address (BEP-20 / EVM)',
    abiFunctions: 'ฟังก์ชันหลักในสัญญา',

    // Toasts & Alerts
    toastRegSuccess: '🎉 สมัครสมาชิกสำเร็จ! ยินดีต้อนรับสู่ wealthlifecycle',
    toastRewardReceived: '💰 ได้รับเงินปันผล',
    toastGhostSpawned: '👻 รหัสผีเกิดใหม่ถูกบรรจุเข้าผังเรียบร้อยแล้ว!',
    toastRebornSuccess: '⚡ ประมวลผล Reborn สำเร็จ ดันคิวสำเร็จ',
    toastClaimSuccess: '💎 ถอนรายได้เข้ากระเป๋าสำเร็จ!',
  },
  en: {
    // Navigation
    navBrand: 'WEALTHLIFECYCLE',
    navTagline: '3-Rank Seamless Matrix DApp',
    navLanding: 'Home',
    navDashboard: 'Dashboard',
    navMatrix: 'Matrix',
    navAdmin: 'Admin',
    navCalculator: 'Calculator',
    navContract: 'Contract',
    connectWallet: 'Connect Wallet',
    disconnect: 'Disconnect',
    connected: 'Connected',
    switchAccount: 'Switch Account',
    copyAddress: 'Copy Address',
    copied: 'Copied!',
    networkBSC: 'BNB Smart Chain (Mainnet)',
    testnet: 'Testnet Mode',

    // Hero Section
    heroBadge: '🔥 Web3 Decentralized Matrix 3.0',
    heroTitle: 'wealthlifecycle: 3-Rank Non-Stop Queue Powered by Ghost Reborn',
    heroSubtitle: '100% On-Chain transparent and verifiable smart matrix. Non-stagnant global queues continuously propelled by autonomous Ghost Reborn accounts.',
    btnRegisterNow: 'Register Now (2 USDT)',
    btnEnterDashboard: 'Enter Dashboard',
    btnViewTree: 'View Live Tree',
    btnSimulate: 'Start Simulation',

    // Live Stats
    statsTotalUsers: 'Total Registered Members',
    statsRealUsers: 'Real Participants',
    statsGhostUsers: 'Ghost Reborn IDs',
    statsTotalDistributed: 'Total Distributed Rewards',
    statsExpiredRecycled: 'Recycled Expired Balance',
    statsExpiredSub: '7-Day Inactive Liquidity Recycled',
    statsGlobalPool: 'Global Pool Reserve',
    statsRebornPool: 'Ghost Reborn Fund',
    statsActiveQueue: 'Queued for Next Cycle',
    statsRank2Queue: 'Rank 2 Global Queue (4 USDT)',
    statsRank3Queue: 'Rank 3 Global Queue (8 USDT)',
    statsTotalQueues: 'All Global Queues (Rank 2-3)',

    // How it works
    howItWorksTitle: 'Fee Rates & 3-Tier Rank Compensation Plans',
    howItWorksSub: 'Transparent 3-Rank yield protocol featuring 7-day expiry, Real ID Reborn, and autonomous Ghost propulsion engines.',
    rank1Title: 'Rank 1 : Starter Tier (2 USDT)',
    rank1Desc: '7-Day Lifespan | Direct Bonus 10% ($0.20) | Matrix Bonus Slots 1 & 2 receive 30% ($0.60/slot = $1.20) | Slot 3 Hold | Slot 4 Reserves $2.00 to Auto-Upgrade to Rank 2',
    rank2Title: 'Rank 2 : Global Queue (4 USDT)',
    rank2Desc: 'Automated Global FIFO Queue | Slot 1: 50% ($2.00) cash | Slot 2: 50% ($2.00) cash + Spawns 1 Ghost ID to push Rank 2 queue | Slots 3 & 4: Accumulate & Auto-Upgrade to Rank 3',
    rank3Title: 'Rank 3 : Ghost Master Final (8 USDT)',
    rank3Desc: 'Slot 1: 1 Real ID Reborn to R1 ($2) + 4 Ghost IDs to R1 ($8) | Slot 2: 100% Cash ($8.00) instantly | Slot 3: Spawns 2 Ghosts to R2 ($8) | Slot 4: Spawns 2 Ghosts to R2 ($8) & cycle complete',
    ghostFeatureTitle: '👻 The Power of Ghost Reborn Engine & 7-Day Expiry',
    ghostFeatureDesc: '100% On-Chain Sustainability: Rank 3 releases 8 Ghosts/cycle (4 in R1, 4 in R2) and Rank 2 releases 1 Ghost. Coupled with the 7-day expiry mechanism, liquidity continuously recycles to propel real users.',

    // Dashboard
    dashWelcome: 'Welcome to your Personal Command Center',
    profileTitle: 'Wallet Identity & Status',
    userId: 'My Member ID',
    sponsorId: 'Sponsor ID',
    userStatus: 'Account Status',
    statusActive: 'Active & Participating',
    statusInactive: 'Inactive (Unregistered)',
    myAddress: 'Wallet Address',
    referralLink: 'Your Unique Invite Link (Earn 10% Direct Bonus)',
    copyLink: 'Copy Link',
    qrCode: 'Show QR Code',

    // Earnings
    totalEarned: 'Total Earned to Date',
    directBonus: 'Direct Sponsor Bonus (10%)',
    rank1Bonus: 'Rank 1 Matrix Yield',
    rank2Bonus: 'Rank 2 Global Dividend',
    rank3Bonus: 'Rank 3 Gold Harvest',
    pendingReborn: 'Accumulated Reborn Fund',
    cyclesCompleted: 'Cycles Completed',
    btnClaimAll: 'Claim All Rewards to Wallet',
    claiming: 'Processing on Blockchain...',

    // Registration Box
    registerCardTitle: 'Register for wealthlifecycle',
    registerCardDesc: 'Affordable 2 USDT entry fee on BNB Smart Chain. Instant multi-tier on-chain distribution.',
    inputSponsor: 'Sponsor ID (Default: 1)',
    btnApproveUSDT: 'Approve USDT Allowance',
    btnRegisterSubmit: 'Confirm Registration (2 USDT)',
    processingTx: 'Waiting for blockchain confirmation...',

    // Matrix View
    matrixPageTitle: 'Matrix Hierarchy & Global Queue Visualizer',
    matrixPageSub: 'Interactive visualization for Rank 1 personal tree and Rank 2 & 3 FIFO global queues.',
    tabRank1: '🔵 Rank 1: Personal Tree (1x4)',
    tabRank2: '⚪ Rank 2: Global FIFO Queue',
    tabRank3: '🟡 Rank 3: Apex Gold Board',
    legendReal: '👤 Real Participant',
    legendGhost: '👻 Ghost Reborn ID',
    legendEmpty: '➕ Available Empty Slot',
    nodeDetailsTitle: 'Matrix Node Inspector',
    close: 'Close',

    // Rank 1 Specifics
    yourDirectTeam: 'Direct Frontline Slots (Level 1 - 4 Slots)',
    subTeam: 'Sub-tier Network (Level 2 - 16 Slots)',
    fillSlotHint: 'Share your link to fill this node or wait for upline spillover.',

    // Rank 2 Specifics
    queuePosition: 'Your Global Queue Position',
    slotsFilledStatus: 'Slots Filled in Current Cycle',
    queueProgress: 'Cycle Fulfillment Progress',
    waitingQueueList: 'Live FIFO Queue Stream',

    // Admin Panel
    adminTitle: '🛡️ Smart Contract Governance (Owner Console)',
    adminSub: 'Privileged operations for processing Reborn queues and injecting ecosystem catalyst ghosts.',
    adminWarning: '⚠️ Simulates direct execution of verified owner smart contract transactions with real-time state sync.',
    processRebornTitle: 'Process Reborn Queue (รันคิวเกิดใหม่)',
    processRebornDesc: 'Execute pending Reborn liquidity to batch-generate Ghost accounts and elevate queued players.',
    batchSize: 'Batch Execution Size',
    btnRunReborn: '⚡ Execute Batch Reborn Now',
    spawnGhostTitle: 'Admin Spawn Ghosts (แอดมินเสกผีดันคิว)',
    spawnGhostDesc: 'Inject targeted Ghost catalysts directly into specific rank structures to speed up cycle completions.',
    selectRank: 'Target Matrix Rank',
    ghostCount: 'Number of Ghosts to Spawn',
    btnSpawnGhosts: '👻 Spawn Matrix Ghosts Now',
    botSimulationTitle: '🤖 Live Traffic Simulation Bot',
    botSimulationDesc: 'Activate continuous simulated Web3 traffic to watch real-time registrations, ghost spawns, and payouts.',
    btnStartBot: 'Activate Traffic Bot (ON)',
    btnStopBot: 'Stop Simulation (OFF)',

    // Calculator
    calcTitle: 'Interactive Matrix Earnings & ROI Calculator',
    calcSub: 'Project your potential USDT cashflows based on direct referrals and global cycle velocities.',
    calcDirectReferrals: 'Estimated Direct Referrals',
    calcCyclesEstimate: 'Projected Global Queue Cycles',
    calcEstimatedIncome: 'Estimated Total Return (USDT)',

    // Smart Contract Tab
    contractTitle: 'Verified Smart Contract Code & ABI',
    contractSub: 'Audited Solidity 0.8.20 smart contract architecture ensuring fair on-chain execution.',
    contractAddressLabel: 'Contract Address (BEP-20 / EVM)',
    abiFunctions: 'Verified On-Chain Functions',

    // Toasts & Alerts
    toastRegSuccess: '🎉 Registration Confirmed! Welcome to wealthlifecycle',
    toastRewardReceived: '💰 Matrix dividend credited',
    toastGhostSpawned: '👻 Ghost Reborn accounts injected successfully!',
    toastRebornSuccess: '⚡ Reborn queue processed and pushed forward!',
    toastClaimSuccess: '💎 Earnings transferred to your wallet balance!',
  }
};
