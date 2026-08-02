#!/usr/bin/env python3
"""Build findIndian.de promotional video with Indian female VO + product scenes."""
from __future__ import annotations

import math
import subprocess
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

ROOT = Path("/Users/vyasreddy/work/findindian.de/findindian-mobile/promo-video")
ASSETS = Path("/Users/vyasreddy/.cursor/projects/Users-vyasreddy-work-findindian-de/assets")
SHOTS = Path("/Users/vyasreddy/work/findindian.de/findindian-mobile/screenshots")
FRAMES = ROOT / "frames"
PREP = ROOT / "prepared_v2"
CLIPS = ROOT / "clips_v2"
OUT = ROOT / "out"

W, H = 1920, 1080
FPS = 30
FADE = 0.55
PAUSE = 0.35

# VO line durations from say -v Tara (seconds)
LINE_DURS = [
    2.670522,
    3.150023,
    4.902041,
    2.483220,
    4.305805,
    3.481950,
    2.425261,
    3.243719,
]

CAPTIONS = [
    "Moving to Germany?",
    "Housing · Jobs · Community",
    "findIndian.de — Connect Indians in Germany",
    "Find Indians near you",
    "Posts · Accommodation · Jobs",
    "One community. Zero spam.",
    "Connect · Meet · Grow Together",
    "Join findIndian.de today",
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
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


def rounded_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def phone_mockup(screenshot: Image.Image, bg: Image.Image, caption: str) -> Image.Image:
    """Place a phone screenshot on a blurred lifestyle background."""
    canvas = cover(bg.convert("RGB"), W, H)
    canvas = ImageEnhance.Brightness(canvas).enhance(0.55)
    canvas = canvas.filter(ImageFilter.GaussianBlur(12))
    # dark gradient for readability
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(H):
        a = int(40 + 90 * (y / H))
        od.line([(0, y), (W, y)], fill=(8, 16, 40, a // 3))

    # phone geometry
    phone_h = 920
    phone_w = int(phone_h * (screenshot.width / screenshot.height))
    phone_w = min(phone_w, 430)
    phone_h = int(phone_w * (screenshot.height / screenshot.width))

    bezel = 18
    radius = 48
    frame_w, frame_h = phone_w + bezel * 2, phone_h + bezel * 2
    frame = Image.new("RGBA", (frame_w, frame_h), (20, 20, 24, 255))
    frame_mask = rounded_rect_mask((frame_w, frame_h), radius)
    screen = screenshot.convert("RGB").resize((phone_w, phone_h), Image.Resampling.LANCZOS)
    screen_rgba = screen.convert("RGBA")
    screen_mask = rounded_rect_mask((phone_w, phone_h), radius - 10)
    # paste screen into frame
    frame.paste(screen_rgba, (bezel, bezel), screen_mask)
    # subtle highlight rim
    rim = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    rd.rounded_rectangle((1, 1, frame_w - 2, frame_h - 2), radius=radius, outline=(255, 255, 255, 50), width=2)

    # drop shadow
    shadow = Image.new("RGBA", (frame_w + 40, frame_h + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((20, 28, 20 + frame_w, 28 + frame_h), radius=radius, fill=(0, 0, 0, 140))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))

    base = canvas.convert("RGBA")
    base = Image.alpha_composite(base, overlay)
    px = (W - frame_w) // 2
    py = (H - frame_h) // 2 - 30
    base.paste(shadow, (px - 20, py - 20), shadow)
    base.paste(frame, (px, py), frame_mask)
    base.paste(rim, (px, py), rim)

    # caption
    draw = ImageDraw.Draw(base)
    f = font(46)
    bbox = draw.textbbox((0, 0), caption, font=f)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    y = H - 100
    # caption pill
    pad_x, pad_y = 28, 14
    pill = Image.new("RGBA", (tw + pad_x * 2, (bbox[3] - bbox[1]) + pad_y * 2), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle((0, 0, pill.width - 1, pill.height - 1), radius=18, fill=(0, 0, 0, 150))
    base.paste(pill, (x - pad_x, y - pad_y), pill)
    draw = ImageDraw.Draw(base)
    draw.text((x, y), caption, font=f, fill=(255, 255, 255, 245))
    return base.convert("RGB")


def lifestyle_caption(bg_path: Path, caption: str, darken: float = 0.78) -> Image.Image:
    img = cover(Image.open(bg_path).convert("RGB"), W, H)
    img = ImageEnhance.Color(img).enhance(1.06)
    img = ImageEnhance.Contrast(img).enhance(1.05)
    img = ImageEnhance.Brightness(img).enhance(darken)
    rgba = img.convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    bar_h = 220
    for y in range(bar_h):
        a = int(185 * (y / bar_h) ** 1.15)
        d.line([(0, H - bar_h + y), (W, H - bar_h + y)], fill=(0, 0, 0, a))
    f = font(48)
    bbox = d.textbbox((0, 0), caption, font=f)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    y = H - 120
    d.text((x + 2, y + 2), caption, font=f, fill=(0, 0, 0, 160))
    d.text((x, y), caption, font=f, fill=(255, 255, 255, 245))
    return Image.alpha_composite(rgba, overlay).convert("RGB")


def endcard(bg_path: Path) -> Image.Image:
    bg = cover(Image.open(bg_path).convert("RGB"), W, H)
    bg = ImageEnhance.Brightness(bg).enhance(0.55)
    rgba = bg.convert("RGBA")
    veil = Image.new("RGBA", (W, H), (10, 25, 60, 110))
    rgba = Image.alpha_composite(rgba, veil)
    draw = ImageDraw.Draw(rgba)
    lines = [
        ("findIndian.de", 90, H // 2 - 110),
        ("Connect · Meet · Grow Together", 40, H // 2 - 10),
        ("Your community for Indians in Germany", 32, H // 2 + 55),
        ("Jobs  ·  Housing  ·  Chat  ·  Members Map", 28, H // 2 + 115),
    ]
    for text, size, y in lines:
        f = font(size)
        bbox = draw.textbbox((0, 0), text, font=f)
        tw = bbox[2] - bbox[0]
        x = (W - tw) // 2
        draw.text((x + 2, y + 2), text, font=f, fill=(0, 0, 0, 150))
        draw.text((x, y), text, font=f, fill=(255, 255, 255, 245 if size > 50 else 220))
    return rgba.convert("RGB")


def ken_burns(src: Path, dest: Path, motion: str, duration: float) -> None:
    frames = max(int(duration * FPS), 2)
    if motion == "in":
        z = "min(1.0+0.00105*on,1.12)"
        x = "iw/2-(iw/zoom/2)"
        y = "ih/2-(ih/zoom/2)"
    elif motion == "out":
        z = "if(eq(on,1),1.14,max(1.04,1.14-0.0009*on))"
        x = "iw/2-(iw/zoom/2)"
        y = "ih/2-(ih/zoom/2)"
    elif motion == "pan_right":
        z, x, y = "1.1", "iw/2-(iw/zoom/2)+(on*1.2)", "ih/2-(ih/zoom/2)"
    else:
        z, x, y = "1.06", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"

    vf = (
        f"scale=w=iw*max({W}/iw\\,{H}/ih)*1.28:h=ih*max({W}/iw\\,{H}/ih)*1.28,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s={W}x{H}:fps={FPS},"
        f"format=yuv420p"
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


def soft_ambient(path: Path, duration: float) -> None:
    sr = 44100
    n = int(sr * duration)
    with wave.open(str(path), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        for i in range(n):
            t = i / sr
            bases = [146.83, 174.61, 196.00, 220.00]
            f0 = bases[int(t // 8) % 4]
            env = 0.07 * (0.6 + 0.4 * math.sin(2 * math.pi * t / 7))
            fade = min(1.0, t / 1.2) * min(1.0, (duration - t) / 2.0)
            s = (
                math.sin(2 * math.pi * f0 * t) * 0.45
                + math.sin(2 * math.pi * f0 * 1.5 * t) * 0.22
                + math.sin(2 * math.pi * f0 * 2 * t) * 0.12
            )
            val = max(-1.0, min(1.0, s * env * fade))
            sample = int(val * 30000)
            w.writeframes(struct.pack("<hh", sample, sample))


def scene_durations() -> list[float]:
    """Scene lengths so that after xfade the video matches VO length.

    xfade total = sum(durs) - (n-1)*FADE
    We want that ≈ VO + end pad, so inflate each mid scene by FADE.
    """
    n = len(LINE_DURS)
    durs = []
    for i, d in enumerate(LINE_DURS):
        extra = PAUSE if i < n - 1 else 1.4
        # compensate xfade overlap so spoken lines aren't truncated
        if i < n - 1:
            extra += FADE
        durs.append(d + extra)
    return durs


def main() -> None:
    for d in (FRAMES, PREP, CLIPS, OUT):
        d.mkdir(parents=True, exist_ok=True)

    # Sync generated lifestyle assets
    for name in (
        "p01_host_phone.jpg",
        "p02_meet_community.jpg",
        "p03_housing.jpg",
        "p04_jobs_career.jpg",
        "p05_map_phone.jpg",
        "01_host.jpg",
        "06_brandenburg.jpg",
        "08_endcard_bg.jpg",
    ):
        src = ASSETS / name
        if src.exists():
            (FRAMES / name).write_bytes(src.read_bytes())

    print("Compositing promotional frames...")
    # 1 host
    lifestyle_caption(FRAMES / "p01_host_phone.jpg", CAPTIONS[0], 0.9).save(PREP / "s01.jpg", quality=95)
    # 2 community meet / overwhelm -> housing vibe
    lifestyle_caption(FRAMES / "p03_housing.jpg", CAPTIONS[1], 0.82).save(PREP / "s02.jpg", quality=95)
    # 3 brand why
    lifestyle_caption(FRAMES / "p02_meet_community.jpg", CAPTIONS[2], 0.78).save(PREP / "s03.jpg", quality=95)
    # 4 members map screenshot
    members = Image.open(SHOTS / "members_screenshot.jpeg")
    phone_mockup(members, Image.open(FRAMES / "p05_map_phone.jpg"), CAPTIONS[3]).save(PREP / "s04.jpg", quality=95)
    # 5 jobs + community posts feel — use jobs screenshot
    jobs = Image.open(SHOTS / "jobs_screenshot.jpeg")
    phone_mockup(jobs, Image.open(FRAMES / "p04_jobs_career.jpg"), CAPTIONS[4]).save(PREP / "s05.jpg", quality=95)
    # 6 chat
    chat = Image.open(SHOTS / "general_chat.jpeg")
    phone_mockup(chat, Image.open(FRAMES / "06_brandenburg.jpg"), CAPTIONS[5]).save(PREP / "s06.jpg", quality=95)
    # 7 connect meet grow
    lifestyle_caption(FRAMES / "p02_meet_community.jpg", CAPTIONS[6], 0.85).save(PREP / "s07.jpg", quality=95)
    # 8 end
    endcard(FRAMES / "08_endcard_bg.jpg").save(PREP / "s08.jpg", quality=95)
    print("  frames ready")

    durs = scene_durations()
    motions = ["in", "pan_right", "out", "in", "out", "in", "pan_right", "in"]
    print("Rendering clips...")
    clip_paths = []
    for i, (dur, motion) in enumerate(zip(durs, motions), start=1):
        dest = CLIPS / f"clip_{i:02d}.mp4"
        ken_burns(PREP / f"s{i:02d}.jpg", dest, motion, dur)
        clip_paths.append(dest)
        print(f"  clip {i}: {dur:.2f}s")

    # Audio: paced VO
    vo = ROOT / "voiceover_paced.wav"
    if not vo.exists():
        vo = ROOT / "voiceover.wav"
    total = sum(durs)
    ambient = ROOT / "ambient_v2.wav"
    soft_ambient(ambient, total + 2)

    # xfade offsets
    offsets = []
    t = 0.0
    for i in range(len(durs) - 1):
        t += durs[i] - FADE
        offsets.append(round(t, 3))

    inputs: list[str] = []
    for p in clip_paths:
        inputs += ["-i", str(p)]
    inputs += ["-i", str(vo), "-i", str(ambient)]

    parts = []
    last = "0:v"
    for i, off in enumerate(offsets):
        nxt = f"{i + 1}:v"
        out = "vout" if i == len(offsets) - 1 else f"v{i:02d}"
        parts.append(f"[{last}][{nxt}]xfade=transition=fade:duration={FADE}:offset={off}[{out}]")
        last = out

    # Mix VO loud + soft ambient; pad VO to video length
    vo_idx = len(clip_paths)
    amb_idx = vo_idx + 1
    parts.append(
        f"[{vo_idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,"
        f"afade=t=in:st=0:d=0.15,volume=1.35[vo];"
        f"[{amb_idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,"
        f"atrim=0:{total:.2f},afade=t=in:st=0:d=1,afade=t=out:st={max(0, total-2):.2f}:d=2,"
        f"volume=0.22[amb];"
        f"[vo][amb]amix=inputs=2:duration=longest:dropout_transition=2[aout]"
    )
    fc = ";\n".join(parts)

    final = OUT / "findindian_promo_vo.mp4"
    print("Muxing final video with voiceover...")
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
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-4000:])
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
