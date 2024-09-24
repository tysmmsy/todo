# メモ

- ~~初回ログイン後、リダイレクトができていない箇所の修正~~
  - Amplify Hosting環境でSRのページでprefetchすると空のオブジェクトがキャッシュされ、Minimum TTLが２秒に設定されているため、prefetch後2秒以内にページ遷移するとキャッシュしている空オブジェクトが取得されることで意図しないページ表示がされる
  - Amplify Hostingで作成するCloudFrontのキャッシュポリシーは変更できないためprefetchしないようにstrictに設定した
- 認証認可処理見直し(JWT周り)
- テストコード実装
- UI改善
