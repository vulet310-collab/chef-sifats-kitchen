const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const DATA = path.join(__dirname, 'data');
const dbFile = path.join(DATA, 'store.json');
const sessionsFile = path.join(DATA, 'sessions.json');
fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({menu:[],settings:{},orders:[],reviews:[]}, null, 2));
if (!fs.existsSync(sessionsFile)) fs.writeFileSync(sessionsFile, '{}');
const read = f => JSON.parse(fs.readFileSync(f,'utf8'));
const write = (f,v) => fs.writeFileSync(f, JSON.stringify(v,null,2));
const db = read(dbFile);
const sessions = read(sessionsFile);
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword || adminPassword.length < 16) {
  console.error('Set ADMIN_PASSWORD to a strong password of at least 16 characters before starting.');
  process.exit(1);
}
const adminHash = bcrypt.hashSync(adminPassword, 12);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({limit:'2mb'}));
app.use(express.urlencoded({extended:false}));
app.use(express.static(__dirname));

const loginLimiter = rateLimit({windowMs:15*60*1000,max:5,standardHeaders:true,legacyHeaders:false,message:{error:'Too many login attempts. Try again later.'}});
const orderLimiter = rateLimit({windowMs:60*1000,max:10,standardHeaders:true,legacyHeaders:false});

function sessionToken(){return crypto.randomBytes(32).toString('hex');}
function auth(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!token || !sessions[token] || sessions[token] < Date.now()) return res.status(401).json({error:'Unauthorized'});
  next();
}

app.post('/api/admin/login', loginLimiter, async (req,res)=>{
  const password=String(req.body.password||'');
  const ok=await bcrypt.compare(password, adminHash);
  if(!ok) return res.status(401).json({error:'Invalid credentials'});
  const token=sessionToken(); sessions[token]=Date.now()+8*60*60*1000; write(sessionsFile,sessions);
  res.json({token,expiresIn:8*60*60});
});
app.post('/api/admin/logout', auth, (req,res)=>{const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');delete sessions[token];write(sessionsFile,sessions);res.json({ok:true});});

app.get('/api/menu',(req,res)=>res.json(db.menu));
app.put('/api/menu',auth,(req,res)=>{if(!Array.isArray(req.body))return res.status(400).json({error:'Menu must be an array'});db.menu=req.body;write(dbFile,db);res.json({ok:true,menu:db.menu});});
app.get('/api/settings',(req,res)=>res.json(db.settings));
app.put('/api/settings',auth,(req,res)=>{db.settings={...db.settings,...req.body};write(dbFile,db);res.json(db.settings);});

app.post('/api/orders', orderLimiter, (req,res)=>{
  const o=req.body;
  if(!o.name||!o.phone||!o.address||!Array.isArray(o.items)||!o.items.length) return res.status(400).json({error:'Missing order information'});
  const settings={open:'11:00',close:'19:00',minPrebookHours:5,maxPrebookHours:12,prebook:{pizza:true,continental:true,kacchi:true,momo:false},...db.settings};
  const now=new Date();
  const delivery=new Date(o.deliveryTime);
  if(Number.isNaN(delivery.getTime())) return res.status(400).json({error:'Invalid delivery time'});
  const mins=delivery.getHours()*60+delivery.getMinutes();
  const [oh,om]=settings.open.split(':').map(Number),[ch,cm]=settings.close.split(':').map(Number);
  if(mins<oh*60+om || mins>ch*60+cm) return res.status(400).json({error:'Delivery time must be between 11 AM and 7 PM.'});
  const needsPre=o.items.some(i=>settings.prebook[i.cat]);
  const advance=(delivery-now)/3600000;
  if(needsPre && (advance<Number(settings.minPrebookHours)||advance>Number(settings.maxPrebookHours))) return res.status(400).json({error:`Pre-booking requires ${settings.minPrebookHours}-${settings.maxPrebookHours} hours advance.`});
  if(needsPre && o.paymentType!=='FULL') return res.status(400).json({error:'Pre-booking requires full payment.'});
  const order={id:'CSK-'+Date.now().toString(36).toUpperCase(),createdAt:new Date().toISOString(),...o};
  db.orders.unshift(order); write(dbFile,db); res.status(201).json({ok:true,orderId:order.id});
});

app.get('/api/admin/orders',auth,(req,res)=>res.json(db.orders));
app.post('/api/reviews', (req,res)=>{const {name,rating,comment,item}=req.body;if(!rating||rating<1||rating>5)return res.status(400).json({error:'Rating must be 1-5'});db.reviews.unshift({id:crypto.randomUUID(),name:String(name||'Guest').slice(0,80),rating:Number(rating),comment:String(comment||'').slice(0,500),item:String(item||'Restaurant').slice(0,120),createdAt:new Date().toISOString(),approved:false});write(dbFile,db);res.status(201).json({ok:true,message:'Review submitted for approval.'});});
app.get('/api/reviews',(req,res)=>res.json(db.reviews.filter(r=>r.approved)));
app.get('/api/admin/reviews',auth,(req,res)=>res.json(db.reviews));
app.put('/api/admin/reviews/:id',auth,(req,res)=>{const r=db.reviews.find(x=>x.id===req.params.id);if(!r)return res.status(404).json({error:'Not found'});r.approved=!!req.body.approved;write(dbFile,db);res.json(r);});

app.listen(PORT,()=>console.log(`Chef Sifat's Kitchen running on port ${PORT}`));
