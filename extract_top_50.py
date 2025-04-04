import json

# 원본 JSON 파일 읽기
with open('demo_src/ours_0.99_with_clamp_0.99_removing_list_as_names_lmd_clean_lmd_full.json', 'r') as f:
    data = json.load(f)

# remove_file_list의 길이를 기준으로 정렬
sorted_items = sorted(data.items(), key=lambda x: len(x[1]['remove_file_list']), reverse=True)

# 상위 50개만 선택
top_50 = dict(sorted_items[:50])

# .1로 끝나는 키 수정
modified_top_50 = {}
for artist, info in top_50.items():
    if artist.endswith('.1'):
        modified_top_50[artist[:-2]] = info
    else:
        modified_top_50[artist] = info

# 결과를 새로운 JSON 파일로 저장
with open('demo_src/ours_0.99_with_clamp_0.99_removing_list_as_names_lmd_clean_lmd_full_top_50_duplicates.json', 'w') as f:
    json.dump(modified_top_50, f, indent=2)

print(f"Top 50 items with the most duplicates have been saved to 'demo_src/top_50_duplicates.json'")
print(f"Total number of items in the original file: {len(data)}")
print(f"Number of items in the new file: {len(modified_top_50)}")

# 각 항목의 중복 파일 수 출력
for artist, info in modified_top_50.items():
    print(f"{artist}: {len(info['remove_file_list'])} duplicates") 