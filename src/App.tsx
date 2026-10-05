import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://123.45.67.89:3000';
const socket: Socket = io(SERVER_URL, { autoConnect: true });

type PlayerInfo = {
  id: string;
  name?: string;
  isBot?: boolean;
  level?: 'normal' | 'advanced';
};

type RoomInfo = {
  roomId: string;
  ownerId: string;
  baseMultiplier: number;
  players: PlayerInfo[];
};

type MatchSummaryItem = {
  playerId: string;
  totalDelta: number;
  finalScore: number;
};

type PatternKey =
  | '普通胡'
  | '碰碰胡'
  | '清一色'
  | '七对'
  | '大三元'
  | '龙七对'
  | '杠上炮'
  | '抢杠'
  | '明4归'
  | '暗4归';

const patternOptions: PatternKey[] = ['普通胡', '碰碰胡', '清一色', '七对', '大三元', '龙七对', '杠上炮', '抢杠', '明4归', '暗4归'];

const tilePool = [
  'tiao_1','tiao_2','tiao_3','tiao_4','tiao_5','tiao_6','tiao_7','tiao_8','tiao_9',
  'tong_1','tong_2','tong_3','tong_4','tong_5','tong_6','tong_7','tong_8','tong_9',
  'zhong','fa','bai'
];

function randTile() {
  return tilePool[Math.floor(Math.random() * tilePool.length)];
}

function getTileText(tile: string) {
  if (tile.startsWith('tiao_')) return `${tile.split('_')[1]}条`;
  if (tile.startsWith('tong_')) return `${tile.split('_')[1]}筒`;
  if (tile === 'zhong') return '中';
  if (tile === 'fa') return '发';
  if (tile === 'bai') return '白';
  return tile;
}

function getTileColor(tile: string) {
  if (tile.startsWith('tiao_')) return '#f59e0b';
  if (tile.startsWith('tong_')) return '#38bdf8';
  if (tile === 'zhong') return '#f87171';
  if (tile === 'fa') return '#4ade80';
  if (tile === 'bai') return '#a78bfa';
  return '#cbd5e1';
}

function TileFace({ tile, selected = false, onClick }: { tile: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      className={`tile-face ${selected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ borderColor: getTileColor(tile) }}
    >
      <span className="tile-text" style={{ color: getTileColor(tile) }}>{getTileText(tile)}</span>
    </button>
  );
}

export default function App() {
  const [playerId, setPlayerId] = useState('player_' + Math.floor(Math.random() * 9000 + 1000));
  const [playerName, setPlayerName] = useState('我');
  const [roomId, setRoomId] = useState('room_001');
  const [baseMultiplier, setBaseMultiplier] = useState(2);
  const [selectedPattern, setSelectedPattern] = useState<PatternKey>('碰碰胡');

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [summary, setSummary] = useState<MatchSummaryItem[] | null>(null);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [lastDiscard, setLastDiscard] = useState<string | null>(null);

  const [seats, setSeats] = useState([
    { id: 'p_top', name: '上家', tiles: Array.from({ length: 12 }, () => randTile()), discards: [], melds: [] },
    { id: 'p_left', name: '左家', tiles: Array.from({ length: 12 }, () => randTile()), discards: [], melds: [] },
    { id: 'p_right', name: '右家', tiles: Array.from({ length: 12 }, () => randTile()), discards: [], melds: [] },
    { id: 'p_me', name: '我', tiles: Array.from({ length: 13 }, () => randTile()), discards: [], melds: [], isMe: true }
  ]);

  const meSeat = useMemo(() => seats.find((s) => s.isMe) ?? seats[3], [seats]);

  function addLog(msg: string) {
    setLogs((prev) => [msg, ...prev].slice(0, 40));
  }

  useEffect(() => {
    socket.on('connect', () => addLog('已连接后端'));
    socket.on('disconnect', () => addLog('已断开连接'));
    socket.on('room_update', (payload: RoomInfo) => {
      setRoom(payload);
      addLog(`房间更新: ${payload.roomId} / 人数: ${payload.players.length}`);
    });
    socket.on('round_started', (payload: any) => addLog(`新一轮开始: 第 ${payload.roundIndex} 局`));
    socket.on('round_end', (payload: any) => addLog(`本局结算: ${JSON.stringify(payload.roundResult)}`));
    socket.on('match_end', (payload: any) => {
      addLog(`总局结束: ${JSON.stringify(payload.summary)}`);
      setSummary(payload.summary);
    });
    socket.on('deal_hands', (payload: any) => {
      addLog(`收到真实手牌: ${JSON.stringify(payload.dealHands)}`);
      if (!payload || !payload.dealHands) return;
      setSeats((prev) => {
        const next = prev.map((s) => ({ ...s, tiles: [], discards: [...s.discards], melds: [...s.melds] }));
        for (const playerIdKey of Object.keys(payload.dealHands)) {
          const idx = next.findIndex((s) => s.id === playerIdKey || (playerIdKey === playerId && s.isMe));
          if (idx >= 0) next[idx].tiles = payload.dealHands[playerIdKey];
        }
        return next;
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_update');
      socket.off('round_started');
      socket.off('round_end');
      socket.off('match_end');
      socket.off('deal_hands');
    };
  }, [playerId]);

  function createRoom() {
    socket.emit('create_room', {
      roomId,
      ownerId: playerId,
      ownerName: playerName,
      baseMultiplier
    }, (res: any) => {
      if (!res.ok) {
        addLog(`创建失败: ${res.error ?? 'unknown'}`);
        return;
      }
      addLog(`创建房间成功: ${roomId}`);
      setRoom(res.room);
    });
  }

  function joinRoom() {
    socket.emit('join_room', { roomId, playerId, name: playerName }, (res: any) => {
      if (!res.ok) {
        addLog(`加入失败: ${res.error ?? 'unknown'}`);
        return;
      }
      addLog(`已加入房间: ${roomId}`);
      setRoom(res.room);
    });
  }

  function addBot() {
    socket.emit('add_bot', { roomId, botId: `bot_${Date.now()}`, name: '高级机器人', level: 'advanced' }, (res: any) => {
      if (!res.ok) {
        addLog(`补机器人失败: ${res.error ?? 'unknown'}`);
        return;
      }
      addLog('已加入高级机器人');
    });
  }

  function fillBots() {
    socket.emit('fill_bots', { roomId, level: 'advanced' }, (res: any) => {
      if (!res.ok) {
        addLog(`补满失败: ${res.error ?? 'unknown'}`);
        return;
      }
      addLog(`已补满机器人，新增 ${res.added} 个`);
    });
  }

  function startRound() {
    socket.emit('start_round', { roomId, initiatorId: playerId }, (res: any) => {
      if (!res.ok) {
        addLog(`开始一局失败: ${res.error ?? 'unknown'}`);
        return;
      }
      addLog('开始一局，等待发牌');
    });
  }

  function endDemoRound() {
    if (!room) {
      addLog('请先创建或加入房间');
      return;
    }
    const winner = room.players[0]?.id || playerId;
    const payer = room.players[1]?.id || playerId;
    socket.emit('end_round', {
      roomId,
      winnerId: winner,
      payerId: payer,
      matchedPatterns: [selectedPattern, '碰碰胡']
    }, (res: any) => {
      if (!res.ok) {
        addLog(`结算失败: ${res.error ?? 'unknown'}`);
        return;
      }
      addLog(`本局结算完成: ${JSON.stringify(res.deltas)}`);
    });
  }

  function handleDrawTile() {
    const tile = randTile();
    setSeats((prev) => {
      const next = prev.map((s) => ({ ...s, tiles: [...s.tiles] }));
      const meIdx = next.findIndex((s) => s.isMe);
      if (meIdx >= 0) next[meIdx].tiles.push(tile);
      return next;
    });
    addLog(`摸牌: ${getTileText(tile)}`);
  }

  function handleDiscard() {
    if (!selectedTile) {
      addLog('请先选中一张牌');
      return;
    }
    setLastDiscard(selectedTile);
    setSeats((prev) => {
      const next = prev.map((s) => ({ ...s, tiles: [...s.tiles], discards: [...s.discards] }));
      const meIdx = next.findIndex((s) => s.isMe);
      if (meIdx >= 0) {
        const idx = next[meIdx].tiles.indexOf(selectedTile);
        if (idx >= 0) next[meIdx].tiles.splice(idx, 1);
        next[meIdx].discards.unshift(selectedTile);
      }
      return next;
    });
    addLog(`出牌: ${getTileText(selectedTile)}`);
    setSelectedTile(null);
  }

  const meCards = meSeat.tiles;

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">麻将三人</div>
        <div className="toolbar">
          <input value={playerId} onChange={(e) => setPlayerId(e.target.value)} />
          <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          <input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <input type="number" value={baseMultiplier} onChange={(e) => setBaseMultiplier(Number(e.target.value) || 2)} />
          <button onClick={createRoom}>创建房间</button>
          <button onClick={joinRoom}>加入房间</button>
          <button onClick={addBot}>加机器人</button>
          <button onClick={fillBots}>补满</button>
          <button onClick={startRound}>开始</button>
        </div>
      </header>

      <main className="board">
        <section className="table-area">
          <div className="seat top-seat">
            <div className="seat-head">{seats[0].name}</div>
            <div className="mini-row">
              {seats[0].tiles.map((tile, idx) => (
                <div key={`${tile}-${idx}`} className="mini-back"></div>
              ))}
            </div>
          </div>

          <div className="seat left-seat">
            <div className="seat-head">{seats[1].name}</div>
            <div className="mini-column">
              {seats[1].tiles.map((tile, idx) => (
                <div key={`${tile}-${idx}`} className="mini-back mini-small"></div>
              ))}
            </div>
          </div>

          <div className="center-table">
            <div className="table-meta">
              <span>房间: {room ? room.roomId : '未进入'} </span>
              <span>底分: {baseMultiplier}</span>
            </div>
            <div className="discard-box">
              {lastDiscard ? <TileFace tile={lastDiscard} /> : <span className="empty-box">无出牌</span>}
            </div>
            <div className="center-actions">
              <button onClick={handleDrawTile}>摸牌</button>
              <button onClick={handleDiscard}>出牌</button>
              <button onClick={() => addLog('演示：碰牌')}>碰</button>
              <button onClick={() => addLog('演示：杠牌')}>杠</button>
              <button onClick={() => addLog('演示：和牌')}>和</button>
            </div>
            <div className="combo-row">
              <label>番型</label>
              <select value={selectedPattern} onChange={(e) => setSelectedPattern(e.target.value as PatternKey)}>
                {patternOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button className="primary" onClick={endDemoRound}>结束一局</button>
          </div>

          <div className="seat right-seat">
            <div className="seat-head">{seats[2].name}</div>
            <div className="mini-column">
              {seats[2].tiles.map((tile, idx) => (
                <div key={`${tile}-${idx}`} className="mini-back mini-small"></div>
              ))}
            </div>
          </div>

          <div className="seat bottom-seat">
            <div className="seat-head me">{meSeat.name}</div>
            <div className="hand-row">
              {meCards.map((tile, idx) => (
                <div key={`${tile}-${idx}`} onClick={() => setSelectedTile(tile)}>
                  <TileFace tile={tile} selected={selectedTile === tile} />
                </div>
              ))}
            </div>
            <div className="melds">
              {meSeat.melds.map((m, i) => <span key={i} className="meld-tag">{m}</span>)}
            </div>
          </div>
        </section>

        <aside className="side-panel">
          <div className="panel">
            <h3>总局结果</h3>
            {summary ? (
              <ul className="summary-list">
                {summary.map((item) => (
                  <li key={item.playerId}>
                    <span>{item.playerId}</span>
                    <strong>{item.finalScore}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">尚未结束总局</div>
            )}
          </div>

          <div className="panel">
            <h3>日志</h3>
            <div className="log-list">
              {logs.map((log, idx) => <div key={idx} className="log-item">{log}</div>)}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
