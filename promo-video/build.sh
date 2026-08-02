#!/bin/bash
set -euo pipefail

ROOT="/Users/vyasreddy/work/findindian.de/findindian-mobile/promo-video"
FRAMES="$ROOT/frames"
CLIPS="$ROOT/clips"
OUT="$ROOT/out"
mkdir -p "$CLIPS" "$OUT"

FONT="/System/Library/Fonts/Avenir Next.ttc"
FONT_BOLD="/System/Library/Fonts/HelveticaNeue.ttc"
W=1920
H=1080
FPS=30
DUR=4
FADE=0.7

# Copy endcard if needed
cp -f "/Users/vyasreddy/.cursor/projects/Users-vyasreddy-work-findindian-de/assets/08_endcard_bg.jpg" "$FRAMES/08_endcard_bg.jpg" 2>/dev/null || true

# Scene definitions: file|caption|zoom expression
# zoom expressions for Ken Burns variety
make_clip() {
  local idx="$1"
  local img="$2"
  local caption="$3"
  local zexpr="$4"
  local xexpr="$5"
  local yexpr="$6"
  local out="$CLIPS/clip_${idx}.mp4"
  local frames=$((DUR * FPS))

  echo "Building clip $idx: $caption"

  ffmpeg -y -loop 1 -i "$img" -f lavfi -i "color=c=black@0.0:s=${W}x${H}:d=${DUR}" -filter_complex "
    [0:v]scale=w=iw*max(${W}/iw\,${H}/ih)*1.35:h=ih*max(${W}/iw\,${H}/ih)*1.35,zoompan=z='${zexpr}':x='${xexpr}':y='${yexpr}':d=${frames}:s=${W}x${H}:fps=${FPS},
    format=yuv420p,
    drawbox=x=0:y=ih-220:w=iw:h=220:color=black@0.45:t=fill,
    drawtext=fontfile='${FONT}':text='${caption}':fontsize=52:fontcolor=white:borderw=0:x=(w-text_w)/2:y=h-140:alpha=1
    [v]
  " -map "[v]" -t "$DUR" -r "$FPS" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 18 "$out"
}

# 1 host - slow zoom in
make_clip 01 "$FRAMES/01_host.jpg" "Thinking of studying in Germany?" \
  "min(1.0+0.0012*on,1.15)" "iw/2-(iw/zoom/2)" "ih/2-(ih/zoom/2)-40"

# 2 arrival - pan right
make_clip 02 "$FRAMES/02_arrival.jpg" "Indian students arriving in Germany" \
  "1.12" "iw/2-(iw/zoom/2)+(on*1.8)" "ih/2-(ih/zoom/2)"

# 3 campus - zoom out
make_clip 03 "$FRAMES/03_campus.jpg" "Universities in Berlin, Munich & beyond" \
  "if(eq(on,1),1.2,max(1.05,1.2-0.001*on))" "iw/2-(iw/zoom/2)" "ih/2-(ih/zoom/2)"

# 4 jobs - zoom in
make_clip 04 "$FRAMES/04_jobs.jpg" "Careers in tech & engineering" \
  "min(1.0+0.001*on,1.14)" "iw/2-(iw/zoom/2)" "ih/2-(ih/zoom/2)"

# 5 benefits
make_clip 05 "$FRAMES/05_benefits.jpg" "Affordable education  ·  Safety  ·  Quality of life" \
  "1.1" "iw/2-(iw/zoom/2)-(on*1.2)" "ih/2-(ih/zoom/2)"

# 6 Brandenburg
make_clip 06 "$FRAMES/06_brandenburg.jpg" "Discover iconic Germany" \
  "min(1.0+0.0011*on,1.14)" "iw/2-(iw/zoom/2)" "ih/2-(ih/zoom/2)"

# 7 Castle / nature
make_clip 07 "$FRAMES/07_castle.jpg" "Castles, nature & a life to remember" \
  "if(eq(on,1),1.18,max(1.05,1.18-0.0009*on))" "iw/2-(iw/zoom/2)" "ih/2-(ih/zoom/2)"

# 8 End card with brand
echo "Building end card"
ffmpeg -y -loop 1 -i "$FRAMES/08_endcard_bg.jpg" -filter_complex "
  [0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},
  format=yuv420p,
  drawtext=fontfile='${FONT}':text='findIndian.de':fontsize=84:fontcolor=white:x=(w-text_w)/2:y=(h/2)-90,
  drawtext=fontfile='${FONT}':text='Your community for Indians in Germany':fontsize=36:fontcolor=white@0.9:x=(w-text_w)/2:y=(h/2)+20,
  drawtext=fontfile='${FONT}':text='Jobs  ·  Housing  ·  Community  ·  Guidance':fontsize=28:fontcolor=white@0.75:x=(w-text_w)/2:y=(h/2)+90
  [v]
" -map "[v]" -t 4.5 -r "$FPS" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 18 "$CLIPS/clip_08.mp4"

echo "Crossfading clips..."
# Build xfade chain for 8 clips
# offset for clip n: (n-1)*(DUR-FADE)
# offsets: 0, 3.3, 6.6, 9.9, 13.2, 16.5, 19.8

ffmpeg -y \
  -i "$CLIPS/clip_01.mp4" \
  -i "$CLIPS/clip_02.mp4" \
  -i "$CLIPS/clip_03.mp4" \
  -i "$CLIPS/clip_04.mp4" \
  -i "$CLIPS/clip_05.mp4" \
  -i "$CLIPS/clip_06.mp4" \
  -i "$CLIPS/clip_07.mp4" \
  -i "$CLIPS/clip_08.mp4" \
  -i "$ROOT/ambient.wav" \
  -filter_complex "
    [0:v][1:v]xfade=transition=fade:duration=${FADE}:offset=3.3[v01];
    [v01][2:v]xfade=transition=fade:duration=${FADE}:offset=6.6[v02];
    [v02][3:v]xfade=transition=fade:duration=${FADE}:offset=9.9[v03];
    [v03][4:v]xfade=transition=fade:duration=${FADE}:offset=13.2[v04];
    [v04][5:v]xfade=transition=fade:duration=${FADE}:offset=16.5[v05];
    [v05][6:v]xfade=transition=fade:duration=${FADE}:offset=19.8[v06];
    [v06][7:v]xfade=transition=fade:duration=${FADE}:offset=23.1[vout];
    [8:a]afade=t=in:st=0:d=1.5,afade=t=out:st=24.5:d=3,volume=0.55[aout]
  " \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -pix_fmt yuv420p -preset medium -crf 18 \
  -c:a aac -b:a 192k \
  -shortest \
  -movflags +faststart \
  "$OUT/findindian_germany_promo.mp4"

echo "Done:"
ls -lh "$OUT/findindian_germany_promo.mp4"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT/findindian_germany_promo.mp4"
