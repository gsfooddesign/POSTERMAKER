# GitHub 메뉴 관리

`테스트용이미지모음` 폴더에 `image_메뉴명.png` 파일을 업로드하고 커밋합니다.
Actions의 `Update menu list`가 완료되면 메뉴 목록과 이미지 캐시 버전이 자동 갱신됩니다.
같은 이름의 이미지를 교체해도 캐시 버전이 갱신됩니다.

이 저장소는 웹 실행용이며 `local-assets`와 ZIP, Illustrator 원본, 작업 임시 파일은 포함하지 않습니다.
다운로드해서 `index.html`을 직접 열려면 Python으로 `update_manifest.py`를 먼저 실행하세요.
로컬 서버로 사용할 때는 `start_poster_generator.bat`를 실행할 수 있습니다.

저장소 업로드와 웹사이트 배포는 별개입니다. GitHub Pages 등 호스팅 설정 후 웹 주소로 사용할 수 있습니다.
브라우저 JPG 출력은 RGB이며 CMYK 변환은 별도 처리입니다.
