import json
import os
import shutil
import subprocess
from pathlib import Path

# JSON 파일 경로
json_file_path = "demo_src/ours_0.99_with_clamp_0.99_removing_list_as_names_lmd_clean_lmd_full_top_50_duplicates.json"

# 소스 디렉토리 (MIDI 파일이 있는 곳)
source_dir = "demo_src/lmd_full"

# 타겟 디렉토리 (MIDI 파일을 복사할 곳)
target_dir = "demo_src/lmd_full_top_50_dup_clusters_lmd_clean_query"

# 타겟 디렉토리가 없으면 생성
if not os.path.exists(target_dir):
    os.makedirs(target_dir)

# JSON 파일 로드
with open(json_file_path, 'r') as f:
    data = json.load(f)

# 로깅을 위한 변수들 초기화
total_files = 0
copied_files = 0
skipped_files = 0
missing_files = []

# 샘플 파일 경로 (ABBA - Dancing Queen)
sample_file = "6d2cc12aea112c3d15c2fc68025d3b5f.mid"
sample_path = f"demo_src/lmd_full/6/{sample_file}"
print(f"샘플 파일 경로: {sample_path}")
print(f"샘플 파일 존재 여부: {os.path.exists(sample_path)}")

# find 명령어로 파일 찾기 (디버깅용)
print(f"find 명령어로 샘플 파일 찾기:")
find_result = subprocess.run(["find", "demo_src/lmd_full", "-name", sample_file], 
                            capture_output=True, text=True)
if find_result.stdout:
    print(find_result.stdout)
else:
    print("파일을 찾을 수 없습니다.")

# 각 클러스터에 대해 처리
for cluster_name, cluster_data in data.items():
    print(f"처리 중: {cluster_name}")
    
    # survived_file 처리
    survived_file = cluster_data.get('survived_file')
    if survived_file:
        total_files += 1
        # 형식: 'a__b' => 'a/b.mid'
        parts = survived_file.split('__')
        if len(parts) == 2:
            # 원래 경로
            source_path = os.path.join(source_dir, parts[0], f"{parts[1]}.mid")
            
            # 타겟 디렉토리에 해당 하위 디렉토리 생성
            target_subdir = os.path.join(target_dir, parts[0])
            if not os.path.exists(target_subdir):
                os.makedirs(target_subdir)
            
            target_path = os.path.join(target_dir, parts[0], f"{parts[1]}.mid")
            
            # 파일이 소스 경로에 존재하는지 확인
            if os.path.exists(source_path):
                # 대상 파일이 이미 존재하는지 확인
                if os.path.exists(target_path):
                    print(f"  건너뜀 (이미 존재): {target_path}")
                    skipped_files += 1
                else:
                    try:
                        # 파일 복사
                        shutil.copy2(source_path, target_path)
                        print(f"  복사됨: {source_path} → {target_path}")
                        copied_files += 1
                    except PermissionError:
                        print(f"  권한 오류: {target_path} - 파일을 쓸 수 없습니다")
                        skipped_files += 1
            else:
                print(f"  누락: {source_path} (파일이 존재하지 않음)")
                missing_files.append(f"{parts[0]}/{parts[1]}.mid")
    
    # remove_file_list 처리
    remove_files = cluster_data.get('remove_file_list', [])
    for remove_file in remove_files:
        total_files += 1
        # 형식: 'a__b' => 'a/b.mid'
        parts = remove_file.split('__')
        if len(parts) == 2:
            # 원래 경로
            source_path = os.path.join(source_dir, parts[0], f"{parts[1]}.mid")
            
            # 타겟 디렉토리에 해당 하위 디렉토리 생성
            target_subdir = os.path.join(target_dir, parts[0])
            if not os.path.exists(target_subdir):
                os.makedirs(target_subdir)
            
            target_path = os.path.join(target_dir, parts[0], f"{parts[1]}.mid")
            
            # 파일이 소스 경로에 존재하는지 확인
            if os.path.exists(source_path):
                # 대상 파일이 이미 존재하는지 확인
                if os.path.exists(target_path):
                    print(f"  건너뜀 (이미 존재): {target_path}")
                    skipped_files += 1
                else:
                    try:
                        shutil.copy2(source_path, target_path)
                        print(f"  복사됨: {source_path} → {target_path}")
                        copied_files += 1
                    except PermissionError:
                        print(f"  권한 오류: {target_path} - 파일을 쓸 수 없습니다")
                        skipped_files += 1
            else:
                print(f"  누락: {source_path} (파일이 존재하지 않음)")
                missing_files.append(f"{parts[0]}/{parts[1]}.mid")

print("\n작업 완료!")
print(f"총 파일 수: {total_files}")
print(f"복사된 파일 수: {copied_files}")
print(f"건너뛴 파일 수: {skipped_files}")

# 누락된 파일 목록 출력
if missing_files:
    print("\n누락된 파일 목록 (최대 10개):")
    for i, missing_file in enumerate(missing_files[:10]):
        print(f"  {missing_file}")
    
    if len(missing_files) > 10:
        print(f"  ... 외 {len(missing_files) - 10}개 더 있음")

# 특정 파일이 누락되었는지 확인 (예: "Dancing Queen")
if any("Dancing Queen" in file for file in missing_files):
    print("\n'Dancing Queen' 파일이 누락되었습니다. 파일 경로를 확인해 주세요.") 