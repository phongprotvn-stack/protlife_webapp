import json, sys
data = json.load(sys.stdin)
for item in data:
    name = item.get('Name', '')
    if 'ProtLife' in name or name.startswith('1E9Y'):
        print(f"Name: {name}")
        print(f"ID: {item.get('Id', 'N/A')}")
        print(f"Created: {item.get('Created', 'N/A')}")
        print("---")