# Hello World 環境構築手順

## 0. AWS CLIの認証設定

### AWSコンソールでアクセスキーを発行

1. IAM → ユーザー → ユーザーを作成
2. 許可ポリシー：`AdministratorAccess`
3. 作成後：セキュリティ認証情報 → アクセスキーを作成
4. Access Key IDとSecret Access Keyをメモ

### ターミナルで設定

```bash
aws configure
# AWS Access Key ID:     （メモした値）
# AWS Secret Access Key: （メモした値）
# Default region name:   ap-northeast-1
# Default output format: json
```

### 確認

```bash
# アカウント情報が返ってきたらOK
aws sts get-caller-identity
```

---

## 1. CDKプロジェクトの初期化

```bash
cd infra
cdk init app --language typescript
```

生成されるファイル構成：

```
infra/
├── bin/
│   └── infra.ts       # エントリーポイント
├── lib/
│   └── infra-stack.ts # インフラ定義
├── cdk.json
└── package.json
```

---

## 2. aws-cdk-lib のインストール確認

`cdk init` 実行時に自動でインストールされています。念のため確認：

```bash
cat package.json | grep aws-cdk-lib
```

`"aws-cdk-lib": "2.x.x"` が表示されればOK。

---

## 3. Lambda関数のコードを作成

`infra/lambda/` ディレクトリを作成してから、ハンドラーを書きます。

```bash
mkdir lambda
```

`lambda/hello.ts` を作成：

```typescript
export const handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello World" }),
  };
};
```

---

## 4. lib/infra-stack.ts を編集

LambdaとAPI Gatewayを定義します。

```typescript
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda関数の定義
    const helloFn = new lambda.Function(this, "HelloFunction", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "hello.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda"), {
        bundling: {
          image: lambda.Runtime.NODEJS_22_X.bundlingImage,
          command: [
            "bash",
            "-c",
            "npx esbuild hello.ts --bundle --platform=node --target=node22 --outfile=/asset-output/hello.js",
          ],
        },
      }),
    });

    // API Gatewayの定義
    new apigw.LambdaRestApi(this, "HelloApi", {
      handler: helloFn,
    });
  }
}
```

> **ポイント**
> - `lambda.Function` でLambda関数を定義
> - `apigw.LambdaRestApi` でAPI GatewayとLambdaを紐付け
> - `bundling` でTypeScriptをビルドしてデプロイ用にまとめる

---

## 5. bin/infra.ts を確認

初期化時に自動生成されています。スタック名が正しいか確認します。

```typescript
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { InfraStack } from "../lib/infra-stack";

const app = new cdk.App();
new InfraStack(app, "InfraStack");
```

---

## 6. デプロイ前の差分確認（任意）

実際にデプロイする前に何が作られるか確認できます。

```bash
cdk diff
```

---

## 7. デプロイ

```bash
cdk deploy
```

途中で以下のような確認が出たら `y` を入力：

```
Do you wish to deploy these changes (y/n)? y
```

---

## 8. 動作確認

デプロイ完了後、ターミナルに以下のようなURLが表示されます：

```
Outputs:
CdkHelloworldStack.HelloApiEndpoint = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

ブラウザまたはcurlで叩いてみる：

```bash
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
# → {"message":"Hello World"}
```

---

## 9. 後片付け（環境削除）

検証が終わったらリソースを削除してAWSの課金を止めます：

```bash
cdk destroy
```
