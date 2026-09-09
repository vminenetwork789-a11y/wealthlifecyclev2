import { NextRequest, NextResponse } from 'next/server';
import { SmartContractEventLog } from '@/lib/types';
import { generateMysqlDumpSql, MYSQL_SCHEMA_DDL, formatMysqlDateTime } from '@/lib/mysql-export';
import mysql from 'mysql2/promise';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'WealthLifeCycle MySQL Sync Service is ready',
    schema: MYSQL_SCHEMA_DDL,
    envConfigured: Boolean(process.env.MYSQL_HOST && process.env.MYSQL_DATABASE)
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: SmartContractEventLog[] = body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No events provided in request body'
      }, { status: 400 });
    }

    const host = process.env.MYSQL_HOST;
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || 'wealthlifecycle_db';

    const sqlScript = generateMysqlDumpSql(events);

    // Try live MySQL connection if configured and not default unconfigured localhost
    const isLiveDbConfigured = host && host !== 'localhost' && host !== '127.0.0.1';

    if (isLiveDbConfigured) {
      try {
        const connection = await mysql.createConnection({
          host,
          port,
          user,
          password,
          database,
          multipleStatements: true,
          connectTimeout: 5000
        });

        // 1. Create tables if needed
        await connection.query(`
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
        `);

        await connection.query(`
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
            INDEX \`idx_reg_sponsor\` (\`sponsor_id\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
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
            INDEX \`idx_rew_note\` (\`bonus_note\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Batch insert master events
        for (const ev of events) {
          const time = formatMysqlDateTime(ev.timestamp);
          await connection.execute(
            `INSERT INTO \`contract_events_master\` (\`event_name\`, \`tx_hash\`, \`block_number\`, \`formatted_summary\`, \`args_json\`, \`event_timestamp\`)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              ev.eventName,
              ev.txHash,
              ev.blockNumber || 0,
              ev.formattedSummary || '',
              JSON.stringify(ev.args || {}),
              time
            ]
          );

          if (ev.eventName === 'Registered') {
            await connection.execute(
              `INSERT INTO \`events_registered\` (\`new_id\`, \`wallet_address\`, \`sponsor_id\`, \`placement_id\`, \`is_auto_reborn\`, \`is_ghost\`, \`tx_hash\`, \`block_number\`, \`event_timestamp\`)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE \`tx_hash\` = VALUES(\`tx_hash\`), \`wallet_address\` = VALUES(\`wallet_address\`)`,
              [
                Number(ev.args.newId || 0),
                String(ev.args.wallet || '0x0000000000000000000000000000000000000000'),
                Number(ev.args.sponsorId || 1),
                Number(ev.args.placementId || 1),
                ev.args.isAutoReborn ? 1 : 0,
                ev.args.isGhost ? 1 : 0,
                ev.txHash,
                ev.blockNumber || 0,
                time
              ]
            );
          } else if (ev.eventName === 'RewardPaid') {
            let usdtVal = 0;
            if (typeof ev.args.amountFormatted === 'string') {
              usdtVal = parseFloat(ev.args.amountFormatted.replace(/[^0-9.]/g, '') || '0');
            } else if (ev.args.amount) {
              try {
                usdtVal = Number(BigInt(String(ev.args.amount))) / 1e18;
              } catch {
                usdtVal = 0;
              }
            }
            await connection.execute(
              `INSERT INTO \`events_reward_paid\` (\`wallet_address\`, \`amount_usdt\`, \`amount_wei\`, \`bonus_note\`, \`tx_hash\`, \`block_number\`, \`event_timestamp\`)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                String(ev.args.wallet || ''),
                usdtVal,
                String(ev.args.amount || '0'),
                String(ev.args.note || 'Matrix Reward'),
                ev.txHash,
                ev.blockNumber || 0,
                time
              ]
            );
          }
        }

        await connection.end();

        return NextResponse.json({
          success: true,
          mode: 'direct_mysql',
          message: `Successfully synchronized ${events.length} events to MySQL database on ${host}`,
          insertedCount: events.length,
          database: database,
          sql: sqlScript
        });
      } catch (dbErr: unknown) {
        console.warn('Direct MySQL connection error, providing generated SQL dump:', dbErr);
        const errorMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        return NextResponse.json({
          success: true,
          mode: 'sql_dump_ready',
          message: `Generated MySQL dump script for ${events.length} events (Live DB host unreachable: ${errorMsg})`,
          insertedCount: events.length,
          sql: sqlScript
        });
      }
    }

    // Default mode: Return fully formatted MySQL DDL + SQL Insert queries
    return NextResponse.json({
      success: true,
      mode: 'sql_dump_ready',
      message: `Generated MySQL Dump script with ${events.length} events ready for phpMyAdmin, MySQL Workbench, or CLI.`,
      insertedCount: events.length,
      sql: sqlScript
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: msg
    }, { status: 500 });
  }
}
