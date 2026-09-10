export default async function handler(req, res) {
  res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const q = String(req.query?.q || '').trim();
  const maxResults = Math.min(Math.max(Number(req.query?.limit || 12), 1), 25);
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(500).json({error:'YOUTUBE_API_KEY is not configured on the server.'});
  if (!q) return res.status(400).json({error:'Search query is required.'});
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part','snippet');
    url.searchParams.set('type','video');
    url.searchParams.set('videoCategoryId','10');
    url.searchParams.set('maxResults',String(maxResults));
    url.searchParams.set('q',q);
    url.searchParams.set('key',key);
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({error:data?.error?.message || 'YouTube API request failed.'});
    const items = (data.items || []).map(item => ({
      id:item.id?.videoId,
      videoId:item.id?.videoId,
      title:item.snippet?.title || 'Untitled',
      artist:item.snippet?.channelTitle || 'YouTube Music',
      channel:item.snippet?.channelTitle || '',
      artwork:item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      publishedAt:item.snippet?.publishedAt || '',
      source:'youtube',
      type:'video'
    })).filter(x=>x.id);
    return res.status(200).json({items,nextPageToken:data.nextPageToken || null,query:q});
  } catch (e) {
    return res.status(502).json({error:'Unable to reach YouTube right now.'});
  }
}
