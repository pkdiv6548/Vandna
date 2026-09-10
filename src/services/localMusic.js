import {useEffect,useState} from 'react';

const DB_NAME = 'auralis-db';
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('tracks'))r.result.createObjectStore('tracks',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function getAll(db){return new Promise((res,rej)=>{const r=db.transaction('tracks').objectStore('tracks').getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function put(db,v){return new Promise((res,rej)=>{const r=db.transaction('tracks','readwrite').objectStore('tracks').put(v);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function del(db,id){return new Promise((res,rej)=>{const r=db.transaction('tracks','readwrite').objectStore('tracks').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}

function useLocalMusic(){
 const [tracks,setTracks]=useState([]);
 useEffect(()=>{(async()=>{const db=await openDB();const all=await getAll(db);setTracks(all)})()},[]);
 async function add(files){const db=await openDB();const added=[];for(const f of [...files]){if(!f.type.startsWith('audio/'))continue;const id='local-'+crypto.randomUUID();const t={id,title:f.name.replace(/\.[^.]+$/,''),artist:'Local Music',artwork:'',source:'local',mime:f.type,blob:f};await put(db,t);added.push(t)}setTracks(v=>[...v,...added])}
 async function remove(id){const db=await openDB();await del(db,id);setTracks(v=>v.filter(t=>t.id!==id))}
 return {tracks,add,remove};
}

export {useLocalMusic,openDB,getAll,put,del};
