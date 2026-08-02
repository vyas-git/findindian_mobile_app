#!/usr/bin/env python3
"""Prepare captioned frames + assemble findIndian Germany promo video."""
from __future__ import annotations

import math
import subprocess
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT = Path("/Users/vyasreddy/work/findindian.de/findindian-mobile/promo-video")
ASSETS = Path("/Users/vyasreddy/.cursor/projects/Users-vyasreddy-work-findindian-de/assets")
FRAMES = ROOT / "frames"
PREP = ROOT / "prepared"
CLIPS = ROOT / "clips"
OUT = ROOT / "out"

W, H = 1920, 1080
FPS = 30
DUR = 4.0
FADE = 0.7

SCENES = [
    ("01_host.jpg", "Thinking of studying in Germany?", "in"),
    ("02_arrival.jpg", "Indian students arriving in Germany", "pan_right"),
    ("03_campus.jpg", "Universities in Berlin, Munich & beyond", "out"),
    ("04_jobs.jpg", "Careers in tech & engineering", "in"),
    ("05_benefits.jpg", "Affordable education  ·  Safety  ·  Quality of life", "pan_left"),
    ("06_brandenburg.jpg", "Discover iconic Germany", "in"),
    ("07_castle.jpg", "Castles, nature & a life to remember", "out"),
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ):
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def cover_resize(img: Image.Image, tw: int, th: int) -> Image.Image:
    scale = max(tw / img.width, th / img.height)
    nw, nh = int(img.width * scale), int(img.height * scale)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def add_caption(base: Image.Image, text: str) -> Image.Image:
    img = base.convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    # bottom gradient bar
    bar_h = 240
    for y in range(bar_h):
        a = int(170 * (y / bar_h) ** 1.2)
        draw.line([(0, H - bar_h + y), (W, H - bar_h + y)], fill=(0, 0, 0, a))
    f = font(48)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (W - tw) // 2
    y = H - 130
    # soft shadow
    draw.text((x + 2, y + 2), text, font=f, fill=(0, 0, 0, 160))
    draw.text((x, y), text, font=f, fill=(255, 255, 255, 245))
    return Image.alpha_composite(img, overlay).convert("RGB")


def make_endcard(bg_path: Path, dest: Path) -> None:
    bg = Image.open(bg_path).convert("RGB")
    bg = cover_resize(bg, W, H)
    bg = ImageEnhance.Brightness(bg).enhance(0.72)
    img = bg.convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    # dark veil
    veil = Image.new("RGBA", img.size, (10, 20, 50, 90))
    img = Image.alpha_composite(img, veil)
    lines = [
        ("findIndian.de", 88, H // 2 - 100),
        ("Your community for Indians in Germany", 36, H // 2 + 10),
        ("Jobs  ·  Housing  ·  Community  ·  Guidance", 28, H // 2 + 80),
    ]
    for text, size, y in lines:
        f = font(size)
        bbox = draw.textbbox((0, 0), text, font=f)
        tw = bbox[2] - bbox[0]
        x = (W - tw) // 2
        alpha = 245 if size > 40 else 210
        draw.text((x + 2, y + 2), text, font=f, fill=(0, 0, 0, 140))
        draw.text((x, y), text, font=f, fill=(255, 255, 255, alpha))
    out = Image.alpha_composite(img, overlay).convert("RGB")
    out.save(dest, quality=95)


def ken_burns_clip(src: Path, dest: Path, motion: str, duration: float = DUR) -> None:
    """Create a Ken Burns clip using ffmpeg zoompan (no drawtext)."""
    frames = int(duration * FPS)
    if motion == "in":
        z = "min(1.0+0.00115*on,1.14)"
        x = "iw/2-(iw/zoom/2)"
        y = "ih/2-(ih/zoom/2)"
    elif motion == "out":
        z = "if(eq(on,1),1.18,max(1.05,1.18-0.00095*on))"
        x = "iw/2-(iw/zoom/2)"
        y = "ih/2-(ih/zoom/2)"
    elif motion == "pan_right":
        z = "1.12"
        x = "iw/2-(iw/zoom/2)+(on*1.6)"
        y = "ih/2-(ih/zoom/2)"
    elif motion == "pan_left":
        z = "1.12"
        x = "iw/2-(iw/zoom/2)-(on*1.4)"
        y = "ih/2-(ih/zoom/2)"
    else:
        z, x, y = "1.08", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"

    vf = (
        f"scale=w=iw*max({W}/iw\\,{H}/ih)*1.35:h=ih*max({W}/iw\\,{H}/ih)*1.35,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s={W}x{H}:fps={FPS},"
        f"format=yuv420p"
    )
    cmd = [
        "ffmpeg", "-y", "-loop", "1", "-i", str(src),
        "-vf", vf, "-t", str(duration), "-r", str(FPS),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "18",
        str(dest),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def ensure_ambient(path: Path, duration: float = 40.0) -> None:
    if path.exists() and path.stat().st_size > 1000:
        return
    sr = 44100
    n = int(sr * duration)
    with wave.open(str(path), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        for i in range(n):
            t = i / sr
            seg = int(t // 10) % 4
            bases = [130.81, 110.00, 174.61, 196.00]
            f0 = bases[seg]
            env = 0.12 * (0.55 + 0.45 * math.sin(2 * math.pi * t / 8))
            fade = min(1.0, t / 2.0) * min(1.0, (duration - t) / 2.5)
            s = (
                math.sin(2 * math.pi * f0 * t) * 0.5
                + math.sin(2 * math.pi * f0 * 1.5 * t) * 0.25
                + math.sin(2 * math.pi * f0 * 2 * t) * 0.15
                + math.sin(2 * math.pi * (f0 * 0.5) * t) * 0.2
            )
            s += 0.08 * math.sin(2 * math.pi * (f0 * 4.02) * t) * (
                0.5 + 0.5 * math.sin(2 * math.pi * t / 3)
            )
            val = max(-1.0, min(1.0, s * env * fade))
            sample = int(val * 32000)
            w.writeframes(struct.pack("<hh", sample, sample))


def main() -> None:
    for d in (FRAMES, PREP, CLIPS, OUT):
        d.mkdir(parents=True, exist_ok=True)

    # sync source frames
    for name, _, _ in SCENES:
        src = ASSETS / name
        if src.exists():
            (FRAMES / name).write_bytes(src.read_bytes())
    end_src = ASSETS / "08_endcard_bg.jpg"
    if end_src.exists():
        (FRAMES / "08_endcard_bg.jpg").write_bytes(end_src.read_bytes())

    print("Preparing captioned frames...")
    for name, caption, motion in SCENES:
        img = Image.open(FRAMES / name)
        img = cover_resize(img, W, H)
        # slight warm grade
        img = ImageEnhance.Color(img).enhance(1.05)
        img = ImageEnhance.Contrast(img).enhance(1.05)
        captioned = add_caption(img, caption)
        dest = PREP / name
        captioned.save(dest, quality=95)
        print(f"  frame {name}")

    make_endcard(FRAMES / "08_endcard_bg.jpg", PREP / "08_endcard.jpg")
    print("  endcard ready")

    print("Rendering Ken Burns clips...")
    clip_paths = []
    for i, (name, _, motion) in enumerate(SCENES, start=1):
        dest = CLIPS / f"clip_{i:02d}.mp4"
        ken_burns_clip(PREP / name, dest, motion)
        clip_paths.append(dest)
        print(f"  clip {i}")

    end_clip = CLIPS / "clip_08.mp4"
    ken_burns_clip(PREP / "08_endcard.jpg", end_clip, "in", duration=4.5)
    clip_paths.append(end_clip)
    print("  clip 8 (end)")

    ensure_ambient(ROOT / "ambient.wav", 40)

    # offsets: each next starts at (n)*(DUR-FADE)
    # clip durations: 4,4,4,4,4,4,4,4.5
    offsets = []
    t = 0.0
    for i in range(len(clip_paths) - 1):
        t += DUR - FADE
        offsets.append(round(t, 2))

    print("Offsets:", offsets)

    inputs = []
    for p in clip_paths:
        inputs += ["-i", str(p)]
    inputs += ["-i", str(ROOT / "ambient.wav")]

    # build xfade graph
    parts = []
    last = "0:v"
    for i, off in enumerate(offsets):
        nxt = f"{i+1}:v"
        out = "vout" if i == len(offsets) - 1 else f"v{i:02d}"
        parts.append(
            f"[{last}][{nxt}]xfade=transition=fade:duration={FADE}:offset={off}[{out}]"
        )
        last = out

    total_est = offsets[-1] + 4.5
    audio = (
        f"[{len(clip_paths)}:a]afade=t=in:st=0:d=1.5,"
        f"afade=t=out:st={total_est-3}:d=2.8,volume=0.5[aout]"
    )
    parts.append(audio)
    fc = ";\n".join(parts)

    final = OUT / "findindian_germany_promo.mp4"
    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", fc,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(final),
    ]
    print("Muxing final video...")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-3000:])
        raise SystemExit(r.returncode)

    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration,size",
            "-of", "default=noprint_wrappers=1",
            str(final),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    print(probe.stdout)
    print(f"Wrote {final}")


if __name__ == "__main__":
    main()
