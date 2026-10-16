from functools import lru_cache
from itertools import combinations
import json, os, time

def norm(cells):
 x=min(a for a,b in cells);y=min(b for a,b in cells)
 return tuple(sorted((a-x,b-y) for a,b in cells))
def rotations(cells):
 r=[]; cur=norm(cells)
 for k in range(4):
  if cur not in r:r.append(cur)
  cur=norm([(y,-x) for x,y in cur])
 return r

def solve(level, exclude=(), no_rotate=False, timeout=120):
 W,H=level['board']; allitems=[i for i in level['items'] if i['id'] not in exclude]
 required=[i for i in allitems if i['required']]; optional=[i for i in allitems if not i['required']]
 start=time.monotonic(); nodes=0
 for k in range(len(optional),-1,-1):
  for subset in combinations(optional,k):
   items=sorted(required+list(subset),key=lambda i:-len(i['cells']))
   if sum(i['weight'] for i in items)>level.get('weight_limit',10**9) or sum(len(i['cells']) for i in items)>W*H:continue
   placements=[]
   for it in items:
    opts=[]
    for rot,shape in enumerate(rotations(it['cells'])[:1 if no_rotate else 4]):
     sw=max(x for x,y in shape)+1;sh=max(y for x,y in shape)+1
     for oy in range(H-sh+1):
      for ox in range(W-sw+1):
       mask=sum(1<<((oy+y)*W+ox+x) for x,y in shape)
       opts.append((mask,rot,ox,oy))
    placements.append(opts)
   @lru_cache(None)
   def dfs(idx,occupied):
    nonlocal nodes
    nodes+=1
    if nodes%100000==0 and time.monotonic()-start>timeout:raise TimeoutError
    if idx==len(items):return ()
    for mask,r,x,y in placements[idx]:
     if occupied&mask:continue
     out=dfs(idx+1,occupied|mask)
     if out is not None:return ((items[idx]['id'],r,x,y),)+out
    return None
   try:out=dfs(0,0)
   except TimeoutError:return {'timeout':True,'nodes':nodes}
   if out is not None:return {'solvable':True,'bonus_max':k,'placements':out,'nodes':nodes,'seconds':round(time.monotonic()-start,3)}
 return {'solvable':False,'nodes':nodes,'seconds':round(time.monotonic()-start,3)}

def I(id,shape,w,req=True):return {'id':id,'cells':norm(shape),'weight':w,'required':req}
# Shapes (cells are x,y; one grid cell is roughly 9 cm of suitcase).
def rect(w,h):return [(x,y) for x in range(w) for y in range(h)]
def line(n):return [(i,0) for i in range(n)]
T4=[(0,0),(1,0),(2,0),(1,1)]            # t-shirt, party outfit
T5=[(0,0),(1,0),(2,0),(1,1),(1,2)]      # ring light on its tripod
L4=[(0,0),(1,0),(1,1),(1,2)]            # hotel lamp
U5=[(0,0),(0,1),(1,0),(2,0),(2,1)]      # sneakers, heels, ceramic foot (arch is the empty cell)
P5=[(0,0),(1,0),(0,1),(1,1),(0,2)]      # folded bathrobe, Mom's DVD collection (a stack with one corner missing)
TOTE=[(1,0),(0,1),(1,1),(2,1),(0,2),(1,2),(2,2)]  # oversized handbag: a 3x2 body with its handles above (3x3 minus both top corners)
CUTOUT=[(0,0),(1,0),(2,0),(3,0),(4,0),(2,1),(2,2),(1,3),(2,3),(3,3)]
# Weights are integer GRAMS. Allowances are game limits on the weight of the items (the game does not model the suitcase itself).
levels=[
 {'id':'01','board':(5,6),'items':[
  I('shirt',T4,250),I('jeans',line(6),700),I('shoes',U5,1200),I('toiletries',rect(2,2),1000),I('charger',line(2),400)]},
 {'id':'02','board':(6,5),'weight_limit':7000,'items':[
  I('handbag',TOTE,2250),I('outfit',T4,900),I('toiletries',rect(2,2),1000),I('flamingo',rect(3,2),1000),
  I('vibrator',line(3),400,False),I('frame',rect(2,3),1000,False),I('boa',line(4),300,False),I('ringlight',T5,800,False),
  I('disco_ball',rect(2,2),1500,False),I('dvds',P5,1500,False)]},
 {'id':'03','board':(8,6),'weight_limit':23000,'items':[
  I('cutout',CUTOUT,4000),I('laundry',rect(3,2),5000),I('outfit',T4,900),I('hangover',rect(2,2),800),I('heels',U5,1300),
  I('hotel_lamp',L4,3600,False),I('ceramic_foot',U5,3200,False),I('gnome',rect(2,3),6500,False),I('cheese',rect(2,2),2800,False),
  I('liquor',line(3),1500,False),I('robe',P5,1300,False),I('emergency_socks',line(2),150,False)]}
]
if __name__=='__main__':
 for l in levels:
  print('\nLEVEL',l['id'])
  print('solve',solve(l))
  if l['id']=='01':print('NO ROTATE',solve(l,no_rotate=True))
 with open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'VERIFIED_LEVELS.json'),'w') as f:json.dump(levels,f,indent=2)
