"""Découpe une image en deux calques pour la parallaxe 2,5D : sujet détouré + décor rebouché.

    python3 outils/calques.py public/lunettes/00_hero.jpg public/lunettes/calques/00_hero-masque.png

Sorties à côté du masque : <nom>-sujet.png (RGBA) et <nom>-fond.jpg. Le trou laissé par le sujet est
rebouché par « push-pull » (pyramide de réductions en alpha prémultiplié) : pas d'IA, juste les couleurs
voisines étalées. Le sujet bouge plus vite que le décor, donc le rebouchage n'est visible qu'en bordure.
"""
import sys
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageMath

src, masque_p = Path(sys.argv[1]), Path(sys.argv[2])
img = Image.open(src).convert('RGB')
m = Image.open(masque_p).convert('L').resize(img.size)
nom = masque_p.name.replace('-masque.png', '')

# sujet : alpha = masque adouci d'un pixel et demi (bord moins « découpé aux ciseaux »)
sujet = img.convert('RGBA')
sujet.putalpha(m.filter(ImageFilter.GaussianBlur(1.5)))
sujet.save(masque_p.with_name(f'{nom}-sujet.png'))

# décor : trou élargi (le sujet se déplacera de quelques dizaines de pixels), puis push-pull
trou = m.point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(21))
garde = trou.point(lambda v: 0 if v else 255)                    # 255 = pixel de décor fiable


def prem(rgb, a):
    """Alpha prémultiplié : les pixels du trou valent noir, ils ne peuvent plus déteindre."""
    return Image.merge('RGB', [ImageChops.multiply(c, a) for c in rgb.split()])


def deprem(rgb, a):
    """Retour aux vraies couleurs : c × 255 / alpha, bande par bande."""
    af = a.convert('F')
    bandes = [ImageMath.lambda_eval(lambda e: e['c'] * 255.0 / (e['a'] + 0.5), c=c.convert('F'), a=af).convert('L')
              for c in rgb.split()]
    return Image.merge('RGB', bandes)


niveaux = [(prem(img, garde), garde)]
while min(niveaux[-1][0].size) > 4:
    c, a = niveaux[-1]
    t = (max(1, c.width // 2), max(1, c.height // 2))
    niveaux.append((c.resize(t, Image.BOX), a.resize(t, Image.BOX)))
remplissage = deprem(*niveaux[-1])
for c, a in reversed(niveaux[:-1]):
    haut = remplissage.resize(c.size, Image.BICUBIC)
    reel = deprem(c, a)
    remplissage = Image.composite(reel, haut, a.point(lambda v: 255 if v > 250 else v))
fond = remplissage.convert('RGB')
# le rebouchage est lisse : on floute légèrement tout le décor pour qu'il ne tranche pas (profondeur de champ)
fond = Image.composite(fond.filter(ImageFilter.GaussianBlur(2.5)), fond, trou.filter(ImageFilter.GaussianBlur(20)))
fond.save(masque_p.with_name(f'{nom}-fond.jpg'), quality=93)
print(f'{nom} : sujet {m.getbbox()} ok')
