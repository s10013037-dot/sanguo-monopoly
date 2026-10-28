# 三國萌將大富翁

使用 React、TypeScript、Vite 製作的繁體中文瀏覽器棋盤遊戲。無需帳號、伺服器或 API 金鑰，所有插畫與資產都隨專案提供。

## 在瀏覽器遊玩

建議使用 Node.js 22 或 24（本次驗證為 24.19.0）。

```bash
npm ci
npm run dev
```

本機瀏覽器開啟終端顯示的網址（預設 http://localhost:5173/sanguo-monopoly/）。若在雲端工作區，請在平台的連接埠／Ports 功能轉送 **5173**，再開啟該平台提供的網址。

```bash
npm run build   # TypeScript 檢查與正式版打包到 dist/
npm run preview # 正式版預覽，預設 4173 連接埠
npm test        # 遊戲規則與存檔測試
npm run test:e2e # Chromium 真實瀏覽器測試
```

瀏覽器測試預設使用 `/usr/bin/chromium`；其他系統可安裝 Chromium 並以 `CHROMIUM_PATH` 指定執行檔。亦可執行 `npx playwright install chromium`，並將 `CHROMIUM_PATH` 指向下載的 Chromium 執行檔。

## 玩法

- 選擇劉備、曹操、孫權或董卓，與另外三位電腦主公輪流行動。
- 按「擲骰子，出發！」逐格移動。結算後按「結束回合」，電腦會自行完成回合。
- 24 格棋盤包含招賢城池、補給、奇遇、戰場與桃園起點。
- 城池自動招募未擁有的武將，消耗標示的招募身價；缺錢時改為協助城務。每位主公可獨立招募同一位名將。
- 軍隊戰力為基礎 20 加上所有武將戰力；戰鬥每輪造成戰力 55% 的傷害（四捨五入），守軍存活時反擊 24 點。勝利獲得 280 金，失敗最多損失 150 金。「跳過戰鬥」只快轉，不改變結果。
- 十二輪（48 回合）後，以金錢加上已招募武將的身價排名；平手依玩家順序排列。
- 每次狀態變化都儲存至瀏覽器 localStorage，重新整理會接續行軍、電腦回合或戰鬥。同一瀏覽器、同一網站保留一份存檔；清除網站資料會移除進度。不支援跨裝置同步，也請避免同時開多個遊戲分頁。
- 音效預設關閉，可在右上角開啟；目前提供擲骰提示音。

## 專案結構

- `src/game.ts`：獨立的回合、事件、招募、戰鬥與存檔規則。
- `src/main.tsx`：棋盤、主公與武將 UI、動畫計時、自動儲存。
- `src/style.css`：山水棋盤、CSS Q 版主公肖像、響應式介面與減少動態效果支援。
- `src/game.test.ts`、`tests/game.pw.ts`：規則測試與瀏覽器整合測試。

第一版使用自製 SVG 山水、CSS 主公肖像與系統 emoji 武將圖示；emoji 外觀依作業系統而異。尚未加入線上多人、土地買賣或跨裝置存檔。


## GitHub Pages 自動發布

網站子路徑固定為 `/sanguo-monopoly/`。儲存庫的 **Settings → Pages → Source** 請選擇 **GitHub Actions**。

1. 將部署設定的 Pull Request 合併到 `main`。
2. 到 **Actions → Deploy game to GitHub Pages** 查看最新執行。
3. `build` 與 `deploy` 都顯示綠色勾號後，點開 `deploy` 的網站連結，或到 **Settings → Pages → Visit site**。
4. 預期網址為 https://s10013037-dot.github.io/sanguo-monopoly/ 。首次發布可能需要幾分鐘才可瀏覽。

往後每次更新 `main` 都會自動安裝依賴、執行規則測試、建置並發布 `dist/`。PR 只執行測試與建置，不會部署。也可在 Actions 的 **Run workflow** 選擇 `main` 手動重試。

流程採用 GitHub 官方 Pages Actions，固定至官方範例的完整 commit SHA，並使用 `github-pages` 部署環境與 GitHub 自動提供的權限，不需要設定個人存取權杖。
