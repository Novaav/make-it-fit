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

def pack(items, W, H, no_rotate=False, timeout=120):
 """Exact search: a placement (id, rotation index, x, y) for every item on the board, or None. Raises TimeoutError."""
 items=sorted(items,key=lambda i:-len(i['cells']))
 start=time.monotonic(); nodes=0
 placements=[]
 for it in items:
  opts=[]
  for rot,shape in enumerate(rotations(it['cells'])[:1 if no_rotate else 4]):
   sw=max(x for x,y in shape)+1;sh=max(y for x,y in shape)+1
   for oy in range(H-sh+1):
    for ox in range(W-sw+1):
     opts.append((sum(1<<((oy+y)*W+ox+x) for x,y in shape),rot,ox,oy))
  placements.append(opts)
 if sum(len(i['cells']) for i in items)>W*H or any(not p for p in placements):return None
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
 return dfs(0,0)

def solve(level, no_rotate=False, timeout=120):
 """Exhaustive over every subset of the optional items. Chaos levels: finds the maximum Chaos (the perfect score),
 every optimal set, and how many packs are legal or pass. Levels without Chaos: just whether the required items fit."""
 W,H=level['board']; limit=level.get('weight_limit',10**9)
 required=[i for i in level['items'] if i['required']]; optional=[i for i in level['items'] if not i['required']]
 rg=sum(i['weight'] for i in required)
 if not optional:
  p=pack(required,W,H,no_rotate,timeout)
  return {'solvable':p is not None and rg<=limit,'placements':p}
 n=len(optional); legal={}   # mask -> placements
 for mask in sorted(range(1<<n),key=lambda m:bin(m).count('1')):
  sub=[optional[i] for i in range(n) if mask>>i&1]
  if rg+sum(i['weight'] for i in sub)>limit:continue
  # a pack can only be legal if every pack with one item fewer is (subsets of a packable set are packable)
  if any((mask^(1<<i)) not in legal for i in range(n) if mask>>i&1):continue
  p=pack(required+sub,W,H,no_rotate,timeout)
  if p is not None:legal[mask]=p
 chaos=lambda m:sum(optional[i]['chaos'] for i in range(n) if m>>i&1)
 best=max(chaos(m) for m in legal) if legal else None
 if best is None:return {'solvable':False}
 optimal=[m for m in legal if chaos(m)==best]
 target=-(-8*best//10)   # ceil(0.8 * perfect)
 # an intuitive normal win: take the most chaotic items first, keeping whatever still fits
 cur=0
 for i in sorted(range(n),key=lambda i:-optional[i]['chaos']):
  if (cur|(1<<i)) in legal:cur|=1<<i
 names=lambda m:[optional[i]['id'] for i in range(n) if m>>i&1]
 return {'solvable':True,'perfect':best,'target':target,'legal_packs':len(legal),'passing_packs':sum(1 for m in legal if chaos(m)>=target),
         'optimal_sets':[names(m) for m in optimal],'placements':legal[optimal[0]],'normal_example':{'items':names(cur),'chaos':chaos(cur),'placements':legal[cur]}}

def I(id,shape,w,req=True,chaos=0):return {'id':id,'cells':norm(shape),'weight':w,'required':req,'chaos':chaos}
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
 # Levels 2 and 3 are Chaos levels: every item has a Chaos value; reach `target` Chaos within the allowance (perfect = the maximum).
 {'id':'02','board':(6,5),'weight_limit':6500,'target':20,'perfect':25,'items':[
  I('handbag',TOTE,2250,False,6),I('outfit',T4,900,False,2),I('toiletries',rect(2,2),1000,False,1),I('flamingo',rect(3,2),1000,False,5),
  I('vibrator',line(3),400,False,3),I('frame',rect(2,3),1000,False,3),I('boa',line(4),300,False,3),I('ringlight',T5,800,False,2),
  I('disco_ball',rect(2,2),1500,False,4),I('dvds',P5,1500,False,6)]},
 {'id':'03','board':(7,6),'weight_limit':21000,'target':21,'perfect':26,'items':[
  I('cutout',CUTOUT,4000),I('laundry',rect(3,2),5000),
  I('outfit',T4,900,False,2),I('hangover',rect(2,2),800,False,3),I('heels',U5,1300,False,2),I('hotel_lamp',L4,3600,False,2),
  I('ceramic_foot',U5,3200,False,6),I('gnome',rect(2,3),6500,False,8),I('cheese',rect(2,2),2800,False,5),I('liquor',line(3),1500,False,5),
  I('robe',P5,1300,False,4),I('emergency_socks',line(2),150,False,3)]}
]
if __name__=='__main__':
 for l in levels:
  print('\nLEVEL',l['id'])
  r=solve(l)
  print('solve',{k:v for k,v in r.items() if k!='placements'})
  if l['id']=='01':print('NO ROTATE',solve(l,no_rotate=True))
  if 'perfect' in l:
   assert (r['perfect'],r['target'])==(l['perfect'],l['target']),'level data disagrees with the exhaustive solver'
 import json as _j
 fix={}
 for l in levels:
  r=solve(l)
  fix[l['id']]={'perfect':[list(p) for p in r['placements']],'normal':[list(p) for p in (r['normal_example']['placements'] if 'normal_example' in r else r['placements'])]}
 with open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'src','engine','solutions.fixture.json'),'w') as f:_j.dump(fix,f)
 with open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'VERIFIED_LEVELS.json'),'w') as f:json.dump(levels,f,indent=2)
