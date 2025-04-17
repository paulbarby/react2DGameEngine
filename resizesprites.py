from PIL import Image
import os
import math

# Input and output paths
input_dir = "sprites_extracted"
output_dir = "sprites_centered"
os.makedirs(output_dir, exist_ok=True)

def next_multiple(n, base=32):
    return base * math.ceil(n / base)

# Process each sprite
for file in os.listdir(input_dir):
    if not file.endswith(".png"):
        continue

    # Load original image
    sprite = Image.open(os.path.join(input_dir, file))

    # Resize to 25% using nearest-neighbor
    new_size = (max(1, sprite.width // 4), max(1, sprite.height // 4))
    resized = sprite.resize(new_size, resample=Image.NEAREST)

    # Determine canvas size (next multiple of 32)
    canvas_width = next_multiple(resized.width)
    canvas_height = next_multiple(resized.height)

    # Create transparent canvas
    canvas = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))

    # Compute top-left position for centering
    offset_x = (canvas_width - resized.width) // 2
    offset_y = (canvas_height - resized.height) // 2

    # Paste resized sprite onto canvas
    canvas.paste(resized, (offset_x, offset_y), resized)

    # Save
    canvas.save(os.path.join(output_dir, file))

print(f"Processed sprites saved to '{output_dir}/'")
