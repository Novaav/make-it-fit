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

def solve(level, exclude=(), no_rotate=False, timeout=8):
 W,H=level['board']; allitems=[i for i in level['items'] if i['id'] not in exclude]
 required=[i for i in allitems if i['required']]; optional=[i for i in allitems if not i['required']]
 start=time.monotonic(); nodes=0
 for k in range(len(optional),-1,-1):
  for subset in combinations(optional,k):
   items=sorted(required+list(subset),key=lambda i:-len(i['cells']))
   if sum(i['weight'] for i in items)>level.get('weight_limit',999) or sum(len(i['cells']) for i in items)>W*H:continue
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
levels=[
 {'id':'01','board':(5,6),'items':[
 I('passport',[(0,0)],1),I('shirt',[(0,0),(1,0),(2,0),(1,1)],2),I('jeans',[(0,0),(1,0),(2,0),(3,0),(4,0),(5,0)],3),I('charger',[(0,0),(1,0)],1),I('toiletries',[(0,0),(1,0),(0,1),(1,1)],3),I('shoes',[(0,0),(1,0),(2,0),(0,1),(2,1)],4)]},
 {'id':'02','board':(6,5),'weight_limit':15,'items':[
 I('passport',[(0,0)],1),I('charger',[(0,0),(1,0)],1),I('toiletries',[(0,0),(1,0),(0,1),(1,1)],3),I('outfit',[(0,0),(1,0),(2,0),(1,1)],4),I('dvd',[(0,0),(1,0),(2,0)],1),
 I('disco_ball',[(0,0),(1,0),(0,1),(1,1)],4,False),I('heels',[(0,0),(1,0),(2,0),(0,1),(2,1)],4,False),I('ex_photo',[(0,0),(1,0),(1,1)],2,False),I('extra_shoes',[(0,0),(1,0),(2,0),(3,0)],3,False),I('hairdryer',[(0,0),(1,0),(2,0),(1,1),(1,2)],5,False)]},
 {'id':'03','board':(6,5),'weight_limit':24,'items':[
 I('cutout',[(0,0),(1,0),(2,0),(3,0),(4,0),(2,1),(2,2),(1,3),(2,3),(3,3)],7),I('passport',[(0,0)],1),I('outfit',[(0,0),(1,0),(2,0),(1,1)],3),I('charger',[(0,0),(1,0)],1),I('toiletries',[(0,0),(1,0),(0,1),(1,1)],3),
 I('hotel_lamp',[(0,0),(1,0),(1,1),(1,2)],4,False),I('emergency_socks',[(0,0),(1,0)],1,False),I('ceramic_foot',[(0,0),(1,0),(2,0),(0,1),(2,1)],4,False)]}
]
if __name__=='__main__':
 for l in levels:
  print('\nLEVEL',l['id']);
  for opts in [(),('cutout',)]:
   if opts and l['id']!='03':continue
   print('excluded',opts,solve(l,opts))
  if l['id']=='01':print('NO ROTATE',solve(l,no_rotate=True))
 with open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'VERIFIED_LEVELS.json'),'w') as f:json.dump(levels,f,indent=2)
