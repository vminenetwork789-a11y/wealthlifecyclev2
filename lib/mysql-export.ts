import { SmartContractEventLog } from './types';

/**
 * Standard MySQL DDL Schema for WealthLifeCycle Contract Events
 */
export const MYSQL_SCHEMA_DDL = `-- ==========================================================
-- WealthLifeCycle Smart Contract - MySQL Events Schema
-- Database: wealthlifecycle_db
-- ==========================================================

CREATE DATABASE IF NOT EXISTS \`wealthlifecycle_db\` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE \`wealthlifecycle_db\`;

-- 1. Master Events Table (All Event Logs)
CREATE TABLE IF NOT EXISTS \`contract_events_master\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`event_name\` VARCHAR(64) NOT NULL,
  \`tx_hash\` VARCHAR(66) NOT NULL,
  \`block_number\` BIGINT UNSIGNED NOT NULL,
  \`formatted_summary\` TEXT,
  \`args_json\` JSON NOT NULL,
  \`event_timestamp\` DATETIME NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_event_name\` (\`event_name\`),
  INDEX \`idx_tx_hash\` (\`tx_hash\`),
  INDEX \`idx_block_number\` (\`block_number\`),
  INDEX \`idx_event_timestamp\` (\`event_timestamp\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Registered Events Table
CREATE TABLE IF NOT EXISTS \`events_registered\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`new_id\` BIGINT UNSIGNED NOT NULL,
  \`wallet_address\` VARCHAR(42) NOT NULL,
  \`sponsor_id\` BIGINT UNSIGNED NOT NULL,
  \`placement_id\` BIGINT UNSIGNED NOT NULL,
  \`is_auto_reborn\` TINYINT(1) DEFAULT 0,
  \`is_ghost\` TINYINT(1) DEFAULT 0,
  \`tx_hash\` VARCHAR(66) NOT NULL,
  \`block_number\` BIGINT UNSIGNED NOT NULL,
  \`event_timestamp\` DATETIME NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY \`uniq_user_id\` (\`new_id\`),
  INDEX \`idx_reg_wallet\` (\`wallet_address\`),
  INDEX \`idx_reg_sponsor\` (\`sponsor_id\`),
  INDEX \`idx_reg_placement\` (\`placement_id\`),
  INDEX \`idx_reg_tx_hash\` (\`tx_hash\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. RewardPaid Events Table
CREATE TABLE IF NOT EXISTS \`events_reward_paid\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`wallet_address\` VARCHAR(42) NOT NULL,
  \`amount_usdt\` DECIMAL(18, 4) NOT NULL,
  \`amount_wei\` VARCHAR(78) NOT NULL,
  \`bonus_note\` VARCHAR(255) NOT NULL,
  \`tx_hash\` VARCHAR(66) NOT NULL,
  \`block_number\` BIGINT UNSIGNED NOT NULL,
  \`event_timestamp\` DATETIME NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_rew_wallet\` (\`wallet_address\`),
  INDEX \`idx_rew_note\` (\`bonus_note\`),
  INDEX \`idx_rew_tx_hash\` (\`tx_hash\`),
  INDEX \`idx_rew_timestamp\` (\`event_timestamp\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. AutoUpgraded Events Table
CREATE TABLE IF NOT EXISTS \`events_auto_upgraded\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` BIGINT UNSIGNED NOT NULL,
  \`new_rank\` TINYINT UNSIGNED NOT NULL,
  \`tx_hash\` VARCHAR(66) NOT NULL,
  \`block_number\` BIGINT UNSIGNED NOT NULL,
  \`event_timestamp\` DATETIME NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_upg_user_id\` (\`user_id\`),
  INDEX \`idx_upg_rank\` (\`new_rank\`),
  INDEX \`idx_upg_tx_hash\` (\`tx_hash\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. RebornQueued Events Table
CREATE TABLE IF NOT EXISTS \`events_reborn_queued\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`owner_id\` BIGINT UNSIGNED NOT NULL,
  \`wallet_address\` VARCHAR(42) NOT NULL,
  \`total_ids\` INT UNSIGNED DEFAULT 7,
  \`is_ghost\` TINYINT(1) DEFAULT 0,
  \`tx_hash\` VARCHAR(66) NOT NULL,
  \`block_number\` BIGINT UNSIGNED NOT NULL,
  \`event_timestamp\` DATETIME NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_reb_owner_id\` (\`owner_id\`),
  INDEX \`idx_reb_wallet\` (\`wallet_address\`),
  INDEX \`idx_reb_tx_hash\` (\`tx_hash\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SystemPaused Events Table
CREATE TABLE IF NOT EXISTS \`events_system_paused\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`is_paused\` TINYINT(1) NOT NULL,
  \`tx_hash\` VARCHAR(66) NOT NULL,
  \`block_number\` BIGINT UNSIGNED NOT NULL,
  \`event_timestamp\` DATETIME NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_pause_tx_hash\` (\`tx_hash\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

/**
 * Converts a Javascript Date or Timestamp to MySQL DATETIME string format ('YYYY-MM-DD HH:MM:SS')
 */
export function formatMysqlDateTime(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Escapes strings safely for SQL INSERT statements
 */
export function escapeSqlString(str: string = ''): string {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

/**
 * Generate a complete MySQL SQL Dump file from live smart contract events
 */
export function generateMysqlDumpSql(events: SmartContractEventLog[]): string {
  let sql = MYSQL_SCHEMA_DDL;
  sql += `\n-- ==========================================================\n`;
  sql += `-- DATA INSERTS (${events.length} Smart Contract Events)\n`;
  sql += `-- Generated at: ${new Date().toISOString()}\n`;
  sql += `-- ==========================================================\n\n`;

  if (events.length === 0) {
    sql += `-- No events to insert.\n`;
    return sql;
  }

  // 1. Insert into Master Table
  sql += `-- 1. Insert Master Events Log\n`;
  sql += `INSERT INTO \`contract_events_master\` (\`event_name\`, \`tx_hash\`, \`block_number\`, \`formatted_summary\`, \`args_json\`, \`event_timestamp\`)\nVALUES\n`;
  
  const masterValues = events.map((ev, i) => {
    const isLast = i === events.length - 1;
    const name = escapeSqlString(ev.eventName);
    const tx = escapeSqlString(ev.txHash);
    const block = ev.blockNumber || 0;
    const summary = escapeSqlString(ev.formattedSummary || '');
    const jsonStr = escapeSqlString(JSON.stringify(ev.args || {}));
    const time = formatMysqlDateTime(ev.timestamp);
    return `('${name}', '${tx}', ${block}, '${summary}', '${jsonStr}', '${time}')${isLast ? ';' : ','}`;
  }).join('\n');

  sql += masterValues + '\n\n';

  // 2. Filter & Insert Registered Events
  const regEvents = events.filter(e => e.eventName === 'Registered');
  if (regEvents.length > 0) {
    sql += `-- 2. Insert Registered Events (${regEvents.length} rows)\n`;
    sql += `INSERT INTO \`events_registered\` (\`new_id\`, \`wallet_address\`, \`sponsor_id\`, \`placement_id\`, \`is_auto_reborn\`, \`is_ghost\`, \`tx_hash\`, \`block_number\`, \`event_timestamp\`)\nVALUES\n`;
    const regValues = regEvents.map((ev, i) => {
      const isLast = i === regEvents.length - 1;
      const newId = Number(ev.args.newId || 0);
      const wallet = escapeSqlString(String(ev.args.wallet || '0x0000000000000000000000000000000000000000'));
      const sponsorId = Number(ev.args.sponsorId || 1);
      const placementId = Number(ev.args.placementId || sponsorId);
      const isAutoReborn = ev.args.isAutoReborn ? 1 : 0;
      const isGhost = ev.args.isGhost ? 1 : 0;
      const tx = escapeSqlString(ev.txHash);
      const block = ev.blockNumber || 0;
      const time = formatMysqlDateTime(ev.timestamp);
      return `(${newId}, '${wallet}', ${sponsorId}, ${placementId}, ${isAutoReborn}, ${isGhost}, '${tx}', ${block}, '${time}')${isLast ? ';' : ','}`;
    }).join('\n');
    sql += regValues + '\n\n';
  }

  // 3. Filter & Insert RewardPaid Events
  const rewEvents = events.filter(e => e.eventName === 'RewardPaid');
  if (rewEvents.length > 0) {
    sql += `-- 3. Insert RewardPaid Events (${rewEvents.length} rows)\n`;
    sql += `INSERT INTO \`events_reward_paid\` (\`wallet_address\`, \`amount_usdt\`, \`amount_wei\`, \`bonus_note\`, \`tx_hash\`, \`block_number\`, \`event_timestamp\`)\nVALUES\n`;
    const rewValues = rewEvents.map((ev, i) => {
      const isLast = i === rewEvents.length - 1;
      const wallet = escapeSqlString(String(ev.args.wallet || ''));
      let usdtVal = '0.0000';
      if (typeof ev.args.amountFormatted === 'string') {
        usdtVal = parseFloat(ev.args.amountFormatted.replace(/[^0-9.]/g, '') || '0').toFixed(4);
      } else if (ev.args.amount) {
        try {
          const wei = BigInt(String(ev.args.amount));
          usdtVal = (Number(wei) / 1e18).toFixed(4);
        } catch {
          usdtVal = '0.0000';
        }
      }
      const weiStr = escapeSqlString(String(ev.args.amount || '0'));
      const note = escapeSqlString(String(ev.args.note || 'Matrix Reward'));
      const tx = escapeSqlString(ev.txHash);
      const block = ev.blockNumber || 0;
      const time = formatMysqlDateTime(ev.timestamp);
      return `('${wallet}', ${usdtVal}, '${weiStr}', '${note}', '${tx}', ${block}, '${time}')${isLast ? ';' : ','}`;
    }).join('\n');
    sql += rewValues + '\n\n';
  }

  // 4. Filter & Insert AutoUpgraded Events
  const upgEvents = events.filter(e => e.eventName === 'AutoUpgraded');
  if (upgEvents.length > 0) {
    sql += `-- 4. Insert AutoUpgraded Events (${upgEvents.length} rows)\n`;
    sql += `INSERT INTO \`events_auto_upgraded\` (\`user_id\`, \`new_rank\`, \`tx_hash\`, \`block_number\`, \`event_timestamp\`)\nVALUES\n`;
    const upgValues = upgEvents.map((ev, i) => {
      const isLast = i === upgEvents.length - 1;
      const userId = Number(ev.args.userId || 0);
      const rank = Number(ev.args.newRank || 2);
      const tx = escapeSqlString(ev.txHash);
      const block = ev.blockNumber || 0;
      const time = formatMysqlDateTime(ev.timestamp);
      return `(${userId}, ${rank}, '${tx}', ${block}, '${time}')${isLast ? ';' : ','}`;
    }).join('\n');
    sql += upgValues + '\n\n';
  }

  // 5. Filter & Insert RebornQueued Events
  const rebEvents = events.filter(e => e.eventName === 'RebornQueued');
  if (rebEvents.length > 0) {
    sql += `-- 5. Insert RebornQueued Events (${rebEvents.length} rows)\n`;
    sql += `INSERT INTO \`events_reborn_queued\` (\`owner_id\`, \`wallet_address\`, \`total_ids\`, \`is_ghost\`, \`tx_hash\`, \`block_number\`, \`event_timestamp\`)\nVALUES\n`;
    const rebValues = rebEvents.map((ev, i) => {
      const isLast = i === rebEvents.length - 1;
      const ownerId = Number(ev.args.ownerId || 0);
      const wallet = escapeSqlString(String(ev.args.wallet || ''));
      const totalIds = Number(ev.args.totalIds || 7);
      const isGhost = ev.args.isGhost ? 1 : 0;
      const tx = escapeSqlString(ev.txHash);
      const block = ev.blockNumber || 0;
      const time = formatMysqlDateTime(ev.timestamp);
      return `(${ownerId}, '${wallet}', ${totalIds}, ${isGhost}, '${tx}', ${block}, '${time}')${isLast ? ';' : ','}`;
    }).join('\n');
    sql += rebValues + '\n\n';
  }

  // 6. Filter & Insert SystemPaused Events
  const pauseEvents = events.filter(e => e.eventName === 'SystemPaused');
  if (pauseEvents.length > 0) {
    sql += `-- 6. Insert SystemPaused Events (${pauseEvents.length} rows)\n`;
    sql += `INSERT INTO \`events_system_paused\` (\`is_paused\`, \`tx_hash\`, \`block_number\`, \`event_timestamp\`)\nVALUES\n`;
    const pauseValues = pauseEvents.map((ev, i) => {
      const isLast = i === pauseEvents.length - 1;
      const isPaused = ev.args.isPaused ? 1 : 0;
      const tx = escapeSqlString(ev.txHash);
      const block = ev.blockNumber || 0;
      const time = formatMysqlDateTime(ev.timestamp);
      return `(${isPaused}, '${tx}', ${block}, '${time}')${isLast ? ';' : ','}`;
    }).join('\n');
    sql += pauseValues + '\n\n';
  }

  return sql;
}

/**
 * Triggers a browser file download of the MySQL Dump
 */
export function downloadMysqlDumpFile(events: SmartContractEventLog[], filename = 'wealthlifecycle_events.sql') {
  if (typeof window === 'undefined') return;
  const sqlContent = generateMysqlDumpSql(events);
  const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
