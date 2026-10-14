import struct, sys
src, dst = sys.argv[1], sys.argv[2]
b = bytearray(open(src,'rb').read())
p = 8
cnt = struct.unpack('>H', b[p:p+2])[0]; p += 2
utf = {}
i = 1
while i < cnt:
    t = b[p]; p += 1
    if t == 1:
        l = struct.unpack('>H', b[p:p+2])[0]; utf[i] = b[p+2:p+2+l].decode('utf8','replace'); p += 2+l
    elif t in (3,4): p += 4
    elif t in (5,6): p += 8; i += 1
    elif t in (7,8,16,19,20): p += 2
    elif t in (9,10,11,12,17,18): p += 4
    elif t == 15: p += 3
    else: raise SystemExit('bad tag %d' % t)
    i += 1
p += 6
ic = struct.unpack('>H', b[p:p+2])[0]; p += 2 + 2*ic
def skip_attrs(p):
    n = struct.unpack('>H', b[p:p+2])[0]; p += 2
    for _ in range(n):
        l = struct.unpack('>I', b[p+2:p+6])[0]; p += 6 + l
    return p
fc = struct.unpack('>H', b[p:p+2])[0]; p += 2
for _ in range(fc): p = skip_attrs(p + 6)
mc = struct.unpack('>H', b[p:p+2])[0]; p += 2
hits = 0
for _ in range(mc):
    name = utf[struct.unpack('>H', b[p+2:p+4])[0]]; desc = utf[struct.unpack('>H', b[p+4:p+6])[0]]
    p += 6
    n = struct.unpack('>H', b[p:p+2])[0]; cntpos = p; p += 2
    for _ in range(n):
        an = struct.unpack('>H', b[p:p+2])[0]; l = struct.unpack('>I', b[p+2:p+6])[0]
        if name == 'registerMessage' and desc == '(Lnet/neoforged/fml/event/lifecycle/FMLCommonSetupEvent;)V' and utf[an] == 'RuntimeVisibleAnnotations':
            # drop the @SubscribeEvent annotation: the method stays but is no longer an event listener
            del b[p:p+6+l]
            struct.pack_into('>H', b, cntpos, n - 1)
            hits += 1
            continue
        p += 6 + l
assert hits == 1, hits
open(dst,'wb').write(b)
print('patched', hits)
