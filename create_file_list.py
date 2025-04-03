import os
import json
from pathlib import Path

def create_file_list(root_dir):
    result = {}
    
    # root_dir 내의 모든 .mid 파일을 찾습니다
    for midi_path in Path(root_dir).rglob('*.mid'):
        # 상대 경로를 얻습니다
        rel_path = midi_path.relative_to(root_dir)
        parts = rel_path.parts
        
        # 필요한 정보를 추출합니다
        artist = parts[0]
        song = parts[1]
        hash = parts[2]
        midi_file = parts[3]
        
        
        # artist__song 키를 생성합니다
        key = f"{artist}__{song}"
        
        # 결과 딕셔너리에 추가합니다
        if key not in result:
            result[key] = []
            
        result[key].append(f"{hash}__{midi_file}")
    
    return result

def main():
    root_dir = "./demo_src/ours_0.93_with_clamp_0.87_lmd_clean_lmd_full"
    output_file = os.path.join(root_dir, "file_list.json")
    
    # 파일 리스트를 생성합니다
    file_list = create_file_list(root_dir)
    
    # JSON 파일로 저장합니다
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(file_list, f, ensure_ascii=False, indent=2)
    
    print(f"파일 리스트가 성공적으로 생성되었습니다: {output_file}")

if __name__ == "__main__":
    main() 