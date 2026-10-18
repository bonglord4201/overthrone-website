const fs=require('fs'); const src=fs.readFileSync(process.argv[2],'utf8')
const H={tick:[],death:[],out:[]}; let sent=0, errs=0
const PT=new Proxy({}, {get:(o,k)=>({name:k})})
global.Java={loadClass:n=>{ if(n.endsWith('ParticleTypes'))return PT; if(n.endsWith('DustParticleOptions'))return function(c,s){this.c=c}; if(n.endsWith('Vector3f'))return function(r,g,b){this.r=r}; throw 'x'}}
global.ServerEvents={tick:f=>H.tick.push(f),commandRegistry:()=>{}}; global.PlayerEvents={loggedOut:f=>H.out.push(f)}; global.EntityEvents={death:f=>H.death.push(f)}
eval(src)
// every particle is a /particle command now: check its shape and count them
const RE=/^execute in minecraft:overworld positioned -?\d+\.\d{3} -?\d+\.\d{3} -?\d+\.\d{3} run particle minecraft:([a-z_]+|dust\{color:\[[\d.]+,[\d.]+,[\d.]+\],scale:[\d.]+\}) ~ ~ ~ -?[\d.]+ -?[\d.]+ -?[\d.]+ [\d.]+ (\d+) force @a\[distance=\.\.48\]$/
const level={dimension:'minecraft:overworld',server:{runCommandSilent:c=>{ if(!/ particle /.test(c)) return; const m=c.match(RE); if(!m){errs++; if(errs<4) console.log('BAD', c)} else sent+=+m[2] }}}
const pd={ot_owned:'',ot_aura:'',ot_trail:'',ot_killfx:''}
const p={username:'A',level,getX:()=>0,getY:()=>64,getZ:()=>0,getYRot:()=>45,isSpectator:()=>false,isInvisible:()=>false,isAlive:()=>true,persistentData:{getString:k=>pd[k]||''}}
const server={tickCount:0,players:[p]}
for (const kind of ['aura','trail']) for (const c of OT_FX[kind]) { pd.ot_owned=kind+':'+c.id; pd['ot_'+kind]=c.id; sent=0
  for(let i=0;i<40;i++){ server.tickCount+=2; if(kind=='trail') p.getX=()=>server.tickCount*0.1; H.tick.forEach(f=>f({server})) }
  console.log(kind, c.id, 'particles in 4s:', sent); pd['ot_'+kind]='' }
for (const c of OT_FX.killfx) { pd.ot_owned='killfx:'+c.id; pd.ot_killfx=c.id; sent=0; H.death.forEach(f=>f({source:{getPlayer:()=>p},entity:{level,getX:()=>1,getY:()=>64,getZ:()=>1}})); console.log('killfx',c.id,sent) }
console.log('errors',errs)
const sample=[]; level.server.runCommandSilent=c=>sample.push(c); pd.ot_owned='aura:frost_spiral'; pd.ot_aura='frost_spiral'; server.tickCount+=2; H.tick.forEach(f=>f({server})); console.log('sample:', sample[0])
