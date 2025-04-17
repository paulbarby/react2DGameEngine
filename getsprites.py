import cv2
import os
from PIL import Image
import numpy as np

# Paths
input_image_path = "sprite_sheet.png"
output_dir = "sprites_extracted"

# Setup
os.makedirs(output_dir, exist_ok=True)

# Load image with alpha
image = cv2.imread(input_image_path, cv2.IMREAD_UNCHANGED)

# Separate alpha channel for transparency detection
if image.shape[2] == 4:
    alpha = image[:, :, 3]
else:
    alpha = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Threshold alpha to create binary mask of visible pixels
_, thresh = cv2.threshold(alpha, 1, 255, cv2.THRESH_BINARY)

# Find contours
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

# Load image with PIL for cropping
pil_image = Image.open(input_image_path)

# Extract and save sprites
for i, cnt in enumerate(contours):
    x, y, w, h = cv2.boundingRect(cnt)
    if w < 10 or h < 10:
        continue  # Skip very small noise
    sprite = pil_image.crop((x, y, x + w, y + h))
    sprite.save(os.path.join(output_dir, f"sprite_{i:02d}.png"))

print(f"Extracted {len(contours)} sprites to '{output_dir}/'")
