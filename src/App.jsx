import React, { useEffect, useMemo, useRef, useState } from "react";
import payFlowLogo from "./assets/pay-flow-logo.svg";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const STORAGE = "payflow.react.";
const nav = [
  ["dashboard", "Dashboard", "bi-grid-1x2"],
  ["market", "Market", "bi-activity"],
  ["portfolio", "Portfolio", "bi-briefcase"],
  ["orders", "Orders", "bi-receipt"],
  ["watchlist", "Watchlist", "bi-heart"],
  ["profile", "Profile", "bi-person"],
  ["settings", "Settings", "bi-sliders"]
];

const seeds = [
  ["RELIANCE", "Reliance Industries", "Energy", 2920, 3100000], ["TCS", "Tata Consultancy Services", "IT", 3885, 1430000],
  ["INFY", "Infosys", "IT", 1514, 3580000], ["HDFCBANK", "HDFC Bank", "Banking", 1658, 5020000],
  ["ICICIBANK", "ICICI Bank", "Banking", 1188, 4310000], ["SBIN", "State Bank of India", "Banking", 832, 7840000],
  ["LT", "Larsen & Toubro", "Infra", 3598, 910000], ["ITC", "ITC", "FMCG", 444, 5480000],
  ["BEL", "Bharat Electronics", "Defence", 312, 9880000], ["HAL", "Hindustan Aeronautics", "Defence", 4884, 820000],
  ["NTPC", "NTPC", "Power", 371, 6730000], ["POWERGRID", "Power Grid Corp", "Power", 346, 4690000],
  ["WIPRO", "Wipro", "IT", 538, 3010000], ["MARUTI", "Maruti Suzuki", "Auto", 12680, 210000],
  ["SUNPHARMA", "Sun Pharma", "Pharma", 1588, 1320000], ["DMART", "Avenue Supermarts", "Retail", 4740, 190000],
  ["ADANIPORTS", "Adani Ports", "Infra", 1496, 1760000], ["ONGC", "Oil & Natural Gas", "Energy", 296, 9280000],
  ["AXISBANK", "Axis Bank", "Banking", 1245, 2890000], ["TATAMOTORS", "Tata Motors", "Auto", 978, 7450000],
  ["BAJFINANCE", "Bajaj Finance", "Financials", 7190, 410000], ["KOTAKBANK", "Kotak Mahindra Bank", "Banking", 1815, 1260000],
  ["HINDUNILVR", "Hindustan Unilever", "FMCG", 2630, 670000], ["BHARTIARTL", "Bharti Airtel", "Telecom", 1438, 2300000],
  ["COALINDIA", "Coal India", "Energy", 492, 5160000], ["TITAN", "Titan Company", "Retail", 3388, 690000],
  ["ULTRACEMCO", "UltraTech Cement", "Infra", 11210, 87000], ["NESTLEIND", "Nestle India", "FMCG", 2504, 380000], ["M&M", "Mahindra & Mahindra", "Auto", 2888, 1130000],
  ["BAJAJFINSV", "Bajaj Finserv", "Financials", 1624, 980000], ["JSWSTEEL", "JSW Steel", "Metals", 928, 1420000]
];

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(STORAGE + key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => localStorage.setItem(STORAGE + key, JSON.stringify(value));
const rupee = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const fmt = value => new Intl.NumberFormat("en-IN").format(Math.round(Number(value || 0)));
const pct = value => `${Number(value || 0).toFixed(2)}%`;
const fees = amount => ({ brokerage: Math.min(20, amount * .0003), gst: Math.min(20, amount * .0003) * .18, stt: amount * .0001 });

function createStocks() {
  return seeds.map(([symbol, company, sector, price, volume], index) => {
    const previousClose = +(price * (1 + (index % 7 - 3) / 100)).toFixed(2);
    const history = Array.from({ length: 300 }, (_, i) => +(price + Math.sin((i + index) / 8) * price * .012 + Math.cos(i / 15) * price * .005).toFixed(2));
    const current = history.at(-1);
    return { symbol, company, sector, price: current, open: +(previousClose * (1 + (index % 5 - 2) / 500)).toFixed(2), previousClose, dayHigh: Math.max(...history.slice(-50)), dayLow: Math.min(...history.slice(-50)), volume, history, change: +(current - previousClose).toFixed(2), changePct: +(((current - previousClose) / previousClose) * 100).toFixed(2), marketCap: `${(price * (index + 28) / 10).toFixed(1)}K Cr`, yearHigh: +(price * 1.18).toFixed(2), yearLow: +(price * .72).toFixed(2), volatility: .00025 + (index % 10) * .00012, volumes: Array.from({ length: 300 }, () => Math.floor(volume / 260 + Math.random() * volume / 220)) };
  });
}

function getMarketStatus(now = new Date()) {
  const open = new Date(now); open.setHours(6, 0, 0, 0);
  const close = new Date(now); close.setHours(23, 0, 0, 0);
  const isOpen = now >= open && now <= close;
  const target = isOpen ? close : nextOpen(now);
  const seconds = Math.max(0, Math.floor((target - now) / 1000));
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return { isOpen, label: isOpen ? "Market Open" : "Market Closed", clock: `${h}h ${m}m ${s}s` };
}
function nextOpen(now) {
  const next = new Date(now); next.setHours(6, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return next;
}
function moveStock(stock) {
  const spike = Math.random() > .985 ? (Math.random() - .5) * stock.volatility * 10 : 0;
  const price = Math.max(1, stock.price * (1 + (Math.random() - .5) * stock.volatility * 2 + spike));
  const volumeAdd = Math.floor(Math.random() * stock.volume / 850) + 1;
  const next = { ...stock, price: +price.toFixed(2), volume: stock.volume + volumeAdd };
  next.dayHigh = Math.max(stock.dayHigh, next.price);
  next.dayLow = Math.min(stock.dayLow, next.price);
  next.change = +(next.price - stock.previousClose).toFixed(2);
  next.changePct = +((next.change / stock.previousClose) * 100).toFixed(2);
  next.history = [...stock.history.slice(-299), next.price];
  next.volumes = [...stock.volumes.slice(-299), volumeAdd];
  return next;
}

function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  useEffect(() => write(key, value), [key, value]);
  return [value, setValue];
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [stocks, setStocks] = useState(createStocks);
  const [wallet, setWallet] = useLocalState("wallet", 100000);
  const [portfolio, setPortfolio] = useLocalState("portfolio", {});
  const [orders, setOrders] = useLocalState("orders", []);
  const [watchlist, setWatchlist] = useLocalState("watchlist", []);
  const [dark, setDark] = useLocalState("dark", false);
  const [settings, setSettings] = useLocalState("settings", { alerts: [] });
  const [paymentMethods, setPaymentMethods] = useLocalState("paymentMethods", ["UPI", "Debit Card", "Net Banking"]);
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [trade, setTrade] = useState(null);
  const [addMoney, setAddMoney] = useState(false);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState(getMarketStatus());

  useEffect(() => { document.body.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => {
    const timer = setInterval(() => setStatus(getMarketStatus()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!status.isOpen) return;
    const timer = setInterval(() => setStocks(list => list.map(moveStock)), 150);
    return () => clearInterval(timer);
  }, [status.isOpen]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const bySymbol = useMemo(() => Object.fromEntries(stocks.map(s => [s.symbol, s])), [stocks]);
  const holdings = useMemo(() => Object.values(portfolio).map(h => {
    const stock = bySymbol[h.symbol];
    const currentValue = (stock?.price || 0) * h.qty;
    const pnl = currentValue - h.invested;
    return { ...h, stock, currentValue, pnl, pnlPct: h.invested ? pnl / h.invested * 100 : 0 };
  }), [portfolio, bySymbol]);
  const summary = useMemo(() => {
    const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
    const value = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const pnl = value - invested;
    const today = holdings.reduce((sum, h) => sum + ((h.stock?.price || 0) - (h.stock?.open || 0)) * h.qty, 0);
    return { invested, value, pnl, pnlPct: invested ? pnl / invested * 100 : 0, today };
  }, [holdings]);

  const viewProps = { stocks, bySymbol, wallet, setWallet, portfolio, setPortfolio, orders, setOrders, watchlist, setWatchlist, settings, setSettings, paymentMethods, setPaymentMethods, query, setQuery, setDrawer, setTrade, setAddMoney, setToast, holdings, summary, marketOpen: status.isOpen };

  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage} />
    <Topbar status={status} wallet={wallet} query={query} setQuery={setQuery} setPage={setPage} dark={dark} setDark={setDark} setAddMoney={setAddMoney} />
    <main className="content">
      {page === "dashboard" && <Dashboard {...viewProps} setPage={setPage} />}
      {page === "market" && <Market {...viewProps} />}
      {page === "portfolio" && <Portfolio {...viewProps} />}
      {page === "orders" && <Orders {...viewProps} />}
      {page === "watchlist" && <Watchlist {...viewProps} />}
      {page === "profile" && <Profile {...viewProps} />}
      {page === "settings" && <Settings {...viewProps} />}
    </main>
    <MobileNav page={page} setPage={setPage} />
    {drawer && <StockDrawer stock={bySymbol[drawer.symbol] || drawer} onClose={() => setDrawer(null)} setTrade={setTrade} />}
    {trade && <TradeModal trade={trade} {...viewProps} onClose={() => setTrade(null)} />}
    {addMoney && <AddMoneyModal {...viewProps} onClose={() => setAddMoney(false)} />}
    {toast && <div className="toast-card">{toast}</div>}
  </div>;
}

function Sidebar({ page, setPage }) {
  return <aside className="sidebar"><button className="brand" onClick={() => setPage("dashboard")}><img src={payFlowLogo} alt="Pay Flow" /></button><nav>{nav.map(([id, label, icon]) => <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}><i className={`bi ${icon}`} />{label}</button>)}</nav></aside>;
}
function MobileNav({ page, setPage }) {
  return <nav className="mobile-nav">{nav.slice(0, 5).map(([id, label, icon]) => <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}><i className={`bi ${icon}`} /><span>{label}</span></button>)}</nav>;
}
function Topbar({ status, wallet, query, setQuery, setPage, dark, setDark, setAddMoney }) {
  return <header className="topbar"><div className="search"><i className="bi bi-search" /><input value={query} onChange={e => { setQuery(e.target.value); setPage("market"); }} placeholder="Search ticker, company, sector" /></div><div className="market-pill"><span className={status.isOpen ? "dot open" : "dot"} /> <b>{status.label}</b><small>{status.isOpen ? "Closes" : "Opens"} in {status.clock}</small></div><div className="wallet"><small>Wallet</small><b>{rupee(wallet)}</b><button className="wallet-add" onClick={() => setAddMoney(true)} title="Add money"><i className="bi bi-plus-lg" /></button></div><button className="icon-btn"><i className="bi bi-bell" /></button><button className="icon-btn" onClick={() => setDark(!dark)}><i className={`bi ${dark ? "bi-sun" : "bi-moon"}`} /></button><div className="avatar"><i className="bi bi-person" /></div></header>;
}
function PageTitle({ title, subtitle, action }) { return <div className="page-title"><div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }
function Stat({ label, value, sub, tone }) { return <section className="stat-card"><span>{label}</span><strong className={tone || ""}>{value}</strong><small>{sub}</small></section>; }

function Dashboard(props) {
  const gainers = [...props.stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 6);
  const active = [...props.stocks].sort((a, b) => b.volume - a.volume).slice(0, 5);
  return <><PageTitle title="Pay Flow" subtitle="A polished offline simulator for learning Indian stock trading." action={<div className="title-actions"><button className="secondary" onClick={() => props.setAddMoney(true)}><i className="bi bi-wallet2" /> Add Money</button><button className="primary" onClick={() => props.setPage("market")}>Open Market</button></div>} />
    <div className="stats-grid"><Stat label="Wallet" value={rupee(props.wallet)} sub="Demo buying power" /><Stat label="Portfolio" value={rupee(props.summary.value)} sub={`${props.holdings.length} holdings`} /><Stat label="Total P/L" value={rupee(props.summary.pnl)} sub={pct(props.summary.pnlPct)} tone={props.summary.pnl >= 0 ? "up" : "down"} /><Stat label="Today" value={rupee(props.summary.today)} sub="Open to now" tone={props.summary.today >= 0 ? "up" : "down"} /></div>
    <div className="ticker">Nifty breadth improves in the demo market • IT stocks recover • Defence names stay active • Energy majors edge higher • FMCG shows defensive buying</div>
    <div className="two-col"><Panel title="Top Gainers"><StockTable {...props} stocks={gainers} compact /></Panel><Panel title="Most Active"><MiniList {...props} stocks={active} /></Panel></div>
    <div className="two-col lower"><Panel title="Portfolio Growth"><LineChart stock={{ symbol: "Portfolio", history: props.holdings.length ? props.holdings.map(h => h.currentValue).concat(Array(30).fill(props.summary.value)) : props.stocks[0].history, changePct: props.summary.pnlPct }} /></Panel><Panel title="Market Heatmap"><Heatmap stocks={props.stocks.slice(0, 15)} setDrawer={props.setDrawer} /></Panel></div></>;
}
function Market(props) {
  const [sector, setSector] = useState("All"), [mover, setMover] = useState("All"), [range, setRange] = useState("All");
  const sectors = ["All", ...new Set(props.stocks.map(s => s.sector))];
  let list = props.stocks.filter(s => (!props.query || `${s.symbol} ${s.company} ${s.sector}`.toLowerCase().includes(props.query.toLowerCase())) && (sector === "All" || s.sector === sector) && (range === "All" || (range === "Under 500" && s.price < 500) || (range === "500-2000" && s.price >= 500 && s.price <= 2000) || (range === "2000+" && s.price > 2000)));
  if (mover === "Top Gainers") list = list.filter(s => s.changePct >= 0).sort((a, b) => b.changePct - a.changePct);
  if (mover === "Top Losers") list = list.filter(s => s.changePct < 0).sort((a, b) => a.changePct - b.changePct);
  return <><PageTitle title="Market" subtitle="Live simulated prices update independently every 150ms when the market is open." /><Panel><div className="filters"><input value={props.query} onChange={e => props.setQuery(e.target.value)} placeholder="Search stocks" /><select value={sector} onChange={e => setSector(e.target.value)}>{sectors.map(s => <option key={s}>{s}</option>)}</select><select value={mover} onChange={e => setMover(e.target.value)}>{["All", "Top Gainers", "Top Losers"].map(s => <option key={s}>{s}</option>)}</select><select value={range} onChange={e => setRange(e.target.value)}>{["All", "Under 500", "500-2000", "2000+"].map(s => <option key={s}>{s}</option>)}</select></div><StockTable {...props} stocks={list} /></Panel></>;
}
function Portfolio(props) { return <><PageTitle title="Portfolio" subtitle="Track holdings, allocation, daily movement and performance." action={<span className="score">Score {Math.max(0, Math.min(100, Math.round(55 + props.summary.pnlPct * 4 + props.holdings.length * 3)))}/100</span>} /><div className="stats-grid"><Stat label="Investment" value={rupee(props.summary.invested)} sub="Total deployed" /><Stat label="Current Value" value={rupee(props.summary.value)} sub="Live value" /><Stat label="Profit / Loss" value={rupee(props.summary.pnl)} sub={pct(props.summary.pnlPct)} tone={props.summary.pnl >= 0 ? "up" : "down"} /><Stat label="Daily Tracker" value={rupee(props.summary.today)} sub="Open to now" tone={props.summary.today >= 0 ? "up" : "down"} /></div><Panel title="Holdings"><HoldingsTable holdings={props.holdings} setDrawer={props.setDrawer} /></Panel></>; }
function Orders({ orders }) { const exportCsv = () => { const rows = [["Type", "Stock", "Date", "Time", "Price", "Qty", "Status"], ...orders.map(o => [o.side, o.symbol, o.date, o.time, o.price, o.qty, o.status])]; const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "pay-flow-orders.csv"; a.click(); }; return <><PageTitle title="Orders" subtitle="Executed and pending demo trades, newest first." action={<button className="secondary" onClick={exportCsv}><i className="bi bi-download" /> Export CSV</button>} /><Panel><OrdersTable orders={orders} /></Panel></>; }
function Watchlist(props) { const list = props.stocks.filter(s => props.watchlist.includes(s.symbol)); return <><PageTitle title="Watchlist" subtitle="Stocks you want to keep close." /><Panel>{list.length ? <StockTable {...props} stocks={list} /> : <Empty text="No watchlisted stocks yet." />}</Panel></>; }
function Profile({ wallet, orders, summary, holdings, setAddMoney }) { return <><PageTitle title="Demo User" subtitle="Educational simulator account." action={<div className="profile-avatar"><i className="bi bi-person" /></div>} /><div className="stats-grid"><Stat label="Wallet" value={rupee(wallet)} sub="Available cash" /><Stat label="Orders" value={fmt(orders.length)} sub="Executed trades" /><Stat label="Portfolio" value={rupee(summary.value)} sub={`${holdings.length} holdings`} /><Stat label="Profit" value={rupee(summary.pnl)} sub={pct(summary.pnlPct)} tone={summary.pnl >= 0 ? "up" : "down"} /></div></>; }
function Settings({ settings, setSettings, setToast }) { const [symbol, setSymbol] = useState(""), [price, setPrice] = useState(""); return <><PageTitle title="Settings" subtitle="Local preferences and simulated alerts." /><Panel title="Price Alerts"><div className="settings-form"><input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol, e.g. RELIANCE" /><input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="Alert above price" /><button className="primary" onClick={() => { if (!symbol || !price) return; setSettings({ ...settings, alerts: [...(settings.alerts || []), { symbol, price: Number(price) }] }); setToast("Price alert saved"); setSymbol(""); setPrice(""); }}>Save Alert</button></div><div className="chips">{(settings.alerts || []).map((a, i) => <span key={i}>{a.symbol} above {rupee(a.price)}</span>)}</div></Panel></>; }

function Panel({ title, children }) { return <section className="panel">{title && <div className="panel-head"><h2>{title}</h2></div>}{children}</section>; }
function StockTable({ stocks, setDrawer, setTrade, watchlist, setWatchlist, setToast }) { const toggle = symbol => { const next = watchlist.includes(symbol) ? watchlist.filter(s => s !== symbol) : [...watchlist, symbol]; setWatchlist(next); setToast(watchlist.includes(symbol) ? "Removed from Watchlist" : "Added to Watchlist"); }; return <div className="table-wrap"><table><thead><tr><th>Company</th><th>Price</th><th>Change</th><th>Volume</th><th>Trade</th><th></th></tr></thead><tbody>{stocks.map(s => <tr key={s.symbol}><td onClick={() => setDrawer(s)}><b>{s.symbol}</b><small>{s.company}</small></td><td><strong>{rupee(s.price)}</strong></td><td className={s.changePct >= 0 ? "up" : "down"}>{rupee(s.change)}<small>{pct(s.changePct)}</small></td><td>{fmt(s.volume)}</td><td><button className="buy" onClick={() => setTrade({ side: "Buy", stock: s })}>Buy</button><button className="sell" onClick={() => setTrade({ side: "Sell", stock: s })}>Sell</button></td><td><button className="watch" onClick={() => toggle(s.symbol)}><i className={`bi ${watchlist.includes(s.symbol) ? "bi-heart-fill" : "bi-heart"}`} /></button></td></tr>)}</tbody></table></div>; }
function HoldingsTable({ holdings, setDrawer }) { if (!holdings.length) return <Empty text="No holdings yet. Buy a stock from Market to start." />; return <div className="table-wrap"><table><thead><tr><th>Stock</th><th>Avg</th><th>Current</th><th>Qty</th><th>Investment</th><th>Value</th><th>P/L</th></tr></thead><tbody>{holdings.map(h => <tr key={h.symbol} onClick={() => setDrawer(h.stock)}><td><b>{h.symbol}</b><small>{h.stock?.company}</small></td><td>{rupee(h.avg)}</td><td>{rupee(h.stock?.price)}</td><td>{h.qty}</td><td>{rupee(h.invested)}</td><td>{rupee(h.currentValue)}</td><td className={h.pnl >= 0 ? "up" : "down"}>{rupee(h.pnl)}<small>{pct(h.pnlPct)}</small></td></tr>)}</tbody></table></div>; }
function OrdersTable({ orders }) { if (!orders.length) return <Empty text="No orders yet." />; return <div className="table-wrap"><table><thead><tr><th>Type</th><th>Stock</th><th>Date</th><th>Time</th><th>Price</th><th>Qty</th><th>Status</th></tr></thead><tbody>{orders.map(o => <tr key={o.id}><td className={o.side === "Buy" ? "up" : o.side === "Sell" ? "down" : ""}>{o.side}</td><td>{o.symbol}</td><td>{o.date}</td><td>{o.time}</td><td>{rupee(o.price)}</td><td>{o.qty}</td><td><span className={`status-pill status-${String(o.status).toLowerCase()}`}>{o.status}</span></td></tr>)}</tbody></table></div>; }
function MiniList({ stocks, setDrawer }) { return <div className="mini-list">{stocks.map(s => <button key={s.symbol} onClick={() => setDrawer(s)}><b>{s.symbol}</b><span>{rupee(s.price)}</span><em className={s.changePct >= 0 ? "up" : "down"}>{pct(s.changePct)}</em></button>)}</div>; }
function Heatmap({ stocks, setDrawer }) { return <div className="heatmap">{stocks.map(s => <button key={s.symbol} onClick={() => setDrawer(s)} className={s.changePct >= 0 ? "heat up-bg" : "heat down-bg"} title={`${s.symbol} ${pct(s.changePct)}`}><b>{s.symbol}</b><span>{pct(s.changePct)}</span></button>)}</div>; }
function Empty({ text }) { return <div className="empty">{text}</div>; }

function LineChart({ stock, indicators = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const chart = new Chart(canvas, { type: "line", data: { labels: stock.history.map((_, i) => i), datasets: [{ label: stock.symbol, data: stock.history, borderColor: stock.changePct >= 0 ? "#00c853" : "#e53935", backgroundColor: "rgba(0,200,83,.12)", fill: true, tension: .42, pointRadius: 0 }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { color: "rgba(148,163,184,.18)" } } } } });
    return () => chart.destroy();
  }, [stock]);
  return <div className="chart-box"><canvas ref={ref} /></div>;
}
function StockDrawer({ stock, onClose, setTrade }) { const [indicator, setIndicator] = useState("SMA 20"); return <div className="overlay" onClick={onClose}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><h2>{stock.symbol}</h2><p>{stock.company}</p></div><button className="icon-btn" onClick={onClose}><i className="bi bi-x-lg" /></button></div><div className="quote"><strong>{rupee(stock.price)}</strong><span className={stock.changePct >= 0 ? "up" : "down"}>{rupee(stock.change)} ({pct(stock.changePct)})</span></div><div className="segments">{["1M", "5M", "15M", "1H", "1D"].map(x => <button key={x}>{x}</button>)}</div><div className="segments subtle">{["SMA 20", "SMA 50", "EMA 20", "VWAP"].map(x => <button key={x} className={indicator === x ? "active" : ""} onClick={() => setIndicator(x)}>{x}</button>)}</div><LineChart stock={stock} /><div className="metrics"><Stat label="Open" value={rupee(stock.open)} sub="Today" /><Stat label="Prev Close" value={rupee(stock.previousClose)} sub="Prior" /><Stat label="High" value={rupee(stock.dayHigh)} sub="Day" /><Stat label="Low" value={rupee(stock.dayLow)} sub="Day" /><Stat label="Market Cap" value={stock.marketCap} sub={stock.sector} /><Stat label="52W" value={`${rupee(stock.yearLow)} - ${rupee(stock.yearHigh)}`} sub="Range" /></div><div className="drawer-actions"><button className="primary" onClick={() => setTrade({ side: "Buy", stock })}>Buy</button><button className="danger" onClick={() => setTrade({ side: "Sell", stock })}>Sell</button></div></aside></div>; }
function AddMoneyModal({ wallet, setWallet, orders, setOrders, paymentMethods, setPaymentMethods, onClose, setToast }) {
  const [amount, setAmount] = useState(5000);
  const [method, setMethod] = useState("UPI");
  const [newMethod, setNewMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [bank, setBank] = useState("");
  const [bankUser, setBankUser] = useState("");
  const [walletProvider, setWalletProvider] = useState(paymentMethods[0] || "UPI");
  const [walletMobile, setWalletMobile] = useState("");
  const [error, setError] = useState("");
  const cleanAmount = Math.floor(Number(amount || 0));
  const maxTopUpAmount = 1000000;
  const safeAmount = Math.max(0, cleanAmount);
  const convenienceFee = Math.round(safeAmount * .0018);
  const payable = safeAmount + convenienceFee;
  const methods = [
    ["UPI", "bi-qr-code", "Pay by any UPI app"],
    ["Card", "bi-credit-card", "Visa, Mastercard, RuPay"],
    ["Net Banking", "bi-bank", "All major banks"],
    ["Wallet", "bi-wallet2", "Saved demo wallets"]
  ];
  const addMethod = () => {
    const value = newMethod.trim();
    if (!value) return setError("Enter a wallet or payment app name before saving.");
    if (!paymentMethods.includes(value)) setPaymentMethods([...paymentMethods, value]);
    setWalletProvider(value);
    setMethod("Wallet");
    setNewMethod("");
    setError("");
  };
  const validate = () => {
    if (!Number.isFinite(cleanAmount) || cleanAmount < 100) return "Minimum top-up amount is ₹100.";
    if (cleanAmount > maxTopUpAmount) return "Top-up above ₹10,00,000 is not allowed.";
    if (method === "UPI" && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) return "Enter a valid UPI ID, for example name@upi.";
    if (method === "Card") {
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 12 || digits.length > 19) return "Enter a valid card number.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) return "Enter expiry in MM/YY format.";
      if (!/^\d{3,4}$/.test(cardCvv.trim())) return "Enter a valid CVV.";
      if (cardName.trim().length < 3) return "Enter the cardholder name.";
    }
    if (method === "Net Banking") {
      if (!bank) return "Select your bank.";
      if (bankUser.trim().length < 4) return "Enter your customer ID or user ID.";
    }
    if (method === "Wallet") {
      if (!walletProvider) return "Select a wallet provider.";
      if (!/^\d{10}$/.test(walletMobile.trim())) return "Enter a valid 10-digit mobile number linked to the wallet.";
    }
    return "";
  };
  const confirm = () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setWallet(wallet + cleanAmount);
    setOrders([{ id: crypto.randomUUID(), side: "Wallet Top-up", symbol: method, date: new Date().toLocaleDateString("en-IN"), time: new Date().toLocaleTimeString("en-IN"), price: cleanAmount, qty: 1, status: "Added" }, ...orders]);
    setToast(`Added ${rupee(cleanAmount)} to wallet`);
    onClose();
  };
  return <div className="overlay checkout-overlay"><section className="checkout-modal"><div className="checkout-brand"><div><span className="checkout-logo">PF</span><div><h2>Pay Flow Checkout</h2><p>Secure demo payment gateway</p></div></div><button className="icon-btn" onClick={onClose}><i className="bi bi-x-lg" /></button></div><div className="checkout-secure"><i className="bi bi-shield-lock" /> 256-bit encrypted simulator checkout. No real money is processed.</div><div className="checkout-grid"><aside className="method-panel"><h3>Payment Method</h3>{methods.map(([name, icon, sub]) => <button key={name} className={method === name ? "method-option active" : "method-option"} onClick={() => { setMethod(name); setError(""); }}><i className={`bi ${icon}`} /><span><b>{name}</b><small>{sub}</small></span></button>)}</aside><div className="payment-panel"><div className="amount-box"><label>Amount to add<input type="number" min="100" step="100" value={amount} onChange={e => setAmount(e.target.value)} /></label><div className="quick-amounts checkout-quick">{[1000, 5000, 10000, 25000].map(value => <button key={value} onClick={() => setAmount(value)}>{rupee(value)}</button>)}</div></div>{error && <div className="payment-error"><i className="bi bi-exclamation-circle" /> {error}</div>}{method === "UPI" && <div className="pay-form"><label>UPI ID<input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@upi" /></label><div className="qr-card"><i className="bi bi-qr-code" /><span>Enter UPI ID or scan preview to continue</span></div></div>}{method === "Card" && <div className="pay-form"><label>Card number<input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" inputMode="numeric" /></label><div className="split"><label>Expiry<input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/YY" /></label><label>CVV<input value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="123" inputMode="numeric" /></label></div><label>Name on card<input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Cardholder name" /></label></div>}{method === "Net Banking" && <div className="pay-form"><label>Select bank<select value={bank} onChange={e => setBank(e.target.value)}><option value="" disabled>Choose your bank</option><option>HDFC Bank</option><option>ICICI Bank</option><option>State Bank of India</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option></select></label><label>Customer ID / User ID<input value={bankUser} onChange={e => setBankUser(e.target.value)} placeholder="Enter net banking user ID" /></label></div>}{method === "Wallet" && <div className="pay-form"><label>Saved demo wallet<select value={walletProvider} onChange={e => setWalletProvider(e.target.value)}>{paymentMethods.map(item => <option key={item}>{item}</option>)}</select></label><label>Linked mobile number<input value={walletMobile} onChange={e => setWalletMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" /></label><div className="method-row"><input value={newMethod} onChange={e => setNewMethod(e.target.value)} placeholder="Add wallet, e.g. PhonePe" /><button className="secondary" onClick={addMethod}>Save</button></div></div>}</div><aside className="summary-panel"><h3>Order Summary</h3><span><small>Merchant</small><b>Pay Flow Simulator</b></span><span><small>Current wallet</small><b>{rupee(wallet)}</b></span><span><small>Top-up amount</small><b>{rupee(safeAmount)}</b></span><span><small>Gateway fee</small><b>{rupee(convenienceFee)}</b></span><strong><small>Total payable</small><b>{rupee(payable)}</b></strong><button className="pay-now" onClick={confirm}><i className="bi bi-lock-fill" /> Pay {rupee(payable)}</button><p>Funds credited only after valid demo payment details are entered.</p></aside></div></section></div>;
}
function TradeModal({ trade, wallet, setWallet, portfolio, setPortfolio, orders, setOrders, holdings, onClose, setToast, marketOpen }) {
  const [qty, setQty] = useState(1);
  const stock = trade.stock;
  const side = trade.side;
  const base = stock.price * qty;
  const f = fees(base);
  const totalFees = f.brokerage + f.gst + f.stt;
  const total = side === "Buy" ? base + totalFees : base - totalFees;
  const holding = holdings.find(h => h.symbol === stock.symbol);
  const addOrder = status => setOrders([{ id: crypto.randomUUID(), side, symbol: stock.symbol, date: new Date().toLocaleDateString("en-IN"), time: new Date().toLocaleTimeString("en-IN"), price: stock.price, qty, status }, ...orders]);
  const confirm = () => {
    const marketOpenNow = getMarketStatus().isOpen;
    if (!marketOpenNow) {
      if (side === "Buy" && wallet < total) return setToast("Insufficient wallet balance");
      if (side === "Sell" && (!holding || holding.qty < qty)) return setToast("Sell owned stocks only");
      addOrder("Pending");
      setToast("Market closed. Order queued for next session");
      onClose();
      return;
    }
    if (side === "Buy") {
      if (wallet < total) return setToast("Insufficient wallet balance");
      const current = portfolio[stock.symbol] || { symbol: stock.symbol, qty: 0, avg: 0, invested: 0 };
      const invested = current.invested + base;
      const newQty = current.qty + qty;
      setPortfolio({ ...portfolio, [stock.symbol]: { symbol: stock.symbol, qty: newQty, avg: invested / newQty, invested } });
      setWallet(wallet - total);
      setToast("Stock Purchased");
    } else {
      if (!holding || holding.qty < qty) return setToast("Sell owned stocks only");
      const next = { ...portfolio };
      const remain = holding.qty - qty;
      if (remain <= 0) delete next[stock.symbol];
      else next[stock.symbol] = { ...next[stock.symbol], qty: remain, invested: next[stock.symbol].avg * remain };
      setPortfolio(next);
      setWallet(wallet + total);
      setToast("Stock Sold");
    }
    addOrder("Executed");
    onClose();
  };
  return <div className="overlay"><section className="trade-modal"><div className="drawer-head"><div><h2>{side} {stock.symbol}</h2><p>{stock.company}</p></div><button className="icon-btn" onClick={onClose}><i className="bi bi-x-lg" /></button></div>{!marketOpen && <div className="market-note"><i className="bi bi-clock" /> Market is closed. This order will be marked Pending.</div>}<label>Quantity<input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, Math.floor(Number(e.target.value || 1))))} /></label><div className="bill"><span>Price <b>{rupee(stock.price)}</b></span><span>Estimated {side === "Buy" ? "Cost" : "Value"} <b>{rupee(base)}</b></span><span>Brokerage <b>{rupee(f.brokerage)}</b></span><span>GST <b>{rupee(f.gst)}</b></span><span>STT <b>{rupee(f.stt)}</b></span>{side === "Sell" && <span>Profit/Loss <b className={stock.price >= (holding?.avg || 0) ? "up" : "down"}>{rupee(((stock.price - (holding?.avg || 0)) * qty) - totalFees)}</b></span>}<strong>Total <b>{rupee(total)}</b></strong></div><button className={side === "Buy" ? "primary wide" : "danger wide"} onClick={confirm}>{marketOpen ? `Confirm ${side}` : `Place Pending ${side}`}</button></section></div>;
}
export default App;