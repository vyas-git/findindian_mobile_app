#!/usr/bin/env python3
"""4-scene findIndian promo: host → couple → members map → end card."""
from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path("/Users/vyasreddy/work/findindian.de/findindian-mobile/promo-video")
SHOTS = Path("/Users/vyasreddy/work/findindian.de/findindian-mobile/screenshots")
FRAMES = ROOT / "frames"
PREP = ROOT / "prepared_v4"
CLIPS = ROOT / "clips_v4"
OUT = ROOT / "out"

W, H = 1920, 1080
FPS = 30
FADE = 0.55

# Synced to Neerja short VTT + padded end
SCENES = [
    # host with phone
    (0.00, 9.04, "Are you moving to Germany?", "lifestyle:p01_host_phone.jpg", "in"),
    # couple connecting
    (9.04, 16.23, "Find Indians around you", "lifestyle:p02_meet_community.jpg", "out"),
    # members map
    (16.23, 19.50, "Please come and join with me", "phone:members_screenshot.jpeg:p05_map_phone.jpg", "in"),
    # brand end
    (19.50, 28.50, "Connect · Meet · Grow Together", "endcard:08_endcard_bg.jpg", "in"),
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ):
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def cover(img: Image.Image, tw: int, th: int) -> Image.Image:
    scale = max(tw / img.width, th / img.height)
    nw, nh = int(img.width * scale + 0.5), int(img.height * scale + 0.5)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def add_caption(base: Image.Image, text: str) -> Image.Image:
    rgba = base.convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    bar_h = 210
    for y in range(bar_h):
        a = int(175 * (y / bar_h) ** 1.15)
        d.line([(0, H - bar_h + y), (W, H - bar_h + y)], fill=(0, 0, 0, a))
    f = font(46)
    bbox = d.textbbox((0, 0), text, font=f)
    tw = bbox[2] - bbox[0]
    x, y = (W - tw) // 2, H - 110
    d.text((x + 2, y + 2), text, font=f, fill=(0, 0, 0, 160))
    d.text((x, y), text, font=f, fill=(255, 255, 255, 245))
    return Image.alpha_composite(rgba, overlay).convert("RGB")


def lifestyle(path: Path, caption: str, darken=0.88) -> Image.Image:
    img = cover(Image.open(path).convert("RGB"), W, H)
    img = ImageEnhance.Color(img).enhance(1.05)
    img = ImageEnhance.Brightness(img).enhance(darken)
    return add_caption(img, caption)


def phone_mockup(shot: Path, bg: Path, caption: str) -> Image.Image:
    canvas = cover(Image.open(bg).convert("RGB"), W, H)
    canvas = ImageEnhance.Brightness(canvas).enhance(0.5)
    canvas = canvas.filter(ImageFilter.GaussianBlur(14))
    screenshot = Image.open(shot).convert("RGB")
    phone_h = 900
    phone_w = min(int(phone_h * (screenshot.width / screenshot.height)), 420)
    phone_h = int(phone_w * (screenshot.height / screenshot.width))
    bezel, radius = 16, 46
    fw, fh = phone_w + bezel * 2, phone_h + bezel * 2
    frame = Image.new("RGBA", (fw, fh), (18, 18, 22, 255))
    fmask = rounded_mask((fw, fh), radius)
    screen = screenshot.resize((phone_w, phone_h), Image.Resampling.LANCZOS).convert("RGBA")
    frame.paste(screen, (bezel, bezel), rounded_mask((phone_w, phone_h), radius - 10))
    shadow = Image.new("RGBA", (fw + 40, fh + 40), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((20, 28, 20 + fw, 28 + fh), radius=radius, fill=(0, 0, 0, 150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    base = canvas.convert("RGBA")
    px, py = (W - fw) // 2, (H - fh) // 2 - 35
    base.paste(shadow, (px - 20, py - 20), shadow)
    base.paste(frame, (px, py), fmask)
    return add_caption(base.convert("RGB"), caption)


def endcard(path: Path) -> Image.Image:
    bg = cover(Image.open(path).convert("RGB"), W, H)
    bg = ImageEnhance.Brightness(bg).enhance(0.5)
    rgba = Image.alpha_composite(bg.convert("RGBA"), Image.new("RGBA", (W, H), (10, 25, 60, 120)))
    draw = ImageDraw.Draw(rgba)
    lines = [
        ("findIndian.de", 92, H // 2 - 100),
        ("Connect · Meet · Grow Together", 42, H // 2 + 10),
        ("Your community for Indians in Germany", 30, H // 2 + 80),
    ]
    for text, size, y in lines:
        f = font(size)
        bbox = draw.textbbox((0, 0), text, font=f)
        x = (W - (bbox[2] - bbox[0])) // 2
        draw.text((x + 2, y + 2), text, font=f, fill=(0, 0, 0, 150))
        draw.text((x, y), text, font=f, fill=(255, 255, 255, 245 if size > 50 else 220))
    return rgba.convert("RGB")


def make_frame(spec: str, caption: str) -> Image.Image:
    kind, *rest = spec.split(":")
    if kind == "lifestyle":
        return lifestyle(FRAMES / rest[0], caption)
    if kind == "phone":
        return phone_mockup(SHOTS / rest[0], FRAMES / rest[1], caption)
    if kind == "endcard":
        return endcard(FRAMES / rest[0])
    raise ValueError(spec)


def ken_burns(src: Path, dest: Path, motion: str, duration: float) -> None:
    frames = max(int(duration * FPS), 2)
    if motion == "in":
        z, x, y = "min(1.0+0.0009*on,1.12)", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
    elif motion == "out":
        z, x, y = "if(eq(on,1),1.14,max(1.04,1.14-0.0008*on))", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
    else:
        z, x, y = "1.06", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"
    vf = (
        f"scale=w=iw*max({W}/iw\\,{H}/ih)*1.25:h=ih*max({W}/iw\\,{H}/ih)*1.25,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s={W}x{H}:fps={FPS},format=yuv420p"
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-loop", "1", "-i", str(src),
            "-vf", vf, "-t", f"{duration:.3f}", "-r", str(FPS),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "18",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )


def main() -> None:
    for d in (PREP, CLIPS, OUT):
        d.mkdir(parents=True, exist_ok=True)

    raw = [e - s for s, e, *_ in SCENES]
    durs = [d + (FADE if i < len(raw) - 1 else 0) for i, d in enumerate(raw)]

    print("Compositing 4 scenes...")
    for i, (_, _, caption, spec, _) in enumerate(SCENES, 1):
        make_frame(spec, caption).save(PREP / f"s{i:02d}.jpg", quality=95)

    print("Rendering clips...")
    clip_paths = []
    for i, ((_, _, _, _, motion), dur) in enumerate(zip(SCENES, durs), 1):
        dest = CLIPS / f"clip_{i:02d}.mp4"
        ken_burns(PREP / f"s{i:02d}.jpg", dest, motion, dur)
        clip_paths.append(dest)
        print(f"  clip {i}: {dur:.2f}s")

    vo = ROOT / "voiceover_final.wav"
    music = ROOT / "music" / "promo_bed.wav"

    offsets = []
    t = 0.0
    for i in range(len(durs) - 1):
        t += durs[i] - FADE
        offsets.append(round(t, 3))
    total_est = sum(durs) - (len(durs) - 1) * FADE
    print("length ~", round(total_est, 2), "offsets", offsets)

    inputs = []
    for p in clip_paths:
        inputs += ["-i", str(p)]
    inputs += ["-i", str(vo), "-i", str(music)]

    parts = []
    last = "0:v"
    for i, off in enumerate(offsets):
        nxt = f"{i+1}:v"
        outv = "vout" if i == len(offsets) - 1 else f"v{i:02d}"
        parts.append(f"[{last}][{nxt}]xfade=transition=fade:duration={FADE}:offset={off}[{outv}]")
        last = outv

    vo_i, mu_i = len(clip_paths), len(clip_paths) + 1
    parts.append(
        f"[{vo_i}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=1.25[vo];"
        f"[{mu_i}:a]aformat=sample_rates=44100:channel_layouts=stereo,"
        f"atrim=0:{total_est+1:.2f},afade=t=in:st=0:d=1.0,"
        f"afade=t=out:st={max(0,total_est-2.2):.2f}:d=2.2,volume=0.18[mus];"
        f"[vo][mus]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[aout]"
    )
    fc = ";\n".join(parts)
    final = OUT / "findindian_promo_vo.mp4"

    r = subprocess.run(
        [
            "ffmpeg", "-y", *inputs,
            "-filter_complex", fc,
            "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "18",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            "-movflags", "+faststart",
            str(final),
        ],
        capture_output=True,
        text=True,
    )
    if r.returncode:
        print(r.stderr[-4000:])
        raise SystemExit(r.returncode)

    (OUT / "findindian_germany_promo.mp4").write_bytes(final.read_bytes())
    subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration,size",
         "-of", "default=noprint_wrappers=1", str(final)]
    )
    print("Wrote", final)


if __name__ == "__main__":
    main()
