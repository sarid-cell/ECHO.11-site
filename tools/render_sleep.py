"""Render the ECHO.11 sleep session: 30 min, mono (identical in both ears,
so NOT binaural and fine on a speaker).

Layers
  bed    brown noise, low-passed — a distant-surf texture that masks
         room noise
  drone  an open fifth (110 / 165 / 220 Hz, exact 2:3:4 ratios so the
         partials never beat against each other)
  swell  both layers rise and settle on a 10 s cycle (6 breaths/min),
         starting at the trough so the page's breathing halo, which also
         starts small, lines up with it

Arc
  0:00-0:20   fade in
  0:20-14:00  full bed + drone, breathing swell
  14:00-22:00 drone recedes, leaving the bed
  22:00-30:00 everything fades to silence (cosine), last 10 s silent
"""
import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi
import wave, sys

SR = 24000
DUR = 30 * 60
N = SR * DUR
CHUNK = SR * 30
rng = np.random.default_rng(11)

lp_bed = butter(2, 650, 'low', fs=SR, output='sos')
hp_bed = butter(1, 40, 'high', fs=SR, output='sos')
zi_lp = sosfilt_zi(lp_bed) * 0
zi_hp = sosfilt_zi(hp_bed) * 0
brown_state = 0.0

def smooth(x, a, b):
    """0 before a, 1 after b, raised-cosine between (seconds)."""
    y = np.clip((x - a) / (b - a), 0, 1)
    return 0.5 - 0.5 * np.cos(np.pi * y)

out = np.empty(N, dtype=np.float32)
for start in range(0, N, CHUNK):
    n = min(CHUNK, N - start)
    t = (start + np.arange(n)) / SR

    # brown noise: leaky integration of white noise
    w = rng.standard_normal(n) * 0.02
    b = np.empty(n)
    s = brown_state
    for i in range(0, n, 4096):  # vectorised leaky integrator per block
        seg = w[i:i + 4096]
        k = np.arange(1, len(seg) + 1)
        leak = 0.9995
        # y[k] = leak^k * s + sum leak^(k-j) w[j]  (computed via cumulative trick)
        p = leak ** k
        acc = np.cumsum(seg / p) * p
        b[i:i + len(seg)] = acc + s * p
        s = b[i + len(seg) - 1]
    brown_state = s
    bed, zi_hp = sosfilt(hp_bed, b, zi=zi_hp)
    bed, zi_lp = sosfilt(lp_bed, bed, zi=zi_lp)

    # drone: open fifth, each partial drifting very slowly in level
    drone = (1.00 * np.sin(2 * np.pi * 110 * t) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.013 * t))
             + 0.45 * np.sin(2 * np.pi * 165 * t) * (0.80 + 0.20 * np.sin(2 * np.pi * 0.021 * t + 1.3))
             + 0.18 * np.sin(2 * np.pi * 220 * t) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.017 * t + 2.1)))

    # breathing swell, 10 s, trough at t=0: 0 -> 1 -> 0
    breath = 0.5 - 0.5 * np.cos(2 * np.pi * t / 10.0)
    bed_env = 0.62 + 0.38 * breath
    drone_env = 0.80 + 0.20 * breath

    drone_level = 1.0 - smooth(t, 14 * 60, 22 * 60)
    master = smooth(t, 0, 20) * (1.0 - smooth(t, 22 * 60, DUR - 10))

    mix = 0.80 * bed * bed_env + 0.08 * drone * drone_env * drone_level
    out[start:start + n] = (mix * master).astype(np.float32)
    print(f'{start / SR / 60:5.1f} min', file=sys.stderr, end='\r')

peak = np.max(np.abs(out))
out *= 10 ** (-1 / 20) / peak  # peak at -1 dBFS
pcm = (out * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes(pcm.tobytes())
rms_mid = np.sqrt(np.mean(out[SR * 300:SR * 360] ** 2))
print(f'\npeak normalised; rms @5min = {20 * np.log10(rms_mid):.1f} dBFS', file=sys.stderr)
