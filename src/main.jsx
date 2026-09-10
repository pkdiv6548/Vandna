import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Home,Search,Library,Compass,Heart,Upload,Settings,Menu,Mic2,ListMusic,AudioLines,Music2} from 'lucide-react';
import {useLocalMusic} from './services/localMusic.js';
import {HomeView,TrackGrid,TrackCard,MiniPlayer,FullPlayer,QueueContent,Drawer,AudioPanel,PageTitle,Empty,Skeleton,fmt} from './components/index.jsx';
import './styles/app.css';

const BUILTIN=[{id:'builtin-dawn',title:'AURALIS Dawn',artist:'AURALIS Sessions',src:'./music/auralis-dawn.wav',source:'local'},{id:'builtin-pulse',title:'AURALIS Pulse',artist:'AURALIS Sessions',src:'./music/auralis-pulse.wav',source:'local'},{id:'builtin-night',title:'AURALIS Night',artist:'AURALIS Sessions',src:'./music/auralis-night.wav',source:'local'}];
const DEMO=[
 {id:'dQw4w9WgXcQ',videoId:'dQw4w9WgXcQ',title:'AURALIS Demo — Discover Music',artist:'AURALIS',artwork:'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',source:'youtube'},
 {id:'9bZkp7q19f0',videoId:'9bZkp7q19f0',title:'Global Pulse',artist:'AURALIS Radio',artwork:'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg',source:'youtube'},
 {id:'kJQP7kiw5Fk',videoId:'kJQP7kiw5Fk',title:'Late Night Atmosphere',artist:'AURALIS Selects',artwork:'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',source:'youtube'}
];
const fallbackLyrics=['A new sound moves through the night','Every rhythm finds its place','Let the atmosphere carry you','One song, one moment, one feeling'];







function App(){
 const local=useLocalMusic();
 const [tab,setTab]=useState(new URLSearchParams(location.search).get('view')||'home');
 const [query,setQuery]=useState(''); const [results,setResults]=useState([]); const [loading,setLoading]=useState(false); const [apiError,setApiError]=useState('');
 const [current,setCurrent]=useState(null); const [playing,setPlaying]=useState(false); const [queue,setQueue]=useState([]); const [queueOpen,setQueueOpen]=useState(false); const [playerOpen,setPlayerOpen]=useState(false); const [lyricsOpen,setLyricsOpen]=useState(false); const [audioOpen,setAudioOpen]=useState(false); const [settingsOpen,setSettingsOpen]=useState(false); const [mobileNav,setMobileNav]=useState(false); const [liked,setLiked]=useState(()=>JSON.parse(localStorage.getItem('auralis-liked')||'[]'));
 const [progress,setProgress]=useState(0); const [duration,setDuration]=useState(0); const [volume,setVolume]=useState(.85); const [shuffle,setShuffle]=useState(false); const [repeat,setRepeat]=useState(false); const [speed,setSpeed]=useState(1); const audioRef=useRef(null); const ytRef=useRef(null); const iframeRef=useRef(null); const timerRef=useRef(null);
 const allTracks=useMemo(()=>[...BUILTIN,...local.tracks,...DEMO], [local.tracks]);
 useEffect(()=>{localStorage.setItem('auralis-liked',JSON.stringify(liked))},[liked]);
 useEffect(()=>{if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{});},[]);
 useEffect(()=>{if(!current)return;setProgress(0);setDuration(0);if(current.source==='local'){const a=audioRef.current;a.src=current.src || URL.createObjectURL(current.blob);a.load();a.volume=volume;a.playbackRate=speed}else{setTimeout(()=>postYT('loadVideoById',{videoId:current.videoId}),100)}},[current]);
 useEffect(()=>{const a=audioRef.current;if(!a)return;const time=()=>{setProgress(a.currentTime);setDuration(a.duration||0)};const end=()=>next();a.addEventListener('timeupdate',time);a.addEventListener('loadedmetadata',time);a.addEventListener('ended',end);return()=>{a.removeEventListener('timeupdate',time);a.removeEventListener('loadedmetadata',time);a.removeEventListener('ended',end)}},[queue,current,shuffle,repeat]);
 useEffect(()=>{if(current?.source==='youtube' && playing)postYT('playVideo')},[playing]);
 useEffect(()=>{if(current?.source==='local'&&audioRef.current)audioRef.current.playbackRate=speed},[speed,current]);
 useEffect(()=>{if(current?.source==='local'&&audioRef.current)audioRef.current.volume=volume;else if(current?.source==='youtube')postYT('setVolume',{volume:Math.round(volume*100)})},[volume,current]);
 useEffect(()=>{if(current?.source==='youtube'){const on=()=>{try{window.addEventListener('message',ytMessage)}catch{}};on();return()=>window.removeEventListener('message',ytMessage)}},[current]);
 function ytMessage(e){try{const d=typeof e.data==='string'?JSON.parse(e.data):e.data;if(d?.event==='infoDelivery'&&d.info){if(Number.isFinite(d.info.currentTime))setProgress(d.info.currentTime);if(Number.isFinite(d.info.duration))setDuration(d.info.duration);if(typeof d.info.playerState==='number'&&d.info.playerState===1)setPlaying(true);}}catch{}}
 function postYT(func,args={}){iframeRef.current?.contentWindow?.postMessage(JSON.stringify({event:'command',func,args}), '*')}
 function play(t){if(!t)return; if(current?.id===t.id){setPlaying(v=>!v); if(t.source==='local'){playing?audioRef.current.pause():audioRef.current.play()}else{playing?postYT('pauseVideo'):postYT('playVideo')}return} setCurrent(t);setQueue(q=>q.some(x=>x.id===t.id)?q:[...q,t]);setPlaying(true);setPlayerOpen(true)}
 useEffect(()=>{if(!current)return;if(current.source==='local'){if(playing)audioRef.current?.play().catch(()=>{});else audioRef.current?.pause()}else if(playing)postYT('playVideo');else postYT('pauseVideo')},[playing,current]);
 function next(){if(!queue.length)return;let i=queue.findIndex(x=>x.id===current?.id);let ni=shuffle?Math.floor(Math.random()*queue.length):i+1;if(ni>=queue.length){if(repeat)ni=0;else{setPlaying(false);return}}setCurrent(queue[ni]);setPlaying(true)}
 function prev(){if(progress>5){seek(0);return}let i=queue.findIndex(x=>x.id===current?.id);if(i>0){setCurrent(queue[i-1]);setPlaying(true)}}
 function seek(v){setProgress(v);if(current?.source==='local'&&audioRef.current)audioRef.current.currentTime=v;else postYT('seekTo',{seconds:v,allowSeekAhead:true})}
 function like(t=current){if(!t)return;setLiked(v=>v.includes(t.id)?v.filter(id=>id!==t.id):[...v,t.id])}
 async function search(e){e?.preventDefault();if(!query.trim())return;setLoading(true);setApiError('');try{const apiBase=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');const endpoint=apiBase+'/api/youtube/search?q='+encodeURIComponent(query.trim());const r=await fetch(endpoint);const d=await r.json();if(!r.ok)throw new Error(d.error||'API request failed');setResults(d.items||[]);setTab('search')}catch(err){setApiError(err.message);setResults([])}finally{setLoading(false)}}
 const hero=allTracks[0]||DEMO[0];
 return <div className="app-shell">
  <audio ref={audioRef} preload="metadata" />
  <aside className={'sidebar '+(mobileNav?'mobile-open':'')}><div className="brand"><span className="brand-mark"><AudioLines size={19}/></span><span>AURALIS</span></div><nav>{[['home','Home',Home],['discover','Discover',Compass],['search','Search',Search],['library','Library',Library]].map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setMobileNav(false)}}><Icon size={19}/>{label}</button>)}</nav><div className="side-label">YOUR MUSIC</div><button onClick={()=>setTab('liked')} className={tab==='liked'?'active':''}><Heart size={19}/>Liked Songs</button><button onClick={()=>setTab('local')} className={tab==='local'?'active':''}><Music2 size={19}/>Local Music</button><button onClick={()=>setTab('queue')} className={tab==='queue'?'active':''}><ListMusic size={19}/>Queue</button><div className="side-bottom"><button onClick={()=>setSettingsOpen(true)}><Settings size={19}/>Settings</button><div className="install-hint">Install AURALIS<br/><small>App-like listening</small></div></div></aside>
  {mobileNav&&<div className="nav-scrim" onClick={()=>setMobileNav(false)}/>} 
  <main className="main">
   <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><form className="searchbar" onSubmit={search}><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search songs, artists, albums..." aria-label="Search music"/><kbd>⌘ K</kbd></form><div className="top-actions"><button className="icon-btn"><Mic2 size={18}/></button><button className="avatar">A</button></div></header>
   <div className="content">
    {tab==='home'&&<HomeView hero={hero} allTracks={allTracks} play={play} liked={liked} like={like} />}
    {tab==='discover'&&<section><PageTitle title="Discover" sub="Fresh sounds, curated for the moment."/><TrackGrid tracks={[...DEMO,...results,...local.tracks]} play={play} liked={liked} like={like}/></section>}
    {tab==='search'&&<section><PageTitle title={query?`Results for “${query}”`:'Search'} sub="Search YouTube music through the secure AURALIS API."/>{loading&&<Skeleton/>}{apiError&&<div className="notice error">{apiError}<button onClick={search}>Retry</button></div>}{!loading&&!apiError&&results.length===0&&<Empty icon={Search} title="Find your next favorite" text="Search for an artist, track, album or mood."/>}{results.length>0&&<TrackGrid tracks={results} play={play} liked={liked} like={like}/>}</section>}
    {tab==='library'&&<section><PageTitle title="Your Library" sub="Everything you saved and imported."/><div className="library-actions"><button className="primary-btn" onClick={()=>document.getElementById('audio-input').click()}><Upload size={17}/> Import local music</button><input id="audio-input" hidden type="file" accept="audio/*" multiple onChange={e=>local.add(e.target.files)}/></div><TrackGrid tracks={local.tracks} play={play} liked={liked} like={like} local remove={local.remove}/></section>}
    {tab==='local'&&<section><PageTitle title="Local Music" sub="Your music stays in your browser."/><div className="library-actions"><button className="primary-btn" onClick={()=>document.getElementById('audio-input').click()}><Upload size={17}/> Import audio files</button></div>{local.tracks.length?<TrackGrid tracks={local.tracks} play={play} liked={liked} like={like} local remove={local.remove}/>:<Empty icon={Music2} title="No local music yet" text="Import MP3, WAV, M4A, AAC or other browser-supported audio files."/>}</section>}
    {tab==='liked'&&<section><PageTitle title="Liked Songs" sub="Your favorites, always close."/><TrackGrid tracks={allTracks.filter(t=>liked.includes(t.id))} play={play} liked={liked} like={like}/></section>}
    {tab==='queue'&&<section><PageTitle title="Queue" sub={`${queue.length} tracks in your listening queue.`}/><QueueContent queue={queue} current={current} play={play} setQueue={setQueue}/></section>}
   </div>
  </main>
  {current&&<MiniPlayer current={current} playing={playing} setPlaying={setPlaying} like={like} liked={liked} open={()=>setPlayerOpen(true)} next={next}/>} 
  {current&&playerOpen&&<FullPlayer current={current} playing={playing} setPlaying={setPlaying} progress={progress} duration={duration} seek={seek} volume={volume} setVolume={setVolume} shuffle={shuffle} setShuffle={setShuffle} repeat={repeat} setRepeat={setRepeat} prev={prev} next={next} like={like} liked={liked} close={()=>setPlayerOpen(false)} openQueue={()=>setQueueOpen(true)} openLyrics={()=>setLyricsOpen(true)} openAudio={()=>setAudioOpen(true)} speed={speed} setSpeed={setSpeed} iframeRef={iframeRef}/>} 
  {current?.source==='youtube'&&<div className="yt-host"><iframe ref={iframeRef} onLoad={()=>{postYT('loadVideoById',{videoId:current.videoId});if(playing)postYT('playVideo')}} title="AURALIS YouTube playback" src={`https://www.youtube.com/embed/${current.videoId}?enablejsapi=1&playsinline=1&origin=${encodeURIComponent(location.origin)}&rel=0`} allow="autoplay; encrypted-media; picture-in-picture"/></div>}
  {queueOpen&&<Drawer title="Queue" close={()=>setQueueOpen(false)}><QueueContent queue={queue} current={current} play={play} setQueue={setQueue}/></Drawer>}
  {lyricsOpen&&<Drawer title="Lyrics" close={()=>setLyricsOpen(false)}><div className="lyrics"><span>NOW PLAYING</span>{fallbackLyrics.map((x,i)=><p className={i===1?'current':''} key={x}>{x}</p>)}</div></Drawer>}
  {audioOpen&&<Drawer title="Audio & Playback" close={()=>setAudioOpen(false)}><AudioPanel volume={volume} setVolume={setVolume} speed={speed} setSpeed={setSpeed}/></Drawer>}
  {settingsOpen&&<Drawer title="Settings" close={()=>setSettingsOpen(false)}><div className="settings-list"><div><b>PWA</b><span>Installable standalone experience</span></div><div><b>Playback</b><span>Gapless-ready · Crossfade-ready · Loudness-ready</span></div><div><b>API</b><span>Server-side YouTube Data API via Vercel</span></div></div></Drawer>}
 </div>
}















createRoot(document.getElementById('root')).render(<App/>);
