# shudan-toko-maker
要望に応じて登校班編成表、旗当番シフト表を生成してくれるツール

## Docker開発手順

### 1) 依存ライブラリを初期インストール（1回実行）
`docker-compose.init.yml` を使って、コンテナ内で `npm ci` または `npm i` を実行します。

```bash
docker compose -f docker-compose.init.yml run --rm init
```

- `./shudan-toko-maker` を `/app` にマウントし、UID=1000で実行します。
- `node_modules` はコンテナ内に保持されるため、ホスト側の依存管理は不要です。

### 2) 開発サーバを起動
`docker-compose.dev.yml` で開発コンテナを起動し、`npm run dev` を実行します。

```bash
docker compose -f docker-compose.dev.yml up
```

- ブラウザで `http://localhost:3000` にアクセスします。
- ホットリロードで変更が反映されます。

### 3) 開発中に依存を追加・更新する場合
ホストまたはコンテナ内で `npm install` / `npm ci` を実行できます。
コンテナ内で実行する場合は `docker compose -f docker-compose.dev.yml run --rm web npm install` のようにします。

### 4) コンテナ停止
```bash
docker compose -f docker-compose.dev.yml down
```

