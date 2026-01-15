import os

# Base directory
BASE = r"c:\Users\kobio\OneDrive\Desktop\Test 500\web-app"

# Create directory structure
dirs = [
    "css",
    "js/services",
    "js/utils",
    "js/components",
    "js/screens",
    "assets"
]

print("Creating directory structure...")
for d in dirs:
    path = os.path.join(BASE, d)
    os.makedirs(path, exist_ok=True)
    print(f"✓ Created {d}")

print("\n✅ Directory structure created successfully!")
print("\nNext: Creating core files...")
