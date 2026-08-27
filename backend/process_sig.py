from PIL import Image

def process_signature(input_path, output_path):
    img = Image.open(input_path)
    
    # Crop to remove the desk shadows on the edges
    width, height = img.size
    left = int(width * 0.10)
    top = int(height * 0.20)
    right = int(width * 0.90)
    bottom = int(height * 0.80)
    
    img = img.crop((left, top, right, bottom))
    
    # Convert to RGBA for transparency
    img = img.convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Calculate brightness
        avg = (item[0] + item[1] + item[2]) / 3
        
        # A threshold of 110 means anything darker than mid-grey is kept as ink.
        # Anything lighter (the paper) is made completely transparent.
        if avg > 110:
            new_data.append((255, 255, 255, 0)) # Pure transparent
        else:
            new_data.append((0, 20, 100, 255))  # Dark professional blue

    img.putdata(new_data)
    
    # Tightly crop the remaining transparent image to the actual signature strokes
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print("Signature processed and saved successfully.")

if __name__ == "__main__":
    import sys
    process_signature(sys.argv[1], sys.argv[2])
