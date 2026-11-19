# 신의주 A3 포스터 생성기

테스트용 이미지 레이어를 조합해 A3 세로 포스터 이미지를 생성하는 정적 웹앱입니다.

## 배포용 실행

다른 PC에 전달할 때는 `dist/siniju-a3-poster-generator.zip`을 전달합니다. 압축을 푼 뒤 `start_poster_generator.bat`을 실행하면 브라우저에서 사용할 수 있습니다.

설치형 앱으로 쓰려면 `start_poster_generator.bat`으로 실행한 `http://localhost:8088/` 화면에서 `앱 설치` 버튼 또는 Chrome/Edge의 설치 아이콘을 사용합니다.

## 사용 방법

1. 이 폴더에서 로컬 서버를 실행합니다.
2. 브라우저에서 `http://localhost:8000`을 엽니다.
3. 상단 꾸밈영역, 메뉴 이미지, 가격, 하단 로고를 선택합니다.
4. `이미지 내보내기`를 눌러 PNG 또는 JPG로 저장합니다.

각 선택 영역은 검색형 드롭다운입니다. 입력창을 클릭해 목록에서 고르거나, 메뉴명/가격 일부를 입력한 뒤 Enter로 선택할 수 있습니다.

```powershell
& 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8000
```

## 파일 구성 규칙

이미지는 `테스트용이미지모음` 폴더에 넣고 `manifest.json`에 파일명을 추가합니다.
파일을 직접 열어 사용하는 경우에는 `manifest.js`에도 같은 파일명을 추가합니다.
파일명이 늘어나는 경우 `update_manifest.py`로 자동 갱신할 수 있습니다.

- `footer_` : 하단 로고영역
- `head_` : 상단 꾸밈영역
- `image_` : 메뉴 이미지와 메뉴명 영역
- `price_` : 가격 선택영역

현재 작업 기준 캔버스는 `1684 x 2382px`입니다. 300dpi 기준 내보내기는 `3508 x 4961px`로 확대 저장합니다.

## CMYK JPG 변환

브라우저에서 바로 저장되는 JPG는 RGB입니다. 인쇄용 CMYK JPG가 필요하면 내보낸 PNG/JPG를 아래 스크립트로 변환합니다.

```powershell
& 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' convert_to_cmyk.py '.\sample_A3_곰탕_10000.png' '.\sample_A3_곰탕_10000_CMYK.jpg'
```

인쇄소에서 CMYK ICC 프로파일을 제공하면 `--icc` 옵션으로 지정합니다.

```powershell
& 'C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' convert_to_cmyk.py '.\poster.png' '.\poster_CMYK.jpg' --icc '.\profiles\print_profile.icc'
```
