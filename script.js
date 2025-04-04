let midiTempo = 120;
let fileList = null;
let currentFileType = 'top50'; // 기본값은 top50
const MAX_VISIBLE_OPTIONS = 30; // 한 번에 표시할 최대 옵션 수
const MAX_TEXT_LENGTH = 60; // 옵션 텍스트 최대 길이

// 텍스트 길이 제한 함수
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// 파일 리스트를 로드하는 함수
async function loadFileList() {
  try {
    console.log('Loading file list...');
    const filePath = currentFileType === 'top50' 
      ? 'demo_src/ours_0.99_with_clamp_0.99_removing_list_as_names_lmd_clean_lmd_full_top_50_duplicates.json'
      : 'demo_src/ours_0.99_with_clamp_0.99_removing_list_as_names_lmd_clean_lmd_full.json';
    
    const response = await fetch(filePath);
    fileList = await response.json();
    console.log('File list loaded:', fileList);
    
    // 아티스트 목록 채우기
    const artistSelect = document.getElementById('artistSelect');
    artistSelect.innerHTML = '<option value="">Select Artist - Song</option>'; // 초기화
    const artists = Object.keys(fileList).sort(); // 알파벳 순으로 정렬
    
    // 아티스트 그룹화 (알파벳 첫 글자별)
    const artistGroups = {};
    artists.forEach(artist => {
      const firstLetter = artist[0].toUpperCase();
      if (!artistGroups[firstLetter]) {
        artistGroups[firstLetter] = [];
      }
      artistGroups[firstLetter].push(artist);
    });
    
    // 그룹화된 아티스트를 옵션으로 추가
    const letters = Object.keys(artistGroups).sort();
    letters.forEach(letter => {
      // 알파벳 그룹 헤더 추가
      const optgroup = document.createElement('optgroup');
      optgroup.label = `${letter} (${artistGroups[letter].length})`;
      
      // 그룹 내 아티스트 추가
      artistGroups[letter].forEach(artist => {
        const [artistName, songName] = artist.split('__');
        const option = document.createElement('option');
        option.value = artist;
        // 중복 파일 개수 가져오기
        const duplicateCount = fileList[artist]['remove_file_list'].length;
        // 텍스트 길이 제한 (중복 개수 포함)
        option.textContent = truncateText(`${artistName} - ${songName} (${duplicateCount} duplicates)`, MAX_TEXT_LENGTH);
        // 전체 텍스트를 title 속성에 추가하여 마우스 오버 시 전체 텍스트 표시
        option.title = `${artistName} - ${songName} (${duplicateCount} duplicates)`;
        optgroup.appendChild(option);
      });
      
      artistSelect.appendChild(optgroup);
    });
    
    console.log('Artist list populated');
    
    // ABBA - Dancing Queen 찾아서 자동 선택
    let abbaFound = false;
    for (const artist of artists) {
      if (artist.toLowerCase().includes('abba') && artist.toLowerCase().includes('dancing queen')) {
        artistSelect.value = artist;
        updateMidiList(); // MIDI 목록 업데이트
        abbaFound = true;
        console.log('ABBA - Dancing Queen 찾아서 선택됨:', artist);
        break;
      }
    }
    
    // ABBA - Dancing Queen이 없다면 A로 시작하는 첫 번째 옵션 선택
    if (!abbaFound && artistGroups['A'] && artistGroups['A'].length > 0) {
      artistSelect.value = artistGroups['A'][0];
      updateMidiList();
      console.log('A로 시작하는 첫 번째 곡 선택됨:', artistGroups['A'][0]);
    }
    
  } catch (error) {
    console.error('Error loading file list:', error);
  }
}

// MIDI 목록 업데이트
function updateMidiList() {
  const artistSelect = document.getElementById('artistSelect');
  const midiSelect = document.getElementById('midiSelect');
  const originPlayer = document.getElementById('originPlayer');
  const originVisualizer = document.getElementById('originVisualizer');
  const retrievedPlayer = document.getElementById('retrievedPlayer');
  const retrievedVisualizer = document.getElementById('retrievedVisualizer');
  
  // MIDI 선택 초기화
  midiSelect.innerHTML = '<option value="">Select detected duplicate</option>';
  
  // Retrieved 부분 초기화
  retrievedPlayer.src = '';
  retrievedVisualizer.src = '';
  document.querySelectorAll('.comparison-item h4')[1].textContent = 'Detected duplicate file';
  document.querySelectorAll('.comparison-item .file-path')[1].textContent = '';
  document.querySelectorAll('.comparison-item .loading-message')[1].style.display = 'block';
  
  if (artistSelect.value) {
    const artist = artistSelect.value;
    const survivedFile = fileList[artist].survived_file;
    const removeFiles = fileList[artist].remove_file_list.sort(); // 알파벳 순으로 정렬
    
    // Origin 파일 설정
    const [originHash, originFilename] = survivedFile.split('__');
    const originPath = `demo_src/lmd_full_top_50_dup_clusters_lmd_clean_query/${originHash}/${originFilename}.mid`;
    originPlayer.src = originPath;
    originVisualizer.src = originPath;
    setupVisualizer('originVisualizer');
    
    // Survived file 텍스트 업데이트
    document.querySelector('.comparison-item h4').textContent = 'Survived file (largest note count)';
    document.querySelector('.comparison-item .file-path').textContent = `${originHash}/${originFilename}.mid`;
    
    // 파일이 많은 경우 그룹화
    if (removeFiles.length > MAX_VISIBLE_OPTIONS) {
      // 파일 그룹화 (해시의 첫 문자 기준)
      const fileGroups = {};
      removeFiles.forEach(file => {
        const hashChar = file[0].toUpperCase();
        if (!fileGroups[hashChar]) {
          fileGroups[hashChar] = [];
        }
        fileGroups[hashChar].push(file);
      });
      
      // 그룹화된 파일을 옵션으로 추가
      const hashChars = Object.keys(fileGroups).sort();
      hashChars.forEach(hashChar => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${hashChar} (${fileGroups[hashChar].length})`;
        
        fileGroups[hashChar].forEach(file => {
          const [hash, hashFull] = file.split('__');
          const option = document.createElement('option');
          option.value = file;
          const optionText = `${hash}/${hashFull}.mid`;
          // 텍스트 길이 제한
          option.textContent = truncateText(optionText, MAX_TEXT_LENGTH);
          // 전체 텍스트를 title 속성에 추가
          option.title = optionText;
          optgroup.appendChild(option);
        });
        
        midiSelect.appendChild(optgroup);
      });
    } else {
      // 파일이 적을 경우 그냥 추가
      removeFiles.forEach(file => {
        const [hash, hashFull] = file.split('__');
        const option = document.createElement('option');
        option.value = file;
        const optionText = `${hash}/${hashFull}.mid`;
        // 텍스트 길이 제한
        option.textContent = truncateText(optionText, MAX_TEXT_LENGTH);
        // 전체 텍스트를 title 속성에 추가
        option.title = optionText;
        midiSelect.appendChild(option);
      });
    }

    // 첫 번째 중복 파일 자동 선택
    if (removeFiles.length > 0) {
      midiSelect.value = removeFiles[0];
      updateVisualizer();
    }
  }
}

// 비주얼라이저 업데이트
function updateVisualizer() {
  const artistSelect = document.getElementById('artistSelect');
  const midiSelect = document.getElementById('midiSelect');
  const retrievedPlayer = document.getElementById('retrievedPlayer');
  const retrievedVisualizer = document.getElementById('retrievedVisualizer');

  if (artistSelect.value && midiSelect.value) {
    const artist = artistSelect.value;
    const retrievedFile = midiSelect.value;

    // Retrieved 파일 경로 설정
    const [retrievedHash, retrievedFilename] = retrievedFile.split('__');
    const retrievedPath = `demo_src/lmd_full_top_50_dup_clusters_lmd_clean_query/${retrievedHash}/${retrievedFilename}.mid`;

    console.log('Retrieved path:', retrievedPath);
    
    // Retrieved 파일 설정
    retrievedPlayer.src = retrievedPath;
    retrievedVisualizer.src = retrievedPath;
    setupVisualizer('retrievedVisualizer');

    // Detected duplicate 텍스트 업데이트
    document.querySelectorAll('.comparison-item h4')[1].textContent = 'Detected duplicate file';
    document.querySelectorAll('.comparison-item .file-path')[1].textContent = `${retrievedHash}/${retrievedFilename}.mid`;
  }
}

// 페이지가 로드될 때 파일 리스트 로드 및 비주얼라이저 설정
window.onload = () => {
  console.log("페이지 로드 완료");
  loadFileList();
  
  // 네비게이션 메뉴 활성화 상태 관리
  setupNavigation();
  
  // 비주얼라이저 설정
  const originVisualizer = document.getElementById('originVisualizer');
  const retrievedVisualizer = document.getElementById('retrievedVisualizer');
  
  if(originVisualizer) {
    originVisualizer.onloadeddata = () => {
      console.log("Origin visualizer loaded");
      setupVisualizer('originVisualizer');
      // 메인 컨테이너 영역 스크롤바 초기화
      fixMainContentScrollbars(originVisualizer);
    };
  }
  
  if(retrievedVisualizer) {
    retrievedVisualizer.onloadeddata = () => {
      console.log("Retrieved visualizer loaded");
      setupVisualizer('retrievedVisualizer');
      // 메인 컨테이너 영역 스크롤바 초기화
      fixMainContentScrollbars(retrievedVisualizer);
    };
  }
  
  
  // 페이지가 로드된 후 모든 비주얼라이저의 높이를 동기화
  const visualizers = document.querySelectorAll('midi-visualizer');
  visualizers.forEach(visualizer => {
    visualizer.onloadeddata = () => {
      console.log(`Visualizer ${visualizer.id} loaded`);
      setupVisualizer(visualizer.id);
      // 메인 컨테이너 영역 비주얼라이저 중복 스크롤바 방지
      if (visualizer.id === 'originVisualizer' || visualizer.id === 'retrievedVisualizer') {
        fixMainContentScrollbars(visualizer);
      }
      if(visualizerLoadStatus) {
        visualizerLoadStatus[visualizer.id] = true;
      }
    };
  });
  
  // 페이지 로드 완료 후 추가 지연을 통해 SVG 생성 보장
  setTimeout(initHeightSynchronization, 1000);
  
  // 메인 컨테이너 스크롤바 문제 해결을 위한 추가 딜레이
  setTimeout(fixAllScrollbars, 2000);
};

function calculatePixelsPerTimeStep(bpm) {
  const beatsPerMeasure = 4;
  const measures = 8;
  const totalBeats = beatsPerMeasure * measures;
  const durationInSeconds = totalBeats / (bpm / 60);
  const totalPixelWidth = 800;
  const pixelsPerSecond = totalPixelWidth / durationInSeconds;
  return pixelsPerSecond;
}

function setupVisualizer(visualizerId) {
  const midiVisualizer = document.getElementById(visualizerId);
  const pixelsPerTimeStep = calculatePixelsPerTimeStep(midiTempo);
  
  midiVisualizer.config = {
    noteHeight: 4,
    pixelsPerTimeStep: pixelsPerTimeStep,
    minPitch: 22
  };

  // 비주얼라이저를 표시하고 로딩 메시지 숨기기
  midiVisualizer.style.display = 'block';
  midiVisualizer.parentElement.querySelector('.loading-message').style.display = 'none';
}

// 각 비교 쌍의 ID를 등록
const comparisonPairs = [
  { query: 'originHardVisualizer', retrieved: 'retrievedHardVisualizer' },
  { query: 'originSoftVisualizer', retrieved: 'retrievedSoftVisualizer' },
  { query: 'originSimilarVisualizer', retrieved: 'retrievedSimilarVisualizer' },
  { query: 'originIrrelevant2Visualizer', retrieved: 'retrievedIrrelevant2Visualizer' },
  { query: 'originIrrelevantVisualizer', retrieved: 'retrievedIrrelevantVisualizer' },
  { query: 'originIrrelevant4Visualizer', retrieved: 'retrievedIrrelevant4Visualizer' },
  { query: 'originIrrelevant3Visualizer', retrieved: 'retrievedIrrelevant3Visualizer' }
];

// 비주얼라이저 로드 상태 추적
const visualizerLoadStatus = {};
comparisonPairs.forEach(pair => {
  visualizerLoadStatus[pair.query] = false;
  visualizerLoadStatus[pair.retrieved] = false;
});

// SVG 요소가 생성되었는지 확인
const svgReadyStatus = {};
comparisonPairs.forEach(pair => {
  svgReadyStatus[pair.query] = false;
  svgReadyStatus[pair.retrieved] = false;
});



// 모든 비주얼라이저 쌍의 높이 동기화 초기화
function initHeightSynchronization() {
  comparisonPairs.forEach(pair => {
    const queryVisualizer = document.getElementById(pair.query);
    const retrievedVisualizer = document.getElementById(pair.retrieved);
    
    // 각 비주얼라이저에 MutationObserver 설정
    observeSVGCreation(queryVisualizer, pair);
    observeSVGCreation(retrievedVisualizer, pair);
  });
}

// SVG 요소의 생성을 감지하는 MutationObserver 설정
function observeSVGCreation(visualizer, pair) {
  if (!visualizer) return;
  
  const observer = new MutationObserver((mutations, obs) => {
    const svg = visualizer.querySelector('svg');
    if (svg) {
      // 해당 비주얼라이저의 SVG 준비 상태 업데이트
      const vizId = visualizer.id;
      svgReadyStatus[vizId] = true;
      
      // 쌍이 모두 준비되었는지 확인
      if (svgReadyStatus[pair.query] && svgReadyStatus[pair.retrieved]) {
        // 이미 동기화 되었는지 확인하기 위한 플래그
        if (!pair.synchronized) {
          pair.synchronized = true;
          // 약간의 지연 후 높이 동기화 (렌더링 완료 보장)
          setTimeout(() => {
            synchronizeVisualizerHeights(pair.query, pair.retrieved);
            obs.disconnect(); // 동기화 후 observer 중지
          }, 500);
        }
      }
    }
  });
  
  observer.observe(visualizer, { childList: true, subtree: true });
}

// ID로 쌍 찾기
function findPairById(id) {
  for (const pair of comparisonPairs) {
    if (pair.query === id || pair.retrieved === id) {
      return pair;
    }
  }
  return null;
}

// 비주얼라이저 높이 동기화
function synchronizeVisualizerHeights(queryId, retrievedId) {
  const queryVisualizer = document.getElementById(queryId);
  const retrievedVisualizer = document.getElementById(retrievedId);
  
  // 각 비주얼라이저 SVG 요소 찾기
  const querySvg = queryVisualizer.querySelector('svg');
  const retrievedSvg = retrievedVisualizer.querySelector('svg');
  
  if (querySvg && retrievedSvg) {
    // 기존 스타일 제거 (이전 동기화로 인한 인라인 스타일 초기화)
    const resetElements = [querySvg, retrievedSvg];
    resetElements.forEach(el => {
      if (el.style) {
        el.style.maxHeight = '';
        el.style.overflow = '';
      }
    });
    
    // 각 SVG 내의 content 그룹 요소 (실제 노트를 포함하는 그룹)
    const queryContentG = querySvg.querySelector('g.content');
    const retrievedContentG = retrievedSvg.querySelector('g.content');
    
    // content 그룹의 실제 높이 계산
    let queryHeight = 0;
    let retrievedHeight = 0;
    
    if (queryContentG) {
      const queryBox = queryContentG.getBBox();
      queryHeight = queryBox.height + 50; // 여백 추가
    }
    
    if (retrievedContentG) {
      const retrievedBox = retrievedContentG.getBBox();
      retrievedHeight = retrievedBox.height + 50; // 여백 추가
    }
    
    // 실제 컨텐츠 높이가 없는 경우 DOM 요소의 높이 사용
    if (queryHeight <= 50) queryHeight = querySvg.getBoundingClientRect().height;
    if (retrievedHeight <= 50) retrievedHeight = retrievedSvg.getBoundingClientRect().height;
    
    // 둘 중 더 큰 높이 사용 (최소 300px 보장)
    const maxHeight = Math.max(queryHeight, retrievedHeight, 300);
    
    console.log(`Synchronizing heights for ${queryId} (${queryHeight}px) and ${retrievedId} (${retrievedHeight}px) to ${maxHeight}px`);
    
    // SVG 높이 설정
    querySvg.setAttribute('height', maxHeight);
    retrievedSvg.setAttribute('height', maxHeight);
    
    // SVG 요소에 오버플로우 숨김 직접 적용
    querySvg.style.overflow = 'visible';
    retrievedSvg.style.overflow = 'visible';
    
    // 컨테이너들의 오버플로우 설정
    const queryContainer = querySvg.closest('.piano-roll-visualizer');
    const retrievedContainer = retrievedSvg.closest('.piano-roll-visualizer');
    
    if (queryContainer && retrievedContainer) {
      // 컨테이너 높이 설정 및 오버플로우 속성 설정
      queryContainer.style.height = `${maxHeight}px`;
      retrievedContainer.style.height = `${maxHeight}px`;
      queryContainer.style.maxHeight = 'none';
      retrievedContainer.style.maxHeight = 'none';
      queryContainer.style.overflow = 'hidden';
      retrievedContainer.style.overflow = 'hidden';
    }
    
    // 부모 midi-visualizer 요소의 오버플로우 설정
    queryVisualizer.style.overflow = 'hidden';
    retrievedVisualizer.style.overflow = 'hidden';
    
    // 추가로 컨테이너 div의 높이도 조정 - 이 부분 수정
    const queryItem = queryVisualizer.closest('.comparison-item2');
    const retrievedItem = retrievedVisualizer.closest('.comparison-item2');
    
    if (queryItem && retrievedItem) {
      // 기존 minHeight 스타일 제거
      queryItem.style.minHeight = '';
      retrievedItem.style.minHeight = '';
      
      // 실제 콘텐츠 높이만 비교 (midi-player의 높이 + midi-visualizer의 높이)
      const queryPlayerHeight = queryItem.querySelector('midi-player')?.offsetHeight || 0;
      const retrievedPlayerHeight = retrievedItem.querySelector('midi-player')?.offsetHeight || 0;
      
      // 필요한 경우에만 최소 높이 설정 (큰 차이가 있을 때)
      const queryTotalHeight = maxHeight + queryPlayerHeight + 16; // 16px은 패딩
      const retrievedTotalHeight = maxHeight + retrievedPlayerHeight + 16;
      
      if (Math.abs(queryTotalHeight - retrievedTotalHeight) > 10) {
        const totalMaxHeight = Math.max(queryTotalHeight, retrievedTotalHeight);
        // 높이 차이가 있을 때만 설정
        queryItem.style.height = `${totalMaxHeight}px`;
        retrievedItem.style.height = `${totalMaxHeight}px`;
      }
    }
  }
}

// 페이지 로드 완료 후 추가적인 동기화 시도
window.addEventListener('load', function() {
  // DOMContentLoaded 후 추가 시간을 두고 다시 한번 동기화 시도
  setTimeout(() => {
    comparisonPairs.forEach(pair => {
      synchronizeVisualizerHeights(pair.query, pair.retrieved);
    });
  }, 2000);
  
  // 윈도우 리사이즈 시에도 높이 동기화
  window.addEventListener('resize', function() {
    comparisonPairs.forEach(pair => {
      synchronizeVisualizerHeights(pair.query, pair.retrieved);
    });
  });
});

// 네비게이션 메뉴 설정
function setupNavigation() {
  // 스크롤 이벤트에 의한 자동 활성화 방지를 위한 플래그
  let userClicked = false;
  let clickTimeout;
  
  // 네비게이션 링크 클릭 시 스무스 스크롤 적용
  const navLinks = document.querySelectorAll('.navigation a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        // 스크롤 이벤트 핸들러 일시 중지
        userClicked = true;
        clearTimeout(clickTimeout);
        
        // 클릭한 링크 즉시 활성화
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // 스무스 스크롤
        window.scrollTo({
          top: targetElement.offsetTop - 20,
          behavior: 'smooth'
        });
        
        // 스크롤 완료 후 스크롤 이벤트 핸들러 다시 활성화
        clickTimeout = setTimeout(() => {
          userClicked = false;
        }, 1000); // 스크롤 완료에 충분한 시간
      }
    });
  });
  
  // 스크롤 이벤트 리스너 추가 (클릭 시에는 비활성화)
  window.addEventListener('scroll', function() {
    if (!userClicked) {
      updateActiveNavigation();
    }
  });
  
  // 초기 상태 설정
  // 페이지 로드 시 기본으로 Title & Abstract 메뉴 활성화
  if (window.scrollY < 100) { // 스크롤 위치가 최상단일 때
    navLinks.forEach(link => link.classList.remove('active'));
    navLinks[0].classList.add('active'); // 첫 번째 링크(Title & Abstract) 활성화
  } else {
    // 다른 위치에서 페이지가 로드된 경우 스크롤 위치에 맞는 메뉴 활성화
    updateActiveNavigation();
  }
}

// 스크롤 위치에 따라 활성화된 메뉴 업데이트 (깜빡임 방지 개선)
function updateActiveNavigation() {
  const sections = [
    document.getElementById('title_abstract'),
    document.getElementById('duplicates'),
    document.getElementById('types'),
    document.getElementById('non-duplicates')
  ];
  
  const navLinks = document.querySelectorAll('.navigation a');
  
  // 현재 스크롤 위치 확인
  const scrollPosition = window.scrollY + 100; // 약간의 오프셋 추가
  
  // 각 섹션의 위치 확인하여 현재 활성화해야 할 링크 결정
  let activeIndex = 0;
  sections.forEach((section, index) => {
    if (section && scrollPosition >= section.offsetTop) {
      activeIndex = index;
    }
  });
  
  // 현재 활성화된 링크와 새로 활성화할 링크가 다를 때만 클래스 변경
  const currentActive = document.querySelector('.navigation a.active');
  const newActive = navLinks[activeIndex];
  
  if (currentActive !== newActive) {
    navLinks.forEach(link => link.classList.remove('active'));
    newActive.classList.add('active');
  }
}

// 메인 컨테이너 스크롤바 문제 해결을 위한 추가 딜레이
function fixAllScrollbars() {
  // 구현 코드 필요
}

// 메인 컨테이너 영역 스크롤바 초기화
function fixMainContentScrollbars(visualizer) {
  // 구현 코드 필요
}