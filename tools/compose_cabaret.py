"""Original procedural score: Спорный вальс. No external samples or borrowed melody."""
from pathlib import Path
import numpy as np, wave, subprocess, json, sys
RATE=44100;MOODS='--moods' in sys.argv;BARS=48 if MOODS else 32;LOOP=MOODS or '--loop' in sys.argv;TEMPOS=np.r_[np.linspace(84,176,16),np.linspace(176,98,16),np.r_[np.linspace(98,150,8),np.linspace(150,84,8)]] if MOODS else np.full(BARS,186.) if LOOP else 84+102*np.linspace(0,1,BARS)**1.5;BEATS=60/TEMPOS;STARTS=np.r_[0,np.cumsum(BEATS[:-1]*3)];LENGTH=float(sum(BEATS)*3);N=round(RATE*LENGTH);TITLE='hihikoren-moods' if MOODS else 'hihikoren-rush' if LOOP else 'hihikoren-accelerando'
rng=np.random.default_rng(19019);mix=np.zeros((N,2),dtype=np.float64)
def note(midi,start,duration,amp,kind='piano',pan=0):
 f=440*2**((midi-69)/12);size=int((duration+.65)*RATE);t=np.arange(size)/RATE
 if kind=='piano':
  s=sum((1/(h**1.8))*np.sin(2*np.pi*f*(h+.00025*h*h)*t)*np.exp(-t*(1.9+h*.5)) for h in range(1,8));s+=.14*np.sin(2*np.pi*f*1.003*t)*np.exp(-t*3)+.12*np.sin(2*np.pi*f*.997*t)*np.exp(-t*3);s*=1-np.exp(-t*600)
 elif kind=='organ':
  s=(np.sin(2*np.pi*f*t)+.45*np.sin(4*np.pi*f*t)+.2*np.sin(6*np.pi*f*t)+.12*np.sin(8*np.pi*f*t))*.58;s*=np.minimum(1,t/.018)*np.minimum(1,np.maximum(0,(duration+.08-t)/.13))
 elif kind=='bell':
  s=(np.sin(2*np.pi*f*t)+.2*np.sin(2*np.pi*f*2.76*t))*(1-np.exp(-t*900))*np.exp(-t*5)
 elif kind=='bass':
  s=(np.sin(2*np.pi*f*t)+.25*np.sin(4*np.pi*f*t)+.08*np.sin(6*np.pi*f*t))*(1-np.exp(-t*140))*np.exp(-t*4)
 elif kind=='kick':
  s=np.sin(2*np.pi*(44*t+45*(1-np.exp(-t*18))/18))*np.exp(-t*15)
 else:
  noise=rng.normal(0,.25,size);s=(noise-np.roll(noise,1))*(1-np.exp(-t*300))*np.exp(-t*45)
 release=np.where(t<duration,1,np.exp(-(t-duration)*18));s*=release*amp
 idx=int(start*RATE)+np.arange(size);valid=idx<N;idx=idx%N if LOOP else idx[valid];s=s if LOOP else s[valid];mix[idx,0]+=s*np.sqrt((1-pan)/2);mix[idx,1]+=s*np.sqrt((1+pan)/2)
chords=[(50,[50,53,57]),(46,[46,50,53]),(43,[43,46,50]),(45,[45,49,52,55]),(50,[50,53,57]),(53,[53,57,60]),(52,[52,55,58]),(45,[45,49,52,55])]
# New eight-phrase tune written for this score; never a transcription of the reference.
phrases=[[74,77,76,69,73,76],[77,74,70,65,69,72],[74,70,67,69,70,74],[73,76,79,76,73,69],[81,77,74,76,77,81],[81,79,77,72,76,79],[79,76,74,70,73,76],[73,69,76,73,69,68]]
for bar in range(BARS):
 root,chord=chords[bar%8];start=STARTS[bar];BEAT=BEATS[bar];section=int(np.clip((TEMPOS[bar]-84)/29,0,3)) if MOODS else 3 if LOOP else bar//8;energy=[.58,.74,.92,1.05][section]
 note(root-12,start,BEAT*.7,.23*energy,'bass',-.12);note(root-5,start+BEAT*1.5,BEAT*.55,.11*energy,'bass',-.12)
 for beat in [1,2]:
  for n in chord:note(n+12,start+BEAT*beat,BEAT*.44,.055*energy,'piano',-.3)
 density=12 if section>=2 else 6
 for step in range(density):
  n=chord[step%len(chord)]+12+(12 if step%4==2 else 0);note(n,start+step*BEAT*(3/density),BEAT*.24,.065*energy,'piano',.15)
 melody=phrases[bar%8]
 for step,n in enumerate(melody):
  if section==0 and step in [1,4]:continue
  n+=12 if section==2 and step%3==0 else 0
  note(n,start+step*BEAT/2,BEAT*(.7 if step==5 else .36),.11*energy,'piano',.3)
  if section==2 and step in [0,3]:note(n+12,start+step*BEAT/2,BEAT*.35,.035,'bell',-.4)
 if section>0:
  for n in chord:note(n+12,start,BEAT*2.7,.017*energy,'organ',-.25)
 for beat in [0,1,2]:
  note(40,start+beat*BEAT,BEAT*.22,.055*energy,'kick' if beat==0 else 'brush',.15 if beat==1 else -.15)
# Circular, quiet room reflections keep the loop seam continuous.
wet=mix.copy()
for delay,gain in [(.073,.12),(.137,.08),(.223,.055),(.349,.035)]:
 shift=int(delay*RATE)
 if LOOP:wet+=np.roll(mix[:,::-1],shift,axis=0)*gain
 else:wet[shift:]+=mix[:-shift,::-1]*gain
if not LOOP:wet[-int(.02*RATE):]*=np.linspace(1,0,int(.02*RATE))[:,None]
wet-=wet.mean(axis=0);wet=np.tanh(wet*1.35);wet*=.84/max(.001,float(np.max(np.abs(wet))))
out=Path('src/assets/audio');out.mkdir(parents=True,exist_ok=True);wav=out/(TITLE+'.wav')
with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((wet*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-af','loudnorm=I=-19:TP=-2:LRA=7','-c:a','libmp3lame','-b:a','160k',str(out/(TITLE+'.mp3'))],check=True)
(out/(TITLE+'-score.json')).write_text(json.dumps({'title':'Спорный вальс','composer':'Original procedural score for SMASH ROOM','tempoCurve':TEMPOS.tolist(),'meter':'3/4','bars':BARS,'seconds':LENGTH,'instruments':['piano','organ','bass','brushes','celesta'],'source':'No samples; all synthesis and notes in tools/compose_cabaret.py'},ensure_ascii=False,indent=2),encoding='utf-8')
print('Rendered original score:',out/(TITLE+'.mp3'),round(LENGTH,2),'seconds')
