from pathlib import Path
import json, shutil
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'content/cv-hu.json').read_text())
pdfmetrics.registerFont(TTFont('Body','/Library/Fonts/PTSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Display','/Library/Fonts/PTSerif-Italic.ttf'))
pdfmetrics.registerFont(TTFont('Label','/Library/Fonts/Swis721 BT Roman.ttf'))
out=root/'output/pdf/Repas_Janos_CV_HU.pdf'
out.parent.mkdir(parents=True,exist_ok=True)
(root/'tmp/pdfs').mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(out),pagesize=(595.28,841.89));c.setTitle('Répás János – Magyar szakmai önéletrajz');c.setAuthor('Répás János')
def para(text,x,y,w,size=10.5,font='Body',color='#171717',leading=None):
 p=Paragraph(text,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.45,textColor=HexColor(color)))
 _,h=p.wrap(w,700);p.drawOn(c,x,y-h);return y-h

def base(page):
 c.setFillColor(HexColor('#f5f2e8'));c.rect(0,0,595.28,841.89,fill=1,stroke=0)
 c.setFillColor(HexColor('#ffdd00'));c.rect(0,773,595.28,69,fill=1,stroke=0)
 para('jrepas.',42,818,180,24,'Display');para('SZAKMAI ÖNÉLETRAJZ / RÉPÁS JÁNOS',275,807,280,8,'Label')
 c.setStrokeColor(HexColor('#bdb9aa'));c.line(42,43,553,43)
 para('jrepas.hu · hello@jrepas.hu',42,32,350,8,'Label');para(f'{page} / 2',512,32,50,8,'Label')
 c.linkURL('https://jrepas.hu',(42,16,175,34),relative=0)
def label(t,y):return para(t,42,y,510,8.5,'Label')-15
base(1)
y=para('Répás János',42,742,510,41,'Display')-8
y=para('Senior grafikus és mozgógrafikai tervező',42,y,510,15,'Body')-17
y=para(data['intro'],42,y,511,10.5)-17
y=para('hello@jrepas.hu · +36 30 152 6996<br/>Kiskunlacháza, Magyarország · jrepas.hu · behance.net/jrepas',42,y,511,9,'Label')-25
y=label('01 / SZAKMAI TAPASZTALAT',y)
for date,company,role,desc in data['experience']:
 para(date.replace('–','-'),42,y-3,95,9,'Label')
 yy=para(company,151,y,402,17,'Display')-4
 yy=para(role,151,yy,402,10,'Body')-5
 yy=para(desc,151,yy,402,9.5)
 y=yy-20
assert y>50,y
c.showPage();base(2)
y=label('02 / KÉSZSÉGEK ÉS ESZKÖZÖK',744)
for title,skills,tools in data['skills']:
 y=para(title,42,y,511,21,'Display')-6
 y=para(skills,42,y,511,10.5)-5
 if tools:y=para(tools,42,y,511,9,'Label')-6
 y-=13
y=label('03 / KAMPÁNY- ÉS MÁRKAMUNKÁK',y-16)
y=para(data['work'],42,y,511,10.5)-24
y=label('04 / TANULMÁNYOK ÉS NYELVEK',y)
for title,desc in data['education']:
 y=para(title,42,y,511,15,'Display')-3
 y=para(desc,42,y,511,10)-12
y=para('Nyelvtudás',42,y,511,15,'Display')-4
y=para(data['languages'].replace('–','-'),42,y,511,10)-22
assert y>110,y
c.setFillColor(HexColor('#ffdd00'));c.rect(42,65,511,49,fill=1,stroke=0)
para('Portfólió: jrepas.hu  /  behance.net/jrepas',57,96,480,11,'Label')
c.linkURL('https://jrepas.hu',(42,65,285,114),relative=0);c.linkURL('https://www.behance.net/jrepas',(285,65,553,114),relative=0)
c.save()
dest=root/'downloads';dest.mkdir(exist_ok=True);shutil.copy(out,dest/out.name)
from pypdf import PdfReader
p=PdfReader(out);assert len(p.pages)==2
for page in p.pages: assert '\u25a0' not in page.extract_text()
print('PDF: 2 oldal, magyar ékezetes szöveg ellenőrizve')
try:
 import pypdfium2 as pdfium
 doc=pdfium.PdfDocument(str(out))
 for i,page in enumerate(doc): page.render(scale=1.3).to_pil().save(str(root/f'tmp/pdfs/cv-{i+1}.png'))
 print('Rendered with PDFium')
except ImportError: print('PDFium unavailable')
