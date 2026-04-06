import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lmabda関数の定義
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
