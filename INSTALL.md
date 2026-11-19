# 배포 및 설치 안내

이 폴더는 다른 PC에 그대로 전달해서 사용할 수 있는 포터블 웹앱입니다.

## 가장 쉬운 배포 방법

1. `dist/siniju-a3-poster-generator.zip` 파일을 전달합니다.
2. 받는 사람이 원하는 위치에 압축을 풉니다.
3. `start_poster_generator.bat`을 실행합니다.
4. 브라우저가 열리면 포스터를 선택하고 이미지를 내보냅니다.

Python이 설치되어 있으면 `http://localhost:8088/`로 열리고, Chrome/Edge에서 앱 설치가 가능합니다. Python이 없으면 `index.html`을 직접 여는 방식으로 실행됩니다.

## 앱 설치 방식

설치 버튼은 `file://`로 직접 열었을 때는 표시되지 않을 수 있습니다. 설치형으로 쓰려면 `start_poster_generator.bat`으로 실행한 뒤 브라우저 주소가 `http://localhost:8088/`인지 확인합니다.

Chrome 또는 Edge에서 주소창 오른쪽의 설치 아이콘을 누르거나, 화면 왼쪽의 `앱 설치` 버튼이 보이면 눌러 설치합니다.

## 이미지 추가 후 목록 갱신

이미지를 `테스트용이미지모음` 폴더에 넣고 아래 파일명 규칙을 지킵니다.

- `head_메뉴명.png`
- `image_메뉴명.png`
- `price_가격.png`
- `footer_브랜드명.png`

그 다음 아래 명령으로 목록 파일을 갱신합니다.

```powershell
python update_manifest.py
```

OneDrive가 `manifest.json`을 잠그고 있으면 `manifest.generated.json`, `manifest.generated.js`가 생성됩니다. 이 경우 브라우저와 미리보기 창을 닫은 뒤 생성된 파일명을 각각 `manifest.json`, `manifest.js`로 바꾸면 됩니다.

## CMYK JPG

브라우저에서 바로 저장되는 JPG는 RGB입니다. 인쇄 전달용 CMYK JPG는 `convert_to_cmyk.py`로 변환합니다.

```powershell
python convert_to_cmyk.py ".\poster.png" ".\poster_CMYK.jpg"
```
