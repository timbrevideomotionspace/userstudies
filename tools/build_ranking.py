"""RANKING STUDY build (user 2026-10-26: "a user study to compare all methods. pick two random examples from each of the 5 selected
motions. then an interactive way for people to select from best to worst"; one overall ranking per example, answers to a Google Sheet).
Pairs: the paper's selected 50 (v26/tools/quant6_best50_margin_yatim.json), 2 drawn per motion with a fixed seed -> 10 examples.
Videos: the Quant Set page's display copies (v26_pres/site_quant6: all retimed to the same 2.75 s, 360 px tall, DisMo/FlexiAct padding
removed), copied under opaque names so nothing in the page or the file names says which method made a clip.
Target image: the frame every method started from (baselines/quant6/stage/fit), 360 px tall.
Out: ranking/data.js (STUDY = {...}), ranking/media/*, ranking/draw.json (the draw and which file is which method).
  python tools/build_ranking.py
"""
import hashlib, json, os, random, shutil
from subprocess import run
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = f'{HERE}/ranking'
P = '/localhome/mta122/Projects/diffusion-pipe'; SITE = f'{P}/v26_pres/site_quant6'
Q = '/local-scratch/localhome/mta122/Projects/baselines/quant6'
SEL = json.load(open(f'{P}/v26/tools/quant6_best50_margin_yatim.json')); JOBS = json.load(open(f'{Q}/stage/jobs.json'))
IMG = {i['name']: i for i in JOBS['images']}
METHODS = ['ours', 'dismo', 'text', 'flexiact']
SEED, PER_MOTION = 20261026, 2

rng = random.Random(SEED); trials = []
os.makedirs(f'{OUT}/media', exist_ok=True)
for m in SEL['motions']:
    pool = sorted(p for p in SEL['pairs'] if p.split('__')[0] == m)
    for key in rng.sample(pool, PER_MOTION):
        img = key.split('__', 1)[1]; tid = f't{len(trials) + 1:02d}'
        tag = lambda s: hashlib.sha1(f'{SEED}/{key}/{s}'.encode()).hexdigest()[:8]
        files = {}
        for k in METHODS:
            files[k] = f'media/{tid}_{tag(k)}.mp4'; shutil.copyfile(f'{SITE}/v/{k}/{key}.mp4', f'{OUT}/{files[k]}')
        src = f'media/{tid}_src.mp4'; shutil.copyfile(f'{SITE}/s/{m}_sync.mp4', f'{OUT}/{src}')
        im = Image.open(f'{Q}/stage/fit/{img}.png').convert('RGB'); w, h = im.size
        tgt = f'media/{tid}_target.jpg'; im.resize((round(w * 360 / h), 360), Image.LANCZOS).save(f'{OUT}/{tgt}', quality=90)
        trials.append({'id': tid, 'pair': key, 'motion': m, 'target': img, 'source': src, 'image': tgt, 'aspect': round(w / h, 4),
                       'videos': files})

# source clips are 640 x 360 except the portrait cat; the page lays out by these
for t in trials:
    r = run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f'{OUT}/{t["source"]}'],
            capture_output=True, text=True).stdout.strip().split(',')
    t['source_aspect'] = round(int(r[0]) / int(r[1]), 4)

study = {'study': 'ranking', 'version': 1, 'seed': SEED, 'methods': METHODS, 'trials': trials}
open(f'{OUT}/data.js', 'w').write('// built by tools/build_ranking.py -- do not edit by hand\nconst STUDY = ' + json.dumps(study, indent=1) + ';\n')
json.dump({'rule': f'{PER_MOTION} pairs per motion drawn with random.Random({SEED}).sample from the sorted selected pairs of each motion, '
                   'motions in the selection file order', 'selection': SEL['rule'], 'trials': trials},
          open(f'{OUT}/draw.json', 'w'), indent=1)
print('\n'.join(f'{t["id"]} {t["pair"]}' for t in trials))
